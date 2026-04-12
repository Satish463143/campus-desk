const classService = require("./class.srevice")

class ClassController {

    createClass = async (req, res, next) => {
        try {
            const { name, numericLevel, academicYearId } = req.body
            const schoolId = req.authUser.schoolId

            const data = await classService.createClass({ name, numericLevel, academicYearId, schoolId })

            res.json({
                success: true,
                message: "Class created successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("class controller error", error)
            next(error)
        }
    }

    listClass = async (req, res, next) => {
        try {
            const schoolId       = req.authUser.schoolId
            const page           = parseInt(req.query.page)  || 1
            const limit          = parseInt(req.query.limit) || 20
            const academicYearId = req.query.academicYearId  || null

            const result = await classService.listClasses({ schoolId, academicYearId, page, limit })

            res.json({
                success: true,
                message: "Classes fetched successfully.",
                data: result.classes,
                pagination: {
                    total:      result.total,
                    page:       result.page,
                    limit:      result.limit,
                    totalPages: result.totalPages,
                },
            })
        } catch (error) {
            console.log("class controller error", error)
            next(error)
        }
    }

    getClassById = async (req, res, next) => {
        try {
            const id       = req.params.id
            const schoolId = req.authUser.schoolId

            const data = await classService.getClassById({ id, schoolId })

            res.json({
                success: true,
                message: "Class fetched successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("class controller error", error)
            next(error)
        }
    }

    updateClass = async (req, res, next) => {
        try {
            const id             = req.params.id
            const schoolId       = req.authUser.schoolId
            const { name, numericLevel } = req.body

            const data = await classService.updateClass({ id, schoolId, name, numericLevel })

            return res.status(200).json({
                success: true,
                message: "Class updated successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("class controller error", error)
            next(error)
        }
    }


}

module.exports = new ClassController()