const prisma = require("../../config/db.config")

class AcademicYearService {

    // ─── Create ───────────────────────────────────────────────────────────────
    async createAcademicYear({ name, startDate, endDate, isActive = false, schoolId }) {
        // Duplicate name guard per school
        const existing = await prisma.academicYear.findFirst({
            where: { schoolId, name },
        })
        if (existing) throw { status: 409, message: "An academic year with this name already exists." }

        // If marking this one active, deactivate any other active year for the school
        if (isActive) {
            await prisma.academicYear.updateMany({
                where: { schoolId, isActive: true },
                data:  { isActive: false },
            })
        }

        const year = await prisma.academicYear.create({
            data: {
                schoolId,
                name,
                startDate: new Date(startDate),
                endDate:   new Date(endDate),
                isActive,
            },
            select: {
                id:        true,
                name:      true,
                startDate: true,
                endDate:   true,
                isActive:  true,
                _count:    { select: { classes: true, sections: true } },
                createdAt: true,
            },
        })
        return year
    }

    // ─── List ─────────────────────────────────────────────────────────────────
    async listAcademicYears({ schoolId, page = 1, limit = 20 }) {
        const skip = (page - 1) * limit

        const where = { schoolId }

        const [years, total] = await Promise.all([
            prisma.academicYear.findMany({
                where,
                select: {
                    id:        true,
                    name:      true,
                    startDate: true,
                    endDate:   true,
                    isActive:  true,
                    _count:    { select: { classes: true, sections: true } },
                    createdAt: true,
                },
                orderBy: { startDate: "desc" },
                skip,
                take: limit,
            }),
            prisma.academicYear.count({ where }),
        ])

        return { years, total, page, limit, totalPages: Math.ceil(total / limit) }
    }

    // ─── Get by ID ────────────────────────────────────────────────────────────
    async getAcademicYearById({ id, schoolId }) {
        const year = await prisma.academicYear.findFirst({
            where: { id, schoolId },
            select: {
                id:        true,
                name:      true,
                startDate: true,
                endDate:   true,
                isActive:  true,
                classes: {
                    select: {
                        id:           true,
                        name:         true,
                        numericLevel: true,
                        _count:       { select: { sections: true } },
                    },
                    orderBy: { numericLevel: "asc" },
                },
                _count:    { select: { classes: true, sections: true } },
                createdAt: true,
                updatedAt: true,
            },
        })
        if (!year) throw { status: 404, message: "Academic year not found." }
        return year
    }

    // ─── Update ───────────────────────────────────────────────────────────────
    async updateAcademicYear({ id, schoolId, name, startDate, endDate, isActive }) {
        const year = await prisma.academicYear.findFirst({ where: { id, schoolId } })
        if (!year) throw { status: 404, message: "Academic year not found." }

        // Duplicate name guard (ignore self)
        if (name && name !== year.name) {
            const dup = await prisma.academicYear.findFirst({
                where: { schoolId, name, NOT: { id } },
            })
            if (dup) throw { status: 409, message: "Another academic year with this name already exists." }
        }

        // If activating this year, deactivate others first
        if (isActive === true && !year.isActive) {
            await prisma.academicYear.updateMany({
                where: { schoolId, isActive: true },
                data:  { isActive: false },
            })
        }

        const updated = await prisma.academicYear.update({
            where: { id },
            data: {
                ...(name      !== undefined && { name }),
                ...(startDate !== undefined && { startDate: new Date(startDate) }),
                ...(endDate   !== undefined && { endDate:   new Date(endDate) }),
                ...(isActive  !== undefined && { isActive }),
            },
            select: {
                id:        true,
                name:      true,
                startDate: true,
                endDate:   true,
                isActive:  true,
                updatedAt: true,
            },
        })
        return updated
    }

}

module.exports = new AcademicYearService()
