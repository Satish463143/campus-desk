const prisma = require("../../config/db.config");
const { DayOfWeek } = require("../../config/constant.config");
const { getCache, setCache, clearCache } = require("../../utils/redisCache");

// Haversine distance in meters
const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

class AttendanceService {
  /*
  |--------------------------------------------------------------------------
  | Utilities
  |--------------------------------------------------------------------------
  */

  normalizeDate(dateInput) {
    const d = new Date(dateInput);

    if (Number.isNaN(d.getTime())) {
      throw { status: 400, message: "Invalid date" };
    }

    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  getDayOfWeek(dateObj) {
    const jsDay = dateObj.getUTCDay();

    const map = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];

    return map[jsDay];
  }

  deriveDailyStatus(statuses) {
    if (statuses.includes("present") || statuses.includes("late")) {
      return "present";
    }

    if (statuses.includes("leave")) {
      return "leave";
    }

    return "absent";
  }

  /*
  |--------------------------------------------------------------------------
  | Validations
  |--------------------------------------------------------------------------
  */

  async validateSection(schoolId, sectionId, classId, academicYearId) {
    const section = await prisma.section.findFirst({
      where: {
        id: sectionId,
        schoolId,
        classId,
        academicYearId,
      },
      select: { id: true },
    });

    if (!section) {
      throw {
        status: 400,
        message: "Invalid section/class/academic year combination",
      };
    }
  }

  async validateTeacher(schoolId, teacherId) {
    const teacher = await prisma.teacherProfile.findFirst({
      where: {
        id: teacherId,
        schoolId,
      },
      select: { id: true },
    });

    if (!teacher) {
      throw { status: 400, message: "Teacher not found in this school" };
    }
  }

  async validateStudentsInSection(sectionId, academicYearId, studentIds) {
    if (!studentIds.length) return;

    const count = await prisma.studentEnrollment.count({
      where: {
        sectionId,
        academicYearId,
        studentId: { in: studentIds },
      },
    });

    if (count !== studentIds.length) {
      throw {
        status: 400,
        message: "Some students are not enrolled in the section",
      };
    }
  }

  async getTimetable(schoolId, sectionId, periodId, date) {
    const dayOfWeek = this.getDayOfWeek(date);

    const timetable = await prisma.timetable.findFirst({
      where: {
        schoolId,
        sectionId,
        periodId,
        dayOfWeek,
        isActive: true,
      },
      select: {
        id: true,
        subjectId: true,
        teacherId: true,
        classId: true,
        classMode: true, // offline | online
      },
    });

    if (!timetable) {
      throw {
        status: 400,
        message: "No scheduled class for this period",
      };
    }

    return timetable;
  }

  async validateTeacherLocation(schoolId, lat, lng) {
    if (lat == null || lng == null) {
      throw {
        status: 400,
        message: "Teacher location required for offline class",
      };
    }

    const cacheKey = `school:geo:${schoolId}`;

    let school = await getCache(cacheKey);

    if (!school) {
      school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          latitude: true,
          longitude: true,
          allowedRadius: true,
        },
      });

      await setCache(cacheKey, school, 3600);
    }

    if (
      !school ||
      school.latitude == null ||
      school.longitude == null ||
      school.allowedRadius == null
    ) {
      return;
    }

    const distance = haversineDistanceMeters(
      school.latitude,
      school.longitude,
      lat,
      lng
    );

    if (distance > school.allowedRadius) {
      throw {
        status: 403,
        message: `Teacher outside school radius (${Math.round(distance)}m)`,
      };
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Student Period Attendance (Sparse Storage)
  |--------------------------------------------------------------------------
  */

  async markPeriodAttendance(schoolId, data) {
    const {
      sectionId,
      classId,
      academicYearId,
      date,
      periodId,
      teacherId,
      attendance, // only absent/late/leave students
      teacherLatitude,
      teacherLongitude,
    } = data;

    const normalizedDate = this.normalizeDate(date);
    const nonPresentIds = attendance.map((item) => item.studentId);

    await Promise.all([
      this.validateSection(schoolId, sectionId, classId, academicYearId),
      this.validateTeacher(schoolId, teacherId),
      this.validateStudentsInSection(sectionId, academicYearId, nonPresentIds),
    ]);

    const timetable = await this.getTimetable(
      schoolId,
      sectionId,
      periodId,
      normalizedDate
    );

    if (timetable.teacherId !== teacherId) {
      throw {
        status: 403,
        message: "Teacher not assigned to this class",
      };
    }

    if (timetable.classId !== classId) {
      throw {
        status: 400,
        message: "Class mismatch with timetable",
      };
    }

    if (timetable.classMode === "offline") {
      await this.validateTeacherLocation(
        schoolId,
        teacherLatitude,
        teacherLongitude
      );
    }

    if (nonPresentIds.length === 0) {
      await clearCache(`attendance:${schoolId}:section:${sectionId}:*`);
      await clearCache(`attendance:${schoolId}:student:*`);

      return {
        stored: 0,
        allPresent: true,
        sectionId,
        classId,
        periodId,
        date: normalizedDate,
      };
    }

    const rows = attendance.map((item) => ({
      schoolId,
      academicYearId,
      classId,
      sectionId,
      studentId: item.studentId,
      teacherId,
      subjectId: timetable.subjectId,
      periodId,
      timetableId: timetable.id,
      date: normalizedDate,
      status: item.status,
      remark: item.remark || null,
    }));

    try {
      const result = await prisma.studentAttendance.createMany({
        data: rows,
        skipDuplicates: true,
      });

      await clearCache(`attendance:${schoolId}:section:${sectionId}:*`);
      await clearCache(`attendance:${schoolId}:student:*`);
      await clearCache(`attendance:${schoolId}:date:*`);

      return {
        stored: result.count,
        allPresent: false,
        sectionId,
        classId,
        periodId,
        date: normalizedDate,
      };
    } catch (error) {
      if (error.code === "P2002") {
        throw {
          status: 409,
          message: "Attendance already recorded for one or more students",
        };
      }

      throw error;
    }
  }

  async getPeriodAttendances({
    schoolId,
    academicYearId,
    sectionId,
    studentId,
    date,
    periodId,
    skip = 0,
    limit = 20,
  }) {
    const where = {
      schoolId,
      academicYearId,
    };

    if (sectionId) where.sectionId = sectionId;
    if (studentId) where.studentId = studentId;
    if (periodId) where.periodId = periodId;
    if (date) where.date = this.normalizeDate(date);

    const [data, count] = await Promise.all([
      prisma.studentAttendance.findMany({
        where,
        select: {
          id: true,
          date: true,
          status: true,
          remark: true,
          studentId: true,
          sectionId: true,
          classId: true,
          teacherId: true,
          subjectId: true,
          periodId: true,
          student: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
          section: {
            select: {
              id: true,
              name: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          period: {
            select: {
              id: true,
              name: true,
              periodNumber: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ date: "desc" }, { period: { periodNumber: "asc" } }, { studentId: "asc" }],
        skip,
        take: limit,
      }),
      prisma.studentAttendance.count({ where }),
    ]);

    return { data, count };
  }

  async getSectionDailySummary(schoolId, sectionId, date, academicYearId = null) {
    const normalizedDate = this.normalizeDate(date);
    const dateKey = normalizedDate.toISOString().slice(0, 10);
    const cacheKey = `attendance:${schoolId}:section:${sectionId}:${dateKey}`;

    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const enrollmentWhere = { sectionId };
    if (academicYearId) enrollmentWhere.academicYearId = academicYearId;

    const enrollments = await prisma.studentEnrollment.findMany({
      where: enrollmentWhere,
      select: {
        studentId: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: { studentId: "asc" },
    });

    const rows = await prisma.studentAttendance.findMany({
      where: {
        schoolId,
        sectionId,
        date: normalizedDate,
      },
      select: {
        id: true,
        studentId: true,
        status: true,
        remark: true,
        period: {
          select: {
            id: true,
            name: true,
            periodNumber: true,
          },
        },
      },
      orderBy: [{ studentId: "asc" }, { period: { periodNumber: "asc" } }],
    });

    const sparseMap = new Map();

    for (const row of rows) {
      if (!sparseMap.has(row.studentId)) {
        sparseMap.set(row.studentId, []);
      }

      sparseMap.get(row.studentId).push({
        id: row.id,
        period: row.period,
        status: row.status,
        remark: row.remark,
      });
    }

    const result = enrollments.map(({ studentId, student }) => {
      if (sparseMap.has(studentId)) {
        const periodStatuses = sparseMap.get(studentId);
        const statuses = periodStatuses.map((x) => x.status);

        return {
          studentId,
          student,
          dailyStatus: this.deriveDailyStatus(statuses),
          periodStatuses,
        };
      }

      return {
        studentId,
        student,
        dailyStatus: "present",
        periodStatuses: [],
      };
    });

    await setCache(cacheKey, result, 300);

    return result;
  }

  async getStudentDailySummary(schoolId, studentId, from, to) {
    const fromDate = from
      ? this.normalizeDate(from)
      : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));

    const toDate = to
      ? this.normalizeDate(to)
      : this.normalizeDate(new Date());

    const cacheKey = `attendance:${schoolId}:student:${studentId}:${fromDate
      .toISOString()
      .slice(0, 10)}:${toDate.toISOString().slice(0, 10)}`;

    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const rows = await prisma.studentAttendance.findMany({
      where: {
        schoolId,
        studentId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        date: true,
        status: true,
        remark: true,
        period: {
          select: {
            id: true,
            name: true,
            periodNumber: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { period: { periodNumber: "asc" } }],
    });

    const grouped = new Map();

    for (const row of rows) {
      const dateKey = row.date.toISOString().slice(0, 10);

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          dailyStatus: "present",
          periodStatuses: [],
        });
      }

      grouped.get(dateKey).periodStatuses.push({
        period: row.period,
        subject: row.subject,
        status: row.status,
        remark: row.remark,
      });
    }

    const result = Array.from(grouped.values()).map((item) => {
      const statuses = item.periodStatuses.map((x) => x.status);

      return {
        ...item,
        dailyStatus: this.deriveDailyStatus(statuses),
      };
    });

    await setCache(cacheKey, result, 300);

    return result;
  }

  async getPeriodAttendanceById(id, schoolId) {
    const record = await prisma.studentAttendance.findFirst({
      where: {
        id,
        schoolId,
      },
      select: {
        id: true,
        date: true,
        status: true,
        remark: true,
        studentId: true,
        teacherId: true,
        sectionId: true,
        classId: true,
        periodId: true,
        subjectId: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
        section: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        period: {
          select: {
            id: true,
            name: true,
            periodNumber: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!record) {
      throw { status: 404, message: "Attendance record not found" };
    }

    return record;
  }

  async updatePeriodAttendance(id, schoolId, data) {
    const existing = await prisma.studentAttendance.findFirst({
      where: {
        id,
        schoolId,
      },
      select: {
        id: true,
        sectionId: true,
        studentId: true,
        date: true,
      },
    });

    if (!existing) {
      throw { status: 404, message: "Attendance record not found" };
    }

    const updated = await prisma.studentAttendance.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.remark !== undefined ? { remark: data.remark } : {}),
      },
      select: {
        id: true,
        date: true,
        status: true,
        remark: true,
        studentId: true,
        periodId: true,
      },
    });

    await clearCache(`attendance:${schoolId}:section:${existing.sectionId}:*`);
    await clearCache(`attendance:${schoolId}:student:${existing.studentId}:*`);
    await clearCache(`attendance:${schoolId}:date:*`);

    return updated;
  }

  async deletePeriodAttendance(id, schoolId) {
    const existing = await prisma.studentAttendance.findFirst({
      where: {
        id,
        schoolId,
      },
      select: {
        id: true,
        sectionId: true,
        studentId: true,
      },
    });

    if (!existing) {
      throw { status: 404, message: "Attendance record not found" };
    }

    await prisma.studentAttendance.delete({
      where: { id },
    });

    await clearCache(`attendance:${schoolId}:section:${existing.sectionId}:*`);
    await clearCache(`attendance:${schoolId}:student:${existing.studentId}:*`);
    await clearCache(`attendance:${schoolId}:date:*`);

    return { success: true };
  }

  /*
  |--------------------------------------------------------------------------
  | Teacher Daily Attendance
  |--------------------------------------------------------------------------
  */

  async markTeacherAttendance(schoolId, data) {
    const {
      teacherId,
      date,
      status,
      remark,
      checkInTime,
      checkOutTime,
    } = data;

    const normalizedDate = this.normalizeDate(date);

    await this.validateTeacher(schoolId, teacherId);

    const result = await prisma.teacherAttendance.upsert({
      where: {
        teacherId_date: {
          teacherId,
          date: normalizedDate,
        },
      },
      update: {
        status,
        remark: remark ?? null,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      },
      create: {
        schoolId,
        teacherId,
        date: normalizedDate,
        status,
        remark: remark ?? null,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      },
      select: {
        id: true,
        teacherId: true,
        date: true,
        status: true,
        remark: true,
        checkInTime: true,
        checkOutTime: true,
      },
    });

    await clearCache(`attendance:${schoolId}:teacher:*`);

    return result;
  }

  async getTeacherAttendance({
    schoolId,
    teacherId,
    from,
    to,
    skip = 0,
    limit = 20,
  }) {
    const where = { schoolId };

    if (teacherId) where.teacherId = teacherId;

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = this.normalizeDate(from);
      if (to) where.date.lte = this.normalizeDate(to);
    }

    const [data, count] = await Promise.all([
      prisma.teacherAttendance.findMany({
        where,
        select: {
          id: true,
          teacherId: true,
          date: true,
          status: true,
          remark: true,
          checkInTime: true,
          checkOutTime: true,
          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.teacherAttendance.count({ where }),
    ]);

    return { data, count };
  }

  /*
  |--------------------------------------------------------------------------
  | Analytics / Summary Methods (Principal Dashboard)
  |--------------------------------------------------------------------------
  */

  /**
   * School-wide attendance summary grouped by class.
   * Returns for each class: total enrolled, present count, absent count,
   * late count, leave count, and the attendance percentage.
   */
  async getSchoolAttendanceSummary(schoolId, academicYearId, from, to) {
    const fromDate = from
      ? this.normalizeDate(from)
      : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    const toDate = to ? this.normalizeDate(to) : this.normalizeDate(new Date());

    const cacheKey = `attendance:${schoolId}:school-summary:${academicYearId}:${fromDate.toISOString().slice(0, 10)}:${toDate.toISOString().slice(0, 10)}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    // Fetch all classes for this school/academicYear
    const classes = await prisma.class.findMany({
      where: { schoolId, ...(academicYearId ? { sections: { some: { academicYearId } } } : {}) },
      select: {
        id: true,
        name: true,
        sections: {
          where: academicYearId ? { academicYearId } : {},
          select: {
            id: true,
            name: true,
            _count: { select: { enrollments: { where: academicYearId ? { academicYearId } : {} } } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Fetch non-present attendance records in this date range
    const attendanceWhere = {
      schoolId,
      date: { gte: fromDate, lte: toDate },
      ...(academicYearId ? { academicYearId } : {}),
    };

    const attendanceRows = await prisma.studentAttendance.groupBy({
      by: ["classId", "status"],
      where: attendanceWhere,
      _count: { status: true },
    });

    // Build a map: classId -> { ABSENT: n, LATE: n, LEAVE: n }
    const statusMap = {};
    for (const row of attendanceRows) {
      if (!statusMap[row.classId]) statusMap[row.classId] = {};
      statusMap[row.classId][row.status] = row._count.status;
    }

    // Count total working days (distinct dates) per class
    const distinctDatesPerClass = await prisma.studentAttendance.findMany({
      where: attendanceWhere,
      select: { classId: true, date: true },
      distinct: ["classId", "date"],
    });

    const workingDaysMap = {};
    for (const row of distinctDatesPerClass) {
      if (!workingDaysMap[row.classId]) workingDaysMap[row.classId] = new Set();
      workingDaysMap[row.classId].add(row.date.toISOString().slice(0, 10));
    }

    const result = classes.map((cls) => {
      const totalEnrolled = cls.sections.reduce((sum, s) => sum + s._count.enrollments, 0);
      const statusData = statusMap[cls.id] || {};
      const absentCount = statusData["absent"] || 0;
      const lateCount = statusData["late"] || 0;
      const leaveCount = statusData["leave"] || 0;
      const workingDays = workingDaysMap[cls.id]?.size || 0;
      const totalExpected = totalEnrolled * workingDays;
      const nonPresentCount = absentCount + leaveCount;
      const presentCount = Math.max(0, totalExpected - nonPresentCount);
      const attendancePct = totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 100;

      return {
        classId: cls.id,
        className: cls.name,
        sections: cls.sections.map((s) => ({ id: s.id, name: s.name, enrolled: s._count.enrollments })),
        totalEnrolled,
        workingDays,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        attendancePct,
      };
    });

    await setCache(cacheKey, result, 300);
    return result;
  }

  /**
   * Per-student attendance summary for a specific class/section and date range.
   */
  async getClassAttendanceSummary(schoolId, academicYearId, classId, sectionId, from, to) {
    const fromDate = from
      ? this.normalizeDate(from)
      : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    const toDate = to ? this.normalizeDate(to) : this.normalizeDate(new Date());

    const cacheKey = `attendance:${schoolId}:class-summary:${classId}:${sectionId || "all"}:${fromDate.toISOString().slice(0, 10)}:${toDate.toISOString().slice(0, 10)}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const enrollmentWhere = {
      ...(classId ? { student: { enrollments: { some: { classId } } } } : {}),
      ...(sectionId ? { sectionId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
    };

    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        ...(sectionId ? { sectionId } : {}),
        ...(classId && !sectionId ? { section: { classId } } : {}),
        ...(academicYearId ? { academicYearId } : {}),
      },
      select: {
        studentId: true,
        student: {
          select: {
            id: true,
            user: { select: { name: true, profileImage: true } },
          },
        },
      },
      distinct: ["studentId"],
      orderBy: { studentId: "asc" },
    });

    // Fetch non-present records for these students
    const studentIds = enrollments.map((e) => e.studentId);
    if (studentIds.length === 0) {
      await setCache(cacheKey, [], 300);
      return [];
    }

    const attendanceRows = await prisma.studentAttendance.groupBy({
      by: ["studentId", "status"],
      where: {
        schoolId,
        studentId: { in: studentIds },
        date: { gte: fromDate, lte: toDate },
      },
      _count: { status: true },
    });

    // Count working days
    const workingDaysRows = await prisma.studentAttendance.findMany({
      where: {
        schoolId,
        ...(sectionId ? { sectionId } : classId ? { classId } : {}),
        date: { gte: fromDate, lte: toDate },
      },
      select: { date: true },
      distinct: ["date"],
    });
    const workingDays = workingDaysRows.length;

    const statusMap = {};
    for (const row of attendanceRows) {
      if (!statusMap[row.studentId]) statusMap[row.studentId] = {};
      statusMap[row.studentId][row.status] = row._count.status;
    }

    const result = enrollments.map(({ studentId, student }) => {
      const statusData = statusMap[studentId] || {};
      const absentCount = statusData["absent"] || 0;
      const lateCount = statusData["late"] || 0;
      const leaveCount = statusData["leave"] || 0;
      const presentCount = Math.max(0, workingDays - absentCount - leaveCount);
      const attendancePct = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : 100;

      return {
        studentId,
        studentName: student.user.name,
        profileImage: student.user.profileImage,
        workingDays,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        attendancePct,
      };
    });

    await setCache(cacheKey, result, 300);
    return result;
  }

  /**
   * Aggregated teacher attendance summary for all teachers in a date range.
   */
  async getTeacherAttendanceSummary(schoolId, from, to) {
    const fromDate = from
      ? this.normalizeDate(from)
      : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    const toDate = to ? this.normalizeDate(to) : this.normalizeDate(new Date());

    const cacheKey = `attendance:${schoolId}:teacher-summary:${fromDate.toISOString().slice(0, 10)}:${toDate.toISOString().slice(0, 10)}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const teacherRows = await prisma.teacherAttendance.groupBy({
      by: ["teacherId", "status"],
      where: {
        schoolId,
        date: { gte: fromDate, lte: toDate },
      },
      _count: { status: true },
    });

    const statusMap = {};
    for (const row of teacherRows) {
      if (!statusMap[row.teacherId]) statusMap[row.teacherId] = {};
      statusMap[row.teacherId][row.status] = row._count.status;
    }

    const teacherIds = Object.keys(statusMap);

    // Get latest check-in/out for each teacher in range
    const latestRecords = await prisma.teacherAttendance.findMany({
      where: {
        schoolId,
        teacherId: { in: teacherIds },
        date: { gte: fromDate, lte: toDate },
      },
      select: {
        teacherId: true,
        date: true,
        checkInTime: true,
        checkOutTime: true,
        teacher: {
          select: {
            id: true,
            user: { select: { name: true, profileImage: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const teacherInfoMap = {};
    const latestRecordMap = {};
    for (const rec of latestRecords) {
      if (!teacherInfoMap[rec.teacherId]) {
        teacherInfoMap[rec.teacherId] = rec.teacher;
      }
      if (!latestRecordMap[rec.teacherId]) {
        latestRecordMap[rec.teacherId] = {
          checkInTime: rec.checkInTime,
          checkOutTime: rec.checkOutTime,
        };
      }
    }

    const totalDays = await prisma.teacherAttendance.findMany({
      where: { schoolId, date: { gte: fromDate, lte: toDate } },
      select: { date: true },
      distinct: ["date"],
    });
    const workingDays = totalDays.length;

    const result = teacherIds.map((teacherId) => {
      const statusData = statusMap[teacherId] || {};
      const presentCount = (statusData["present"] || 0) + (statusData["late"] || 0);
      const absentCount = statusData["absent"] || 0;
      const lateCount = statusData["late"] || 0;
      const leaveCount = statusData["leave"] || 0;
      const markedDays = presentCount + absentCount + leaveCount;
      const attendancePct = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : 100;
      const latest = latestRecordMap[teacherId] || {};

      return {
        teacherId,
        teacherName: teacherInfoMap[teacherId]?.user?.name || teacherId,
        profileImage: teacherInfoMap[teacherId]?.user?.profileImage || null,
        workingDays,
        markedDays,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        attendancePct,
        lastCheckIn: latest.checkInTime,
        lastCheckOut: latest.checkOutTime,
      };
    });

    await setCache(cacheKey, result, 300);
    return result;
  }
}

module.exports = new AttendanceService();