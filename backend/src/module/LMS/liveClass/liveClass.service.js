const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Shared minimal selects ────────────────────────────────────────────────
const LIVE_CLASS_SELECT = {
  id: true,
  title: true,
  description: true,
  liveClassType: true,
  joinLink: true,
  platform: true,
  scheduledAt: true,
  endAt: true,
  recordingLink: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  school: { select: { id: true, schoolName: true } },
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true, numericLevel: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true, code: true } },
  period: { select: { id: true, name: true, startTime: true, endTime: true } },
  teacher: { select: { id: true, user: { select: { name: true, email: true } } } },
};

const LIVE_CLASS_LIST_SELECT = {
  id: true,
  title: true,
  liveClassType: true,
  scheduledAt: true,
  endAt: true,
  status: true,
  createdAt: true,
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  teacher: { select: { id: true, user: { select: { name: true } } } },
};

class LiveClassService {
  async createLiveClass(data) {
    return prisma.lMSLiveClass.create({
      data: {
        schoolId: data.schoolId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        sectionId: data.sectionId || null,
        subjectId: data.subjectId,
        chapterId: data.chapterId || null,
        periodId: data.periodId || null,
        teacherId: data.teacherId,
        liveClassType: data.liveClassType,
        title: data.title,
        description: data.description,
        joinLink: data.joinLink,
        platform: data.platform || null,
        scheduledAt: data.scheduledAt,
        endAt: data.endAt || null,
        recordingLink: data.recordingLink || null,
        status: data.status,
      },
      select: LIVE_CLASS_SELECT,
    });
  }

  async listLiveClasses(
    { schoolId, academicYearId, classId, sectionId, subjectId, teacherId, chapterId, periodId, status, search, fromDate, toDate },
    { limit, skip }
  ) {
    const where = {
      schoolId,
      ...(academicYearId && { academicYearId }),
      ...(classId && { classId }),
      ...(sectionId && { sectionId }),
      ...(subjectId && { subjectId }),
      ...(teacherId && { teacherId }),
      ...(chapterId && { chapterId }),
      ...(periodId && { periodId }),
      ...(status && { status }),
      ...(search && {
        title: { contains: search, mode: "insensitive" },
      }),
      // Date range filtering
      ...((fromDate || toDate) && {
        scheduledAt: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate })
        }
      })
    };

    const [data, count] = await prisma.$transaction([
      prisma.lMSLiveClass.findMany({
        where,
        select: LIVE_CLASS_LIST_SELECT,
        orderBy: { scheduledAt: "asc" },
        take: limit,
        skip,
      }),
      prisma.lMSLiveClass.count({ where }),
    ]);

    return { data, count };
  }

  async getLiveClassById(id, schoolId) {
    return prisma.lMSLiveClass.findFirst({
      where: { id, schoolId },
      select: LIVE_CLASS_SELECT,
    });
  }

  async updateLiveClass(id, schoolId, data) {
    return prisma.lMSLiveClass.update({
      where: { id },
      data: {
        ...(data.academicYearId !== undefined && { academicYearId: data.academicYearId }),
        ...(data.classId !== undefined && { classId: data.classId }),
        ...(data.sectionId !== undefined && { sectionId: data.sectionId || null }),
        ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
        ...(data.chapterId !== undefined && { chapterId: data.chapterId || null }),
        ...(data.periodId !== undefined && { periodId: data.periodId || null }),
        ...(data.teacherId !== undefined && { teacherId: data.teacherId }),
        ...(data.liveClassType !== undefined && { liveClassType: data.liveClassType }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.joinLink !== undefined && { joinLink: data.joinLink }),
        ...(data.platform !== undefined && { platform: data.platform || null }),
        ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt }),
        ...(data.endAt !== undefined && { endAt: data.endAt || null }),
        ...(data.recordingLink !== undefined && { recordingLink: data.recordingLink || null }),
        ...(data.status !== undefined && { status: data.status }),
      },
      select: LIVE_CLASS_SELECT,
    });
  }

  async deleteLiveClass(id, schoolId) {
    const liveClass = await this.getLiveClassById(id, schoolId);
    if (!liveClass) throw { status: 404, message: "Live Class not found" };

    return prisma.lMSLiveClass.delete({
      where: { id },
      select: { id: true, title: true },
    });
  }
}

module.exports = new LiveClassService();