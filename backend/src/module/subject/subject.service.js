const prisma = require("../../config/db.config")

class SubjectService {

    // ─── Create Subject (school-level master) ─────────────────────────────────
    async createSubject({ name, code, schoolId }) {
        const existing = await prisma.subject.findFirst({
            where: { schoolId, name },
            select: { id: true },
        })
        if (existing) throw { status: 409, message: "A subject with this name already exists." }

        return prisma.subject.create({
            data: { schoolId, name, code: code || null },
            select: {
                id:        true,
                name:      true,
                code:      true,
                createdAt: true,
            },
        })
    }

    // ─── List Subjects ────────────────────────────────────────────────────────
    async listSubjects({ schoolId, page = 1, limit = 50 }) {
        const skip  = (page - 1) * limit
        const where = { schoolId }

        const [subjects, total] = await Promise.all([
            prisma.subject.findMany({
                where,
                select: {
                    id:        true,
                    name:      true,
                    code:      true,
                    _count:    { select: { classSubjects: true, sectionTeachers: true } },
                    createdAt: true,
                },
                orderBy: { name: "asc" },
                skip,
                take: limit,
            }),
            prisma.subject.count({ where }),
        ])

        return { subjects, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    // ─── Get Subject by ID ────────────────────────────────────────────────────
    async getSubjectById({ id, schoolId }) {
        const subject = await prisma.subject.findFirst({
            where: { id, schoolId },
            select: {
                id:   true,
                name: true,
                code: true,
                classSubjects: {
                    select: {
                        id:    true,
                        class: { select: { id: true, name: true, numericLevel: true } },
                    },
                    orderBy: { class: { numericLevel: "asc" } },
                },
                sectionTeachers: {
                    select: {
                        id:      true,
                        section: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
                        teacher: { select: { id: true, user: { select: { name: true } } } },
                    },
                },
                createdAt: true,
                updatedAt: true,
            },
        })
        if (!subject) throw { status: 404, message: "Subject not found." }
        return subject
    }

    // ─── Update Subject ───────────────────────────────────────────────────────
    async updateSubject({ id, schoolId, name, code }) {
        // Single query: confirm subject exists AND belongs to this school
        const subject = await prisma.subject.findFirst({
            where: { id, schoolId },
            select: { id: true, name: true },
        })
        if (!subject) throw { status: 404, message: "Subject not found." }

        // Only check for duplicate name when name is actually changing
        if (name && name !== subject.name) {
            const dup = await prisma.subject.findFirst({
                where: { schoolId, name, NOT: { id } },
                select: { id: true },
            })
            if (dup) throw { status: 409, message: "Another subject with this name already exists." }
        }

        return prisma.subject.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(code !== undefined && { code: code || null }),
            },
            select: { id: true, name: true, code: true, updatedAt: true },
        })
    }

    // ─── Assign Subject to Class ──────────────────────────────────────────────
    async assignSubjectToClass({ subjectId, classId, schoolId }) {
        // Validate both belong to this school in parallel
        const [subject, classData, existing] = await Promise.all([
            prisma.subject.findFirst({ where: { id: subjectId, schoolId }, select: { id: true } }),
            prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } }),
            prisma.classSubject.findFirst({ where: { subjectId, classId }, select: { id: true } }),
        ])
        if (!subject)   throw { status: 404, message: "Subject not found in this school." }
        if (!classData) throw { status: 404, message: "Class not found in this school." }
        if (existing)   throw { status: 409, message: "Subject is already assigned to this class." }

        return prisma.classSubject.create({
            data: { schoolId, classId, subjectId },
            select: {
                id:      true,
                class:   { select: { id: true, name: true } },
                subject: { select: { id: true, name: true, code: true } },
            },
        })
    }

    // ─── Remove Subject from Class ────────────────────────────────────────────
    async removeSubjectFromClass({ subjectId, classId, schoolId }) {
        // Validate class ownership and find assignment in parallel
        const [classData, assignment] = await Promise.all([
            prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } }),
            prisma.classSubject.findFirst({ where: { subjectId, classId }, select: { id: true } }),
        ])
        if (!classData)  throw { status: 404, message: "Class not found in this school." }
        if (!assignment) throw { status: 404, message: "Subject is not assigned to this class." }

        await prisma.classSubject.delete({ where: { id: assignment.id } })
    }

    // ─── Get Subjects for a Class ─────────────────────────────────────────────
    async getSubjectsByClass({ classId, schoolId }) {
        // Use findFirst to verify ownership, then fetch subjects — both in parallel
        const [classData, subjects] = await Promise.all([
            prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } }),
            prisma.classSubject.findMany({
                where: { classId },
                select: {
                    id:      true,
                    subject: { select: { id: true, name: true, code: true } },
                },
                orderBy: { subject: { name: "asc" } },
            }),
        ])
        if (!classData) throw { status: 404, message: "Class not found in this school." }
        return subjects
    }

    // ─── Assign Teacher to Section for a Subject ──────────────────────────────
    async assignTeacherToSection({ sectionId, subjectId, teacherId, schoolId }) {
        // Validate section, subject, teacher — all in parallel
        const [section, subject, teacher] = await Promise.all([
            prisma.section.findFirst({ where: { id: sectionId, schoolId }, select: { id: true, classId: true } }),
            prisma.subject.findFirst({ where: { id: subjectId, schoolId }, select: { id: true } }),
            prisma.teacherProfile.findFirst({ where: { id: teacherId, schoolId }, select: { id: true } }),
        ])
        if (!section) throw { status: 404, message: "Section not found in this school." }
        if (!subject) throw { status: 404, message: "Subject not found in this school." }
        if (!teacher) throw { status: 404, message: "Teacher not found in this school." }

        // Check class-subject link and existing assignment in parallel
        const [classSubject, existing] = await Promise.all([
            prisma.classSubject.findFirst({ where: { classId: section.classId, subjectId }, select: { id: true } }),
            prisma.sectionSubjectTeacher.findFirst({ where: { sectionId, subjectId }, select: { id: true } }),
        ])
        if (!classSubject) throw { status: 422, message: "Subject is not assigned to this section's class yet. Assign it to the class first." }

        const selectShape = {
            id:      true,
            section: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } },
            teacher: { select: { id: true, user: { select: { name: true } } } },
        }

        if (existing) {
            const updated = await prisma.sectionSubjectTeacher.update({
                where: { id: existing.id },
                data:  { teacherId },
                select: selectShape,
            })
            return { updated: true, data: updated }
        }

        const assignment = await prisma.sectionSubjectTeacher.create({
            data:   { schoolId, sectionId, subjectId, teacherId },
            select: selectShape,
        })
        return { updated: false, data: assignment }
    }

    // ─── Remove Teacher from Section for a Subject ────────────────────────────
    async removeTeacherFromSection({ sectionId, subjectId, schoolId }) {
        // Validate section ownership and find assignment in parallel
        const [section, assignment] = await Promise.all([
            prisma.section.findFirst({ where: { id: sectionId, schoolId }, select: { id: true } }),
            prisma.sectionSubjectTeacher.findFirst({ where: { sectionId, subjectId }, select: { id: true } }),
        ])
        if (!section)    throw { status: 404, message: "Section not found in this school." }
        if (!assignment) throw { status: 404, message: "No teacher is assigned for this subject in this section." }

        await prisma.sectionSubjectTeacher.delete({ where: { id: assignment.id } })
    }

    // ─── Get Subject-Teacher assignments for a Section ────────────────────────
    async getTeachersBySectionSubjects({ sectionId, schoolId }) {
        // Validate section and fetch assignments in parallel
        const [section, assignments] = await Promise.all([
            prisma.section.findFirst({ where: { id: sectionId, schoolId }, select: { id: true } }),
            prisma.sectionSubjectTeacher.findMany({
                where: { sectionId },
                select: {
                    id:      true,
                    subject: { select: { id: true, name: true, code: true } },
                    teacher: { select: { id: true, user: { select: { name: true } } } },
                },
                orderBy: { subject: { name: "asc" } },
            }),
        ])
        if (!section) throw { status: 404, message: "Section not found in this school." }
        return assignments
    }
}

module.exports = new SubjectService()
