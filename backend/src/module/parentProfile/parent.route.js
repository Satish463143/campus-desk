const { Role } = require("../../config/constant.config")
const attachSchool = require("../../middleware/attachSchool.middleware")
const loginCheck = require("../../middleware/auth.middlewares")
const hasPermission = require("../../middleware/rbac.middlewares")
const { bodyValidator } = require("../../middleware/validator.middlewares")
const parentController = require("./parent.controller")
const { updateParentSelfDTO, updateParentDTO } = require("./parent.request")
const { FileFilterType } = require("../../config/constant.config")
const { setPath, uplaodFile, persistAllToS3 } = require("../../middleware/aws.middlware")
const router = require("express").Router()

/**
 * @openapi
 * tags:
 *   name: Parents
 *   description: Parent profile management
 */

/**
 * @openapi
 * /parent:
 *   get:
 *     tags: [Parents]
 *     operationId: listParents
 *     summary: List parent profiles
 *     description: Principal or Admin Staff. Paginated list of all parents scoped to the school.
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
 *         description: Filter by parent name or email
 *     responses:
 *       200:
 *         description: Paginated list of parents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Parent list fetched
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
    .get(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]), parentController.listParents)

/**
 * @openapi
 * /parent/parent-self-update/{id}:
 *   put:
 *     tags: [Parents]
 *     operationId: updateParentSelfProfile
 *     summary: Parent self-update profile
 *     description: >
 *       Parent only. Parents can update their own name, phone, address, and profile image.
 *       Accepts multipart/form-data. Profile image (jpg/jpeg/png/webp, max 5 MB) is uploaded to S3.
 *       NOTE: This route is declared before /:id to avoid being treated as an ID param.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parent profile UUID (must match authenticated user)
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Shyam Sharma
 *               phone:
 *                 type: string
 *                 example: "9800000011"
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo (jpg/jpeg/png/webp, max 5 MB)
 *               "address[province]":
 *                 type: string
 *               "address[district]":
 *                 type: string
 *               "address[fullAddress]":
 *                 type: string
 *     responses:
 *       200:
 *         description: Parent profile updated successfully
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
router.put('/parent-self-update/:id', loginCheck, attachSchool, hasPermission([Role.PARENT]),
    setPath("parent"), uplaodFile(FileFilterType.IMAGE).fields([
        { name: "profileImage", maxCount: 1 }
    ]), persistAllToS3,
    bodyValidator(updateParentSelfDTO), parentController.updateParentSelfProfile)

/**
 * @openapi
 * /parent/{id}:
 *   get:
 *     tags: [Parents]
 *     operationId: getParentById
 *     summary: Get parent by ID
 *     description: Accessible by Principal, Admin Staff, Accountant, Teacher, Parent, and Student roles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parent profile UUID
 *     responses:
 *       200:
 *         description: Parent profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Parent fetched successfully
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
 *     tags: [Parents]
 *     operationId: updateParentProfile
 *     summary: Update parent profile (admin)
 *     description: >
 *       Principal or Admin Staff. Update a parent's contact info and profile image.
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
 *               phone:
 *                 type: string
 *               status:
 *                 $ref: '#/components/schemas/UserStatus'
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
 *         description: Parent profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Parent updated successfully
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
 *
 *   delete:
 *     tags: [Parents]
 *     operationId: deleteParentProfile
 *     summary: Delete parent profile
 *     description: Principal or Admin Staff. Permanently removes a parent from the system.
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
 *         description: Parent deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Parent deleted successfully
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
        hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.ACCOUNTANT, Role.TEACHER, Role.PARENT, Role.STUDENT]),
        parentController.getParentById)

    .put(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
        setPath("parent"), uplaodFile(FileFilterType.IMAGE).fields([
            { name: "profileImage", maxCount: 1 }
        ]), persistAllToS3,
        bodyValidator(updateParentDTO), parentController.updateParentProfile)

    .delete(loginCheck, attachSchool, hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
        parentController.deleteParentProfile)

module.exports = router
