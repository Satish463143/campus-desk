const { Role } = require("../../config/constant.config")
const attachSchool = require("../../middleware/attachSchool.middleware")
const loginCheck = require("../../middleware/auth.middlewares")
const hasPermission = require("../../middleware/rbac.middlewares")
const { bodyValidator } = require("../../middleware/validator.middlewares")
const studentController = require("./student.controller")
const { updateStudentSelfDTO, updateStudentDTO } = require("./student.request")
const { setPath, uplaodFile, persistAllToS3 } = require("../../middleware/aws.middlware")
const { FileFilterType } = require("../../config/constant.config")
const router = require("express").Router()

router.route("/")
    .get(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.ACCOUNTANT, Role.TEACHER]), studentController.listStudents)


router.route("/:id")
    .get(loginCheck, attachSchool,
        hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF,  Role.TEACHER, Role.PARENT, Role.STUDENT]),
        studentController.getStudentById)

    .put(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
        setPath("student"), uplaodFile(FileFilterType.IMAGE).fields([
            { name: "profileImage", maxCount: 1 }
        ]), persistAllToS3,
        bodyValidator(updateStudentDTO), studentController.updateStudentProfile)

    .delete(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]), studentController.deleteStudentProfile)

router.put('/student-self-update/:id', loginCheck, attachSchool, hasPermission([Role.STUDENT]),
    setPath("student"), uplaodFile(FileFilterType.IMAGE).fields([
        { name: "profileImage", maxCount: 1 }
    ]), persistAllToS3,
    bodyValidator(updateStudentSelfDTO), studentController.updateStudentSelfProfile)

module.exports = router
