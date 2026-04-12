const { Role } = require("../../config/constant.config")
const attachSchool = require("../../middleware/attachSchool.middleware")
const loginCheck = require("../../middleware/auth.middlewares")
const hasPermission = require("../../middleware/rbac.middlewares")
const { bodyValidator } = require("../../middleware/validator.middlewares")
const teacherController = require("./teacher.controller")
const { createTeacherProfileDTO, updateTeacherSelfProfileDTO, updateTeacherProfileDTO } = require("./teacher.request")
const { setPath, uplaodFile, persistAllToS3 } = require("../../middleware/aws.middlware")
const { FileFilterType } = require("../../config/constant.config")
const router = require("express").Router()

/**
 * @openapi
 * tags:
 *   name: Teachers
 *   description: Teacher profile and employment management
 */

/**
 * @openapi
 * /teacher:
 *   post:
 *     tags: [Teachers]
 *     operationId: createTeacherProfile
 *     summary: Create a teacher profile
 *     description: >
 *       Principal or Admin Staff. Creates a teacher user + employment profile.
 *       Accepts multipart/form-data. Profile image (jpg/jpeg/png/webp, max 5 MB) is uploaded to S3.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password, joiningDate]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Sita Devi
 *               email:
 *                 type: string
 *                 format: email
 *                 example: sita@school.com
 *               phone:
 *                 type: string
 *                 example: "9800000020"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: Secret@123
 *               joiningDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               employeeId:
 *                 type: string
 *                 example: EMP-001
 *               qualification:
 *                 type: string
 *                 example: M.Ed.
 *               experienceYears:
 *                 type: integer
 *                 minimum: 0
 *                 example: 5
 *               salary:
 *                 type: number
 *                 minimum: 0
 *                 example: 25000
 *               department:
 *                 type: string
 *                 example: Science
 *               designation:
 *                 type: string
 *                 example: Senior Teacher
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo (jpg/jpeg/png/webp, max 5 MB)
 *               "address[province]":
 *                 type: string
 *                 example: Province 1
 *               "address[district]":
 *                 type: string
 *                 example: Morang
 *               "address[fullAddress]":
 *                 type: string
 *                 example: Biratnagar-10
 *               "address[country]":
 *                 type: string
 *                 example: Nepal
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher created successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     teacherUser:
 *                       type: object
 *                     teacherProfile:
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
 *
 *   get:
 *     tags: [Teachers]
 *     operationId: listTeachers
 *     summary: List teachers
 *     description: Principal, Admin Staff, or Accountant. Paginated list of all teachers scoped to the school.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by name or email
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/UserStatus'
 *     responses:
 *       200:
 *         description: Paginated list of teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher list fetched
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
    .post(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
        setPath("teacher"), uplaodFile(FileFilterType.IMAGE).fields([
            { name: "profileImage", maxCount: 1 }
        ]), persistAllToS3,
        bodyValidator(createTeacherProfileDTO), teacherController.createTeacherProfile)
    .get(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.ACCOUNTANT]), teacherController.listTeachers)

/**
 * @openapi
 * /teacher/teacher-self-update/{id}:
 *   put:
 *     tags: [Teachers]
 *     operationId: updateTeacherSelfProfile
 *     summary: Teacher self-update profile
 *     description: >
 *       Teacher only. Teachers can update their own phone, address, qualification, experience, and profile image.
 *       Accepts multipart/form-data. Profile image (jpg/jpeg/png/webp, max 5 MB) is uploaded to S3.
 *       NOTE: This route must be declared BEFORE /:id to avoid Express treating "teacher-self-update" as an ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Teacher profile UUID (must match authenticated user)
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "9800000021"
 *               qualification:
 *                 type: string
 *                 example: M.Ed.
 *               experienceYears:
 *                 type: integer
 *                 minimum: 0
 *                 example: 6
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               "address[province]":
 *                 type: string
 *               "address[district]":
 *                 type: string
 *               "address[fullAddress]":
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher profile updated successfully
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
 *                     teacherUser:
 *                       type: object
 *                     teacherProfile:
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
router.put('/teacher-self-update/:id', loginCheck, attachSchool, hasPermission([Role.TEACHER]),
    setPath("teacher"), uplaodFile(FileFilterType.IMAGE).fields([
        { name: "profileImage", maxCount: 1 }
    ]), persistAllToS3,
    bodyValidator(updateTeacherSelfProfileDTO), teacherController.updateTeacherSelfProfile)

/**
 * @openapi
 * /teacher/{id}:
 *   get:
 *     tags: [Teachers]
 *     operationId: getTeacherById
 *     summary: Get teacher by ID
 *     description: Accessible by Principal, Admin Staff, Accountant, and Teacher roles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Teacher profile UUID
 *     responses:
 *       200:
 *         description: Teacher profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher fetched successfully
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
 *     tags: [Teachers]
 *     operationId: updateTeacherProfile
 *     summary: Update teacher profile (admin)
 *     description: >
 *       Principal or Admin Staff. Update a teacher's employment details and profile.
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
 *             required: [name, email, phone, status]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               joiningDate:
 *                 type: string
 *                 format: date
 *               employeeId:
 *                 type: string
 *               qualification:
 *                 type: string
 *               experienceYears:
 *                 type: integer
 *                 minimum: 0
 *               salary:
 *                 type: number
 *                 minimum: 0
 *               department:
 *                 type: string
 *               designation:
 *                 type: string
 *               status:
 *                 $ref: '#/components/schemas/UserStatus'
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher updated successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     teacherUser:
 *                       type: object
 *                     teacherProfile:
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
 *     tags: [Teachers]
 *     operationId: deleteTeacherProfile
 *     summary: Delete teacher profile
 *     description: Principal or Admin Staff. Permanently removes a teacher from the system.
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
 *         description: Teacher deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher deleted successfully
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
    .get(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.ACCOUNTANT, Role.TEACHER]), teacherController.getTeacherById)
    .put(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
        setPath("teacher"), uplaodFile(FileFilterType.IMAGE).fields([
            { name: "profileImage", maxCount: 1 }
        ]), persistAllToS3,
        bodyValidator(updateTeacherProfileDTO), teacherController.updateTeacherProfile)
    .delete(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]), teacherController.deleteTeacherProfile)

module.exports = router
