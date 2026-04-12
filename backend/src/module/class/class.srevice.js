const prisma = require("../../config/db.config")

class ClassService {
    // ─── Create ───────────────────────────────────────────────────────────────
    async createClass({ name, numericLevel, academicYearId, schoolId }) {
        // Ensure the academic year belongs to the school
        const academicYear = await prisma.academicYear.findFirst({
            where: { id: academicYearId, schoolId },
        })
        if (!academicYear) throw { status: 404, message: "Academic year not found for this school." }

        // Check for duplicate class name within the same school + academic year
        const existing = await prisma.class.findFirst({
            where: { schoolId, academicYearId, name },
        })
        if (existing) throw { status: 409, message: "A class with this name already exists for this academic year." }

        const newClass = await prisma.class.create({
            data: {
                schoolId,
                academicYearId,
                name,
                numericLevel,
            },
            select: {
                id:            true,
                name:          true,
                numericLevel:  true,
                academicYear:  { select: { id: true, name: true } },
                createdAt:     true,
            },
        })
        return newClass
    }

    // ─── List ─────────────────────────────────────────────────────────────────
    async listClasses({ schoolId, academicYearId, page = 1, limit = 20 }) {
        const skip = (page - 1) * limit

        const where = {
            schoolId,
            ...(academicYearId && { academicYearId }),
        }

        const [classes, total] = await Promise.all([
            prisma.class.findMany({
                where,
                select: {
                    id:           true,
                    name:         true,
                    numericLevel: true,
                    academicYear: { select: { id: true, name: true } },
                    _count:       { select: { sections: true, classSubjects: true } },
                    createdAt:    true,
                },
                orderBy: { numericLevel: "asc" },
                skip,
                take: limit,
            }),
            prisma.class.count({ where }),
        ])

        return { classes, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    // ─── Get by ID ────────────────────────────────────────────────────────────
    async getClassById({ id, schoolId }) {
        const classData = await prisma.class.findFirst({
            where: { id, schoolId },
            select: {
                id:           true,
                name:         true,
                numericLevel: true,
                academicYear: { select: { id: true, name: true, startDate: true, endDate: true } },
                sections: {
                    select: {
                        id:            true,
                        name:          true,
                        capacity:      true,
                        classTeacher:  {
                            select: {
                                id:   true,
                                user: { select: { name: true } },
                            },
                        },
                        _count: { select: { subjectTeachers: true } },
                    },
                    orderBy: { name: "asc" },
                },
                classSubjects: {
                    select: {
                        id:      true,
                        subject: { select: { id: true, name: true, code: true } },
                    },
                },
                _count: { select: { sections: true, classSubjects: true } },
                createdAt: true,
                updatedAt: true,
            },
        })
        if (!classData) throw { status: 404, message: "Class not found." }
        return classData
    }

    // ─── Update ───────────────────────────────────────────────────────────────
    async updateClass({ id, schoolId, name, numericLevel }) {
        const classData = await prisma.class.findFirst({ where: { id, schoolId } })
        if (!classData) throw { status: 404, message: "Class not found." }

        // Check duplicate name within same academic year (ignore self)
        if (name && name !== classData.name) {
            const duplicate = await prisma.class.findFirst({
                where: {
                    schoolId,
                    academicYearId: classData.academicYearId,
                    name,
                    NOT: { id },
                },
            })
            if (duplicate) throw { status: 409, message: "Another class with this name already exists in this academic year." }
        }

        const updated = await prisma.class.update({
            where: { id },
            data: {
                ...(name         !== undefined && { name }),
                ...(numericLevel !== undefined && { numericLevel }),
            },
            select: {
                id:           true,
                name:         true,
                numericLevel: true,
                academicYear: { select: { id: true, name: true } },
                updatedAt:    true,
            },
        })
        return updated
    }

}

module.exports = new ClassService()
