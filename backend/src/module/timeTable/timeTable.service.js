const prisma = require("../../config/db.config");
const { getCache, setCache, clearCache } = require("../../utils/redisCache");

class TimetableService {
    // -------------------------------------------------------------
    // Helper Validations
    // -------------------------------------------------------------

    async _validateSectionConflict(schoolId, academicYearId, sectionId, dayOfWeek, periodId, excludeId = null) {
        const whereClause = {
            schoolId,
            academicYearId,
            sectionId,
            dayOfWeek,
            periodId
        };
        if (excludeId) whereClause.id = { not: excludeId };

        const conflict = await prisma.timetable.findFirst({ where: whereClause });
        if (conflict) {
            throw { status: 409, message: "Section already has a class scheduled for this period" };
        }
    }

    async _validateTeacherConflict(schoolId, academicYearId, teacherId, dayOfWeek, periodId, excludeId = null) {
        const whereClause = {
            schoolId,
            academicYearId,
            teacherId,
            dayOfWeek,
            periodId
        };
        if (excludeId) whereClause.id = { not: excludeId };

        const conflict = await prisma.timetable.findFirst({ where: whereClause });
        if (conflict) {
            throw { status: 409, message: "Teacher is already assigned to another class during this period" };
        }
    }

    async _validateSubjectAssignedToClass(classId, subjectId) {
        const valid = await prisma.classSubject.findUnique({
            where: {
                classId_subjectId: { classId, subjectId }
            }
        });
        if (!valid) {
            throw { status: 400, message: "Subject is not assigned to this class" };
        }
    }

    async _validateTeacherAssignedToSectionSubject(schoolId, sectionId, subjectId, teacherId) {
        const valid = await prisma.sectionSubjectTeacher.findUnique({
            where: {
                sectionId_subjectId_teacherId: { sectionId, subjectId, teacherId }
            }
        });
        if (!valid) {
            throw { status: 400, message: "Teacher is not assigned to teach this subject in this section" };
        }
    }

    // -------------------------------------------------------------
    // CRUD Operations
    // -------------------------------------------------------------

    async createTimetable(schoolId, academicYearId, data) {
        const { classId, sectionId, periodId, subjectId, teacherId, dayOfWeek, roomNumber, classMode, isActive} = data;

        // Perform Business Validations
        await this._validateSectionConflict(schoolId, academicYearId, sectionId, dayOfWeek, periodId);
        await this._validateTeacherConflict(schoolId, academicYearId, teacherId, dayOfWeek, periodId);
        await this._validateSubjectAssignedToClass(classId, subjectId);
        await this._validateTeacherAssignedToSectionSubject(schoolId, sectionId, subjectId, teacherId);

        const timetable = await prisma.timetable.create({
            data: {
                schoolId,
                academicYearId,
                classId,
                sectionId,
                periodId,
                subjectId,
                teacherId,
                dayOfWeek,
                classMode,
                roomNumber,
                isActive
            }
        });

        await clearCache("timetable*");
        return timetable;
    }

    async bulkCreateTimetable(schoolId, academicYearId, dataArray) {
        // Prepare valid data for batch insertion
        const insertData = [];

        // Note: For large arrays, doing individual DB queries sequentially like this isn't optimal, but 
        // since a week's schedule for one class is max ~40 items, it's fast enough.
        for (const data of dataArray) {
            const { classId, sectionId, periodId, subjectId, teacherId, dayOfWeek, roomNumber, classMode, isActive = true } = data;

            await this._validateSectionConflict(schoolId, academicYearId, sectionId, dayOfWeek, periodId);
            await this._validateTeacherConflict(schoolId, academicYearId, teacherId, dayOfWeek, periodId);
            await this._validateSubjectAssignedToClass(classId, subjectId);
            await this._validateTeacherAssignedToSectionSubject(schoolId, sectionId, subjectId, teacherId);

            insertData.push({
                schoolId,
                academicYearId,
                classId,
                sectionId,
                periodId,
                subjectId,
                teacherId,
                dayOfWeek,
                classMode,
                roomNumber,
                isActive
            });
        }

        const result = await prisma.timetable.createMany({
            data: insertData,
            skipDuplicates: true
        });

        await clearCache("timetable*");
        return { count: result.count };
    }

    async getTimetables({ schoolId, academicYearId, skip = 0, limit = 10, search = "" }) {
        const where = { schoolId, academicYearId };
        
        const [timetables, count] = await Promise.all([
            prisma.timetable.findMany({
                where,
                include: {
                    period: { select: { name: true, periodNumber: true, startTime: true, endTime: true } },
                    subject: { select: { name: true, code: true } },
                    teacher: { select: { employeeId: true, user: { select: { name: true } } } },
                    class: { select: { name: true } },
                    section: { select: { name: true } }
                },
                orderBy: [
                    { dayOfWeek: "asc" },
                    { period: { periodNumber: "asc" } }
                ],
                skip,
                take: limit
            }),
            prisma.timetable.count({ where })
        ]);

        return { data: timetables, count };
    }

    async getTimetableById({ id, schoolId }) {
        const timetable = await prisma.timetable.findFirst({
            where: { id, schoolId },
            include: {
                period: { select: { name: true, periodNumber: true, startTime: true, endTime: true } },
                subject: { select: { name: true, code: true } },
                teacher: { select: { employeeId: true, user: { select: { name: true } } } },
                class: { select: { name: true } },
                section: { select: { name: true } }
            }
        });
        if (!timetable) throw { status: 404, message: "Timetable entry not found" };

        return timetable;
    }

    async updateTimetable({ id, schoolId, data }) {
        const current = await this.getTimetableById({ id, schoolId });

        const academicYearId = current.academicYearId;
        const classId = data.classId || current.classId;
        const sectionId = data.sectionId || current.sectionId;
        const periodId = data.periodId || current.periodId;
        const subjectId = data.subjectId || current.subjectId;
        const teacherId = data.teacherId || current.teacherId;
        const dayOfWeek = data.dayOfWeek || current.dayOfWeek;

        // Validations if any core schedule details change
        if (data.sectionId || data.dayOfWeek || data.periodId) {
            await this._validateSectionConflict(schoolId, academicYearId, sectionId, dayOfWeek, periodId, id);
        }
        if (data.teacherId || data.dayOfWeek || data.periodId) {
            await this._validateTeacherConflict(schoolId, academicYearId, teacherId, dayOfWeek, periodId, id);
        }
        if (data.classId || data.subjectId) {
            await this._validateSubjectAssignedToClass(classId, subjectId);
        }
        if (data.sectionId || data.subjectId || data.teacherId) {
            await this._validateTeacherAssignedToSectionSubject(schoolId, sectionId, subjectId, teacherId);
        }

        const updated = await prisma.timetable.update({
            where: { id },
            data
        });

        await clearCache("timetable_*");
        return updated;
    }

    async deleteTimetable({ id, schoolId }) {
        const timetable = await prisma.timetable.findFirst({ where: { id, schoolId } });
        if (!timetable) throw { status: 404, message: "Timetable entry not found" };

        await prisma.timetable.delete({ where: { id } });

        await clearCache("timetable*");
        return { message: "Timetable entry deleted successfully" };
    }

    // -------------------------------------------------------------
    // Optimized Custom Getters (With Redis)
    // -------------------------------------------------------------

    async getSectionTimetable({ schoolId, academicYearId, sectionId }) {
        const cacheKey = `timetable:section:${sectionId}`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const timetables = await prisma.timetable.findMany({
            where: { schoolId, academicYearId, sectionId },
            include: {
                period: { select: { name: true, periodNumber: true, startTime: true, endTime: true } },
                subject: { select: { name: true, code: true } },
                teacher: { select: { employeeId: true, user: { select: { name: true } } } },
            },
            orderBy: [
                { dayOfWeek: "asc" },
                { period: { periodNumber: "asc" } }
            ]
        });

        await setCache(cacheKey, timetables, 300); // 300s TTL
        return timetables;
    }

    async getTeacherTimetable({ schoolId, academicYearId, teacherId }) {
        const cacheKey = `timetable:teacher:${teacherId}`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const timetables = await prisma.timetable.findMany({
            where: { schoolId, academicYearId, teacherId },
            include: {
                period: { select: { name: true, periodNumber: true, startTime: true, endTime: true } },
                subject: { select: { name: true, code: true } },
                class: { select: { name: true } },
                section: { select: { name: true } }
            },
            orderBy: [
                { dayOfWeek: "asc" },
                { period: { periodNumber: "asc" } }
            ]
        });

        await setCache(cacheKey, timetables, 300); // 300s TTL
        return timetables;
    }

    async getDaySchedule({ schoolId, academicYearId, dayOfWeek }) {
        const cacheKey = `timetable:day:${schoolId}:${academicYearId}:${dayOfWeek}`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const timetables = await prisma.timetable.findMany({
            where: { schoolId, academicYearId, dayOfWeek },
            include: {
                period: { select: { name: true, periodNumber: true, startTime: true, endTime: true } },
                subject: { select: { name: true, code: true } },
                teacher: { select: { employeeId: true, user: { select: { name: true } } } },
                class: { select: { name: true } },
                section: { select: { name: true } }
            },
            orderBy: { period: { periodNumber: "asc" } }
        });

        await setCache(cacheKey, timetables, 300); // 300s TTL
        return timetables;
    }
}

module.exports = new TimetableService();
