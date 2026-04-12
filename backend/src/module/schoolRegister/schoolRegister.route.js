const { Role, SchoolStatus, FileFilterType } = require("../../config/constant.config");
const attachSchool = require("../../middleware/attachSchool.middleware");
const loginCheck = require("../../middleware/auth.middlewares");
const { setPath, uplaodFile, persistAllToS3 } = require("../../middleware/aws.middlware");
const hasPermission = require("../../middleware/rbac.middlewares");
const schoolStatusCheck = require("../../middleware/schoolStatus.middleware");
const { bodyValidator } = require("../../middleware/validator.middlewares");
const schoolRegisterController = require("./schoolRegister.controller");
const { schoolRegisterDTO, updateSchoolProfileDTO, updateSchoolStatusDTO } = require("./schoolRegister.request");
const router = require("express").Router();

/**
 * @openapi
 * tags:
 *   name: School
 *   description: School registration and management
 */

/**
 * @openapi
 * /school:
 *   post:
 *     tags: [School]
 *     operationId: registerSchool
 *     summary: Register a new school
 *     description: >
 *       Public endpoint. A principal self-registers their school. No authentication required.
 *       Creates both the school record and the principal user account in a single transaction.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [schoolName, password, principal, address]
 *             properties:
 *               schoolName:
 *                 type: string
 *                 description: Official school name
 *                 example: Sunrise Academy
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Principal's login password (min 6 chars)
 *                 example: Secret@123
 *               principal:
 *                 type: object
 *                 required: [name, email, phone]
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: John Doe
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: john@sunrise.edu
 *                   phone:
 *                     type: string
 *                     example: "9800000000"
 *               address:
 *                 type: object
 *                 required: [province, district, fullAddress]
 *                 properties:
 *                   country:
 *                     type: string
 *                     default: Nepal
 *                     example: Nepal
 *                   province:
 *                     type: string
 *                     example: Province 1
 *                   district:
 *                     type: string
 *                     example: Morang
 *                   fullAddress:
 *                     type: string
 *                     example: Biratnagar-10, Main Road
 *     responses:
 *       201:
 *         description: School and principal account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School and Principal account created successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     school:
 *                       type: object
 *                       description: Created school record
 *                     principal:
 *                       type: object
 *                       description: Created principal user record
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   get:
 *     tags: [School]
 *     operationId: listSchools
 *     summary: List all schools
 *     description: Super Admin only. Returns a paginated list of all registered schools.
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
 *         description: Filter by school name
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/SchoolStatus'
 *         description: Filter by school status
 *     responses:
 *       200:
 *         description: Paginated list of schools
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School list fetched
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
  .post(
    bodyValidator(schoolRegisterDTO),
    schoolRegisterController.createschool
  )
  .get(
    loginCheck,
    attachSchool,
    hasPermission(Role.SUPER_ADMIN),
    schoolRegisterController.listSchools
  );

/**
 * @openapi
 * /school/{id}:
 *   get:
 *     tags: [School]
 *     operationId: getSchool
 *     summary: Get school by ID
 *     description: Accessible by Principal (own school) or Super Admin. Blocked if school status is CLOSED, SUSPENDED, or NEW_REGISTRATION.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: School UUID
 *         example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *     responses:
 *       200:
 *         description: School details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School fetched successfully
 *                 result:
 *                   type: object
 *                   description: Full school record
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
 *     tags: [School]
 *     operationId: updateSchoolProfile
 *     summary: Update school profile
 *     description: >
 *       Principal only. Update school information including logo and cover image.
 *       Accepts multipart/form-data. Images (jpg/jpeg/png/webp) are uploaded to S3; max 5 MB.
 *       Blocked if school status is CLOSED, SUSPENDED, or NEW_REGISTRATION.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: School UUID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [schoolName]
 *             properties:
 *               schoolName:
 *                 type: string
 *                 example: Sunrise Academy
 *               schoolEmail:
 *                 type: string
 *                 format: email
 *                 example: info@sunrise.edu
 *               schoolPhone:
 *                 type: string
 *                 example: "0219800000"
 *               alternatePhone:
 *                 type: string
 *                 example: "9800000001"
 *               schoolWebsite:
 *                 type: string
 *                 example: https://sunrise.edu.np
 *               panNumber:
 *                 type: string
 *                 example: "123456789"
 *               registrationNumber:
 *                 type: string
 *                 example: "REG-001"
 *               establishedYear:
 *                 type: integer
 *                 example: 2005
 *               longitude:
 *                 type: number
 *                 example: 87.2832
 *               latitude:
 *                 type: number
 *                 example: 26.4525
 *               allowedRadius:
 *                 type: number
 *                 description: GPS attendance radius in meters
 *                 example: 200
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: School logo image (jpg/jpeg/png/webp, max 5 MB)
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: School cover image (jpg/jpeg/png/webp, max 5 MB)
 *     responses:
 *       200:
 *         description: School profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School profile updated successfully
 *                 result:
 *                   type: object
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
 */
router.route("/:id")
  .get(
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.SUPER_ADMIN]),
    schoolStatusCheck([SchoolStatus.CLOSED, SchoolStatus.SUSPENDED, SchoolStatus.NEW_REGISTRATION]),
    schoolRegisterController.getSchool
  )
  .put(
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL]),
    schoolStatusCheck([SchoolStatus.CLOSED, SchoolStatus.SUSPENDED, SchoolStatus.NEW_REGISTRATION]),
    setPath("school"), uplaodFile(FileFilterType.IMAGE).fields([
      { name: "logo", maxCount: 1 },
      { name: "coverImage", maxCount: 1 }
    ]), persistAllToS3,
    bodyValidator(updateSchoolProfileDTO),
    schoolRegisterController.updateSchoolProfile
  )
  .delete(
    loginCheck,
    attachSchool,
    hasPermission([Role.SUPER_ADMIN]),
    schoolRegisterController.deleteSchool
  );

/**
 * @openapi
 * /school/status/{id}:
 *   put:
 *     tags: [School]
 *     operationId: updateSchoolStatus
 *     summary: Update school status
 *     description: Super Admin only. Approve, suspend, close, or reactivate a school.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: School UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [schoolStatus]
 *             properties:
 *               schoolStatus:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED, CLOSED]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: School status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: School status updated successfully
 *                 result:
 *                   type: object
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
 */
router.put(
  "/status/:id",
  loginCheck,
  attachSchool,
  hasPermission([Role.SUPER_ADMIN]),
  bodyValidator(updateSchoolStatusDTO),
  schoolRegisterController.updateSchoolStatus
);

module.exports = router;
