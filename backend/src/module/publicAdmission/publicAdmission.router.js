const router = require("express").Router()
const loginCheck = require("../../middleware/auth.middlewares")
const hasPermission = require("../../middleware/rbac.middlewares")
const attachSchool = require("../../middleware/attachSchool.middleware")
const { bodyValidator } = require("../../middleware/validator.middlewares")
const { createPublicAdmissionDTO } = require("./publicAdmission.request")
const publicAdmissionController = require("./publicAdmission.controller")
const { Role } = require("../../config/constant.config")

const CAN_REVIEW = [Role.PRINCIPAL, Role.ADMIN_STAFF]

// ── Public routes (no auth required) ──────────────────────────────────────────
// Must come before the protected router.use(loginCheck) block

router.get("/school-info/:schoolId", publicAdmissionController.getSchoolInfo)

// Parent phone search — no auth, requires full 10-digit phone for privacy
router.get("/search-parent/:schoolId", publicAdmissionController.searchParent)

router.post("/:schoolId", bodyValidator(createPublicAdmissionDTO), publicAdmissionController.submit)

// ── Protected routes (admin / principal only) ──────────────────────────────────
router.use(loginCheck, attachSchool)

router.get("/", hasPermission(CAN_REVIEW), publicAdmissionController.list)

router.put("/:id/approve", hasPermission(CAN_REVIEW), publicAdmissionController.approve)

router.put("/:id/reject", hasPermission(CAN_REVIEW), publicAdmissionController.reject)

module.exports = router
