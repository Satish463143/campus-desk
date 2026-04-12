const subjectService = require("./subject.service")

class SubjectController {

    // ─── Subject CRUD ──────────────────────────────────────────────────────────
    createSubject = async (req, res, next) => {
        try {
            const { name, code } = req.body
            const schoolId = req.authUser.schoolId

            const data = await subjectService.createSubject({ name, code, schoolId })

            res.status(201).json({
                success: true,
                message: "Subject created successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("subject controller error", error)
            next(error)
        }
    }

    listSubjects = async (req, res, next) => {
        try {
            const schoolId = req.authUser.schoolId
            const page     = parseInt(req.query.page)  || 1
            const limit    = parseInt(req.query.limit) || 50

            const result = await subjectService.listSubjects({ schoolId, page, limit })

            res.json({
                success: true,
                message: "Subjects fetched successfully.",
                data: result.subjects,
                pagination: {
                    total:      result.total,
                    page:       result.page,
                    limit:      result.limit,
                    totalPages: result.totalPages,
                },
            })
        } catch (error) {
            console.log("subject controller error", error)
            next(error)
        }
    }

    getSubjectById = async (req, res, next) => {
        try {
            const id       = req.params.id
            const schoolId = req.authUser.schoolId

            const data = await subjectService.getSubjectById({ id, schoolId })

            res.json({
                success: true,
                message: "Subject fetched successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("subject controller error", error)
            next(error)
        }
    }

    updateSubject = async (req, res, next) => {
        try {
            const id       = req.params.id
            const schoolId = req.authUser.schoolId
            const { name, code } = req.body

            const data = await subjectService.updateSubject({ id, schoolId, name, code })

            res.status(200).json({
                success: true,
                message: "Subject updated successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("subject controller error", error)
            next(error)
        }
    }

    // ─── Class ↔ Subject Assignment ────────────────────────────────────────────
    assignSubjectToClass = async (req, res, next) => {
        try {
            const { subjectId, classId } = req.body
            const schoolId = req.authUser.schoolId

            const data = await subjectService.assignSubjectToClass({ subjectId, classId, schoolId })

            res.status(201).json({
                success: true,
                message: "Subject assigned to class successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("subject controller error", error)
            next(error)
        }
    }

    removeSubjectFromClass = async (req, res, next) => {
        try {
            const { subjectId, classId } = req.body
            const schoolId = req.authUser.schoolId

            await subjectService.removeSubjectFromClass({ subjectId, classId, schoolId })

            res.status(200).json({
                success: true,
                message: "Subject removed from class successfully.",
                result: null,
                meta: null,
            })
        } catch (error) {
            console.log("subject controller error", error)
            next(error)
        }
    }

    getSubjectsByClass = async (req, res, next) => {
        try {
            const classId  = req.params.classId
            const schoolId = req.authUser.schoolId

            const data = await subjectService.getSubjectsByClass({ classId, schoolId })

            res.json({
                success: true,
                message: "Class subjects fetched successfully.",
                data,
                meta: null,
            })
        } catch (error) {
            console.log("subject controller error", error)
            next(error)
        }
    }

    // ─── Section ↔ Subject ↔ Teacher Assignment ────────────────────────────────
    assignTeacherToSection = async (req, res, next) => {
        try {
            const sectionId            = req.params.sectionId
            const { subjectId, teacherId } = req.body
            const schoolId             = req.authUser.schoolId

            const { updated, data } = await subjectService.assignTeacherToSection({ sectionId, subjectId, teacherId, schoolId })

            res.status(updated ? 200 : 201).json({
                success: true,
                message: updated ? "Teacher assignment updated." : "Teacher assigned to section subject successfully.",
                result: data,
                meta: null,
            })
        } catch (error) {
            console.log("subject controller error", error)
            next(error)
        }
    }

    removeTeacherFromSection = async (req, res, next) => {
        try {
            const sectionId = req.params.sectionId
            const { subjectId } = req.body
            const schoolId  = req.authUser.schoolId

            await subjectService.removeTeacherFromSection({ sectionId, subjectId, schoolId })

            res.status(200).json({
                success: true,
                message: "Teacher removed from section subject successfully.",
                result: null,
                meta: null,
            })
        } catch (error) {
            console.log("subject controller error", error)
            next(error)
        }
    }

    getTeachersBySectionSubjects = async (req, res, next) => {
        try {
            const sectionId = req.params.sectionId
            const schoolId  = req.authUser.schoolId

            const data = await subjectService.getTeachersBySectionSubjects({ sectionId, schoolId })

            res.json({
                success: true,
                message: "Section subject teachers fetched successfully.",
                data,
                meta: null,
            })
        } catch (error) {
            console.log("subject controller error", error)
            next(error)
        }
    }

}

module.exports = new SubjectController()
