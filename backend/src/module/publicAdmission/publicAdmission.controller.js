const publicAdmissionService = require("./publicAdmission.service")

class PublicAdmissionController {

    // POST /api/public-admission/:schoolId  (no auth)
    submit = async (req, res, next) => {
        try {
            const result = await publicAdmissionService.submit(req.body, req.params.schoolId)
            return res.status(201).json({
                result,
                message: "Your admission application has been submitted successfully. The school will review it shortly.",
                meta: null,
            })
        } catch (exception) {
            console.error("publicAdmission.submit error:", exception)
            next(exception)
        }
    }

    // GET /api/public-admission/search-parent/:schoolId?phone=XXXXXXXXXX  (no auth)
    searchParent = async (req, res, next) => {
        try {
            const result = await publicAdmissionService.searchParent(req.params.schoolId, req.query.phone || "")
            return res.json({ result, message: "Parent search results", meta: null })
        } catch (exception) {
            console.error("publicAdmission.searchParent error:", exception)
            next(exception)
        }
    }

    // GET /api/public-admission/school-info/:schoolId  (no auth)
    getSchoolInfo = async (req, res, next) => {
        try {
            const result = await publicAdmissionService.getSchoolInfo(req.params.schoolId)
            return res.json({ result, message: "School info fetched", meta: null })
        } catch (exception) {
            console.error("publicAdmission.getSchoolInfo error:", exception)
            next(exception)
        }
    }

    // GET /api/public-admission?status=pending  (protected)
    list = async (req, res, next) => {
        try {
            const { status = "pending" } = req.query
            const result = await publicAdmissionService.list(req.authUser.schoolId, status)
            return res.json({ result, message: "Public admissions fetched", meta: null })
        } catch (exception) {
            console.error("publicAdmission.list error:", exception)
            next(exception)
        }
    }

    // PUT /api/public-admission/:id/approve  (protected)
    approve = async (req, res, next) => {
        try {
            const result = await publicAdmissionService.approve(
                req.params.id,
                req.authUser.schoolId,
                req.authUser.id
            )
            return res.json({ result, message: "Admission approved and student created successfully", meta: null })
        } catch (exception) {
            console.error("publicAdmission.approve error:", exception)
            next(exception)
        }
    }

    // PUT /api/public-admission/:id/reject  (protected)
    reject = async (req, res, next) => {
        try {
            const result = await publicAdmissionService.reject(
                req.params.id,
                req.authUser.schoolId,
                req.authUser.id,
                req.body.reviewNote
            )
            return res.json({ result, message: "Admission rejected", meta: null })
        } catch (exception) {
            console.error("publicAdmission.reject error:", exception)
            next(exception)
        }
    }
}

module.exports = new PublicAdmissionController()
