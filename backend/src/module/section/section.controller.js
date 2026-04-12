const sectionService = require("./section.service")

class SectionController {

    createSection = async (req, res, next) => {
        try {
            const { classId, name, capacity, classTeacherId } = req.body
            const schoolId = req.authUser.schoolId

            const data = await sectionService.createSection({ classId, name, capacity, classTeacherId, schoolId })

            res.json({
                success: true,
                message: "Section created successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("section controller error", error)
            next(error)
        }
    }

    listSections = async (req, res, next) => {
        try {
            const schoolId       = req.authUser.schoolId
            const page           = parseInt(req.query.page)  || 1
            const limit          = parseInt(req.query.limit) || 20
            const classId        = req.query.classId         || null
            const academicYearId = req.query.academicYearId  || null

            const result = await sectionService.listSections({ schoolId, classId, academicYearId, page, limit })

            res.json({
                success: true,
                message: "Sections fetched successfully.",
                data: result.sections,
                pagination: {
                    total:      result.total,
                    page:       result.page,
                    limit:      result.limit,
                    totalPages: result.totalPages,
                },
            })
        } catch (error) {
            console.log("section controller error", error)
            next(error)
        }
    }

    getSectionById = async (req, res, next) => {
        try {
            const id       = req.params.id
            const schoolId = req.authUser.schoolId

            const data = await sectionService.getSectionById({ id, schoolId })

            res.json({
                success: true,
                message: "Section fetched successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("section controller error", error)
            next(error)
        }
    }

    updateSection = async (req, res, next) => {
        try {
            const id             = req.params.id
            const schoolId       = req.authUser.schoolId
            const { name, capacity, classTeacherId } = req.body

            const data = await sectionService.updateSection({ id, schoolId, name, capacity, classTeacherId })

            return res.status(200).json({
                success: true,
                message: "Section updated successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("section controller error", error)
            next(error)
        }
    }


}

module.exports = new SectionController()
