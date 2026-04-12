const prisma = require("../../config/db.config")

class SectionService {
    // ─── Create ───────────────────────────────────────────────────────────────
    async createSection({ classId, name, capacity, classTeacherId, schoolId }) {
        // Run class validation, optional teacher validation, and dup check all in parallel
        const [classData, teacher, existing] = await Promise.all([
            prisma.class.findFirst({
                where: { id: classId, schoolId },
                select: { id: true, academicYearId: true },
            }),
            classTeacherId
                ? prisma.teacherProfile.findFirst({ where: { id: classTeacherId, schoolId }, select: { id: true } })
                : Promise.resolve(true), // skip — null means "no teacher provided", resolve truthy
            prisma.section.findFirst({ where: { classId, name }, select: { id: true } }),
        ])

        if (!classData) throw { status: 404, message: "Class not found for this school." }
        if (classTeacherId && !teacher) throw { status: 404, message: "Class teacher not found in this school." }
        if (existing) throw { status: 409, message: "A section with this name already exists in this class." }

        return prisma.section.create({
            data: {
                schoolId,
                academicYearId: classData.academicYearId, // Inherit from class
                classId,
                name,
                ...(capacity      !== undefined && { capacity }),
                ...(classTeacherId             && { classTeacherId }),
            },
            select: {
                id:           true,
                name:         true,
                capacity:     true,
                class:        { select: { id: true, name: true } },
                academicYear: { select: { id: true, name: true } },
                classTeacher: { select: { id: true, user: { select: { name: true } } } },
                createdAt:    true,
            },
        })
    }

    // ─── List ─────────────────────────────────────────────────────────────────
    async listSections({ schoolId, classId, academicYearId, page = 1, limit = 20 }) {
        const skip = (page - 1) * limit

        const where = {
            schoolId,
            ...(classId        && { classId }),
            ...(academicYearId && { academicYearId }),
        }

        const [sections, total] = await Promise.all([
            prisma.section.findMany({
                where,
                select: {
                    id:           true,
                    name:         true,
                    capacity:     true,
                    class:        { select: { id: true, name: true, numericLevel: true } },
                    academicYear: { select: { id: true, name: true } },
                    classTeacher: { select: { id: true, user: { select: { name: true } } } },
                    _count:       { select: { subjectTeachers: true } },
                    createdAt:    true,
                },
                orderBy: [
                    { class: { numericLevel: "asc" } },
                    { name:  "asc" },
                ],
                skip,
                take: limit,
            }),
            prisma.section.count({ where }),
        ])

        return { sections, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    // ─── Get by ID ────────────────────────────────────────────────────────────
    async getSectionById({ id, schoolId }) {
        const sectionData = await prisma.section.findFirst({
            where: { id, schoolId },
            select: {
                id:           true,
                name:         true,
                capacity:     true,
                class:        { select: { id: true, name: true } },
                academicYear: { select: { id: true, name: true } },
                classTeacher: { select: { id: true, user: { select: { name: true } } } },
                subjectTeachers: {
                    select: {
                        id:      true,
                        subject: { select: { id: true, name: true, code: true } },
                        teacher: { select: { id: true, user: { select: { name: true } } } },
                    },
                },
                _count:    { select: { subjectTeachers: true } },
                createdAt: true,
                updatedAt: true,
            },
        })
        if (!sectionData) throw { status: 404, message: "Section not found." }
        return sectionData
    }

    // ─── Update ───────────────────────────────────────────────────────────────
    async updateSection({ id, schoolId, name, capacity, classTeacherId }) {
        // Confirm section exists and belongs to this school
        const sectionData = await prisma.section.findFirst({
            where: { id, schoolId },
            select: { id: true, name: true, classId: true, classTeacherId: true },
        })
        if (!sectionData) throw { status: 404, message: "Section not found." }

        // Run name dup check and teacher validation in parallel (only when needed)
        const needsNameCheck    = name !== undefined && name !== sectionData.name
        const needsTeacherCheck = classTeacherId !== undefined
                                  && classTeacherId !== null
                                  && classTeacherId !== sectionData.classTeacherId

        if (needsNameCheck || needsTeacherCheck) {
            const [duplicate, teacher] = await Promise.all([
                needsNameCheck
                    ? prisma.section.findFirst({
                        where: { classId: sectionData.classId, name, NOT: { id } },
                        select: { id: true },
                      })
                    : Promise.resolve(null),
                needsTeacherCheck
                    ? prisma.teacherProfile.findFirst({ where: { id: classTeacherId, schoolId }, select: { id: true } })
                    : Promise.resolve(true), // truthy → no validation needed
            ])

            if (needsNameCheck    && duplicate) throw { status: 409, message: "Another section with this name already exists in this class." }
            if (needsTeacherCheck && !teacher)  throw { status: 404, message: "Class teacher not found in this school." }
        }

        return prisma.section.update({
            where: { id },
            data: {
                ...(name           !== undefined && { name }),
                ...(capacity       !== undefined && { capacity }),
                // If classTeacherId is explicitly null, it removes the teacher assignment
                ...(classTeacherId !== undefined && { classTeacherId }),
            },
            select: {
                id:           true,
                name:         true,
                capacity:     true,
                class:        { select: { id: true, name: true } },
                classTeacher: { select: { id: true, user: { select: { name: true } } } },
                updatedAt:    true,
            },
        })
    }

}

module.exports = new SectionService()
