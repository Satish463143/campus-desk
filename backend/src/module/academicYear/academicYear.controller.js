const academicYearService = require("./academicYear.service")

class AcademicYearController {

    createAcademicYear = async (req, res, next) => {
        try {
            const { name, startDate, endDate, isActive } = req.body
            const schoolId = req.authUser.schoolId

            const data = await academicYearService.createAcademicYear({ name, startDate, endDate, isActive, schoolId })

            res.status(201).json({
                success: true,
                message: "Academic year created successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("academicYear controller error", error)
            next(error)
        }
    }

    listAcademicYears = async (req, res, next) => {
        try {
            const schoolId = req.authUser.schoolId
            const page     = parseInt(req.query.page)  || 1
            const limit    = parseInt(req.query.limit) || 20

            const result = await academicYearService.listAcademicYears({ schoolId, page, limit })

            res.json({
                success: true,
                message: "Academic years fetched successfully.",
                data: result.years,
                pagination: {
                    total:      result.total,
                    page:       result.page,
                    limit:      result.limit,
                    totalPages: result.totalPages,
                },
            })
        } catch (error) {
            console.log("academicYear controller error", error)
            next(error)
        }
    }

    getAcademicYearById = async (req, res, next) => {
        try {
            const id       = req.params.id
            const schoolId = req.authUser.schoolId

            const data = await academicYearService.getAcademicYearById({ id, schoolId })

            res.json({
                success: true,
                message: "Academic year fetched successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("academicYear controller error", error)
            next(error)
        }
    }

    updateAcademicYear = async (req, res, next) => {
        try {
            const id       = req.params.id
            const schoolId = req.authUser.schoolId
            const { name, startDate, endDate, isActive } = req.body

            const data = await academicYearService.updateAcademicYear({ id, schoolId, name, startDate, endDate, isActive })

            res.status(200).json({
                success: true,
                message: "Academic year updated successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("academicYear controller error", error)
            next(error)
        }
    }

}

module.exports = new AcademicYearController()
