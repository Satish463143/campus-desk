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

/**
 * @openapi
 * tags:
 *   name: Students
 *   description: Student enrollment and profile management
 */

/**
 * @openapi
 * /student:
 *   get:
 *     tags: [Students]
 *     operationId: listStudents
 *     summary: List students
 *     description: Principal, Admin Staff, Accountant, or Teacher. Paginated list scoped to the school.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by student name or email
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by class
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by section
 *       - in: query
 *         name: academicStatus
 *         schema:
 *           $ref: '#/components/schemas/AcademicStatus'
 *         description: Filter by academic status
 *     responses:
 *       200:
 *         description: Paginated list of students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student list fetched
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.route("/")
    .get(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.ACCOUNTANT, Role.TEACHER]), studentController.listStudents)

/**
 * @openapi
 * /student/{id}:
 *   get:
 *     tags: [Students]
 *     operationId: getStudentById
 *     summary: Get student by ID
 *     description: Accessible by Principal, Admin Staff, Teacher, Parent, and Student roles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student profile UUID
 *     responses:
 *       200:
 *         description: Student profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student fetched successfully
 *                 result:
 *                   type: object
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     tags: [Students]
 *     operationId: updateStudentProfile
 *     summary: Update student profile (admin)
 *     description: >
 *       Principal or Admin Staff. Update a student's profile, class, section, or status.
 *       Accepts multipart/form-data. Profile image (jpg/jpeg/png/webp, max 5 MB) is uploaded to S3.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               phone:
 *                 type: string
 *               class:
 *                 type: string
 *                 format: uuid
 *               section:
 *                 type: string
 *                 format: uuid
 *               admissionNumber:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 $ref: '#/components/schemas/Gender'
 *               bloodGroup:
 *                 type: string
 *               academicStatus:
 *                 $ref: '#/components/schemas/AcademicStatus'
 *               status:
 *                 $ref: '#/components/schemas/UserStatus'
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Student profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student updated successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     studentUser:
 *                       type: object
 *                     studentProfile:
 *                       type: object
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     tags: [Students]
 *     operationId: deleteStudentProfile
 *     summary: Delete student profile
 *     description: Principal or Admin Staff. Permanently removes a student from the system.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student deleted successfully
 *                 result:
 *                   type: object
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
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

/**
 * @openapi
 * /student/student-self-update/{id}:
 *   put:
 *     tags: [Students]
 *     operationId: updateStudentSelfProfile
 *     summary: Student self-update profile
 *     description: >
 *       Student only. Students can update their own email, blood group, address, and profile image.
 *       Accepts multipart/form-data. Profile image (jpg/jpeg/png/webp, max 5 MB) is uploaded to S3.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student profile UUID (must match authenticated user)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ram@school.com
 *               bloodGroup:
 *                 type: string
 *                 example: "O+"
 *               "address[province]":
 *                 type: string
 *                 example: Province 1
 *               "address[district]":
 *                 type: string
 *                 example: Morang
 *               "address[fullAddress]":
 *                 type: string
 *                 example: Biratnagar-10
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo (jpg/jpeg/png/webp, max 5 MB)
 *     responses:
 *       200:
 *         description: Student profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     studentUser:
 *                       type: object
 *                     studentProfile:
 *                       type: object
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/student-self-update/:id', loginCheck, attachSchool, hasPermission([Role.STUDENT]),
    setPath("student"), uplaodFile(FileFilterType.IMAGE).fields([
        { name: "profileImage", maxCount: 1 }
    ]), persistAllToS3,
    bodyValidator(updateStudentSelfDTO), studentController.updateStudentSelfProfile)

module.exports = router
