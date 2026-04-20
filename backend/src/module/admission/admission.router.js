const { Role, FileFilterType } = require("../../config/constant.config")
const loginCheck = require("../../middleware/auth.middlewares")
const hasPermission = require("../../middleware/rbac.middlewares")
const attachSchool = require("../../middleware/attachSchool.middleware")
const { bodyValidator } = require("../../middleware/validator.middlewares")
const { setPath, uplaodFile, persistAllToS3 } = require("../../middleware/aws.middlware")
const admissionController = require("./admission.controller")
const { createAdmissionDTO } = require("./admission.request")
const router = require("express").Router()

const CAN_WRITE = [Role.PRINCIPAL, Role.ADMIN_STAFF, Role.ACCOUNTANT]

// Apply auth + school scoping to all routes
router.use(loginCheck, attachSchool)


router.post(
  "/bulk-upload",
  hasPermission(CAN_WRITE),
  uplaodFile(FileFilterType.DOCUMENT).single("file"),
  admissionController.bulkUpload
)

router.post(
  "/",
  hasPermission(CAN_WRITE),
  // Accept profileImage (1) + documents (up to 10) in one multipart request,
  // then persist all to S3 before the body validator + controller run.
  setPath("admission"),
  uplaodFile(FileFilterType.IMAGE).fields([
    { name: "profileImage", maxCount: 1 },
    { name: "documents",    maxCount: 10 },
  ]),
  persistAllToS3,
  bodyValidator(createAdmissionDTO),
  admissionController.create
)

module.exports = router