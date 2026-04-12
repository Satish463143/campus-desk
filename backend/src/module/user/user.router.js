const express = require("express");
const router  = express.Router();

const { Role, FileFilterType } = require("../../config/constant.config");

const loginCheck    = require("../../middleware/auth.middlewares");
const attachSchool  = require("../../middleware/attachSchool.middleware");
const hasPermission = require("../../middleware/rbac.middlewares");
const { bodyValidator }    = require("../../middleware/validator.middlewares");
const { setPath, uplaodFile, persistAllToS3 } = require("../../middleware/aws.middlware");

const { loadTargetUser } = require("../../middleware/loadTargetUser.middleware");
const { canManageUser }  = require("../../middleware/canManageUser.middleware");

const userController = require("./user.controller");
const {
    updatePrincipalStatusDTO,
    userCreateDTO,
    userUpdateDTO,
    userSelfUpdateDTO,
} = require("./user.request");

/**
 * @openapi
 * tags:
 *   name: Users
 *   description: User management — Admin Staff, Accountant, and Principal accounts
 */

// ──────────────────────────────────────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /user/admin-team:
 *   post:
 *     tags: [Users]
 *     operationId: createAdminStaff
 *     summary: Create an Admin Staff member
 *     description: >
 *       Principal only. Creates a new ADMIN_STAFF user for the school.
 *       Accepts multipart/form-data. Profile image (jpg/jpeg/png/webp, max 5 MB) is uploaded to S3.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, email, password, address]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@school.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Secret@123
 *               phone:
 *                 type: string
 *                 example: "9800000001"
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
 *         description: Admin staff created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin staff created successfully
 *                 result:
 *                   type: object
 *                   description: Created user record
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
router.post(
    "/admin-team",
    loginCheck,
    attachSchool,
    hasPermission(Role.PRINCIPAL),
    setPath("user"),
    uplaodFile(FileFilterType.IMAGE).fields([{ name: "profileImage", maxCount: 1 }]),
    persistAllToS3,
    bodyValidator(userCreateDTO),
    userController.createAdminStaff
);

/**
 * @openapi
 * /user/accountant:
 *   post:
 *     tags: [Users]
 *     operationId: createAccountant
 *     summary: Create an Accountant
 *     description: >
 *       Principal or Admin Staff. Creates a new ACCOUNTANT user for the school.
 *       Accepts multipart/form-data. Profile image (jpg/jpeg/png/webp, max 5 MB) is uploaded to S3.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, email, password, address]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bob Accountant
 *               email:
 *                 type: string
 *                 format: email
 *                 example: bob@school.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Secret@123
 *               phone:
 *                 type: string
 *                 example: "9800000002"
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
 *         description: Accountant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Accountant created successfully
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
router.post(
    "/accountant",
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
    setPath("user"),
    uplaodFile(FileFilterType.IMAGE).fields([{ name: "profileImage", maxCount: 1 }]),
    persistAllToS3,
    bodyValidator(userCreateDTO),
    userController.createAccountant
);

// ──────────────────────────────────────────────────────────────────────────────
// SELF UPDATE  ← must be declared BEFORE /:id so Express doesn't treat
//                "me" as an id param
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /user/me:
 *   put:
 *     tags: [Users]
 *     operationId: updateSelf
 *     summary: Update own profile
 *     description: >
 *       Any authenticated user can update their own name, email, phone, and profile image.
 *       Accepts multipart/form-data. Profile image (jpg/jpeg/png/webp, max 5 MB) is uploaded to S3.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@school.com
 *               phone:
 *                 type: string
 *                 example: "9800000001"
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 */
router.put(
    "/me",
    loginCheck,
    setPath("user"),
    uplaodFile(FileFilterType.IMAGE).fields([{ name: "profileImage", maxCount: 1 }]),
    persistAllToS3,
    bodyValidator(userSelfUpdateDTO),
    userController.updateSelf
);

// ──────────────────────────────────────────────────────────────────────────────
// LIST USERS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /user:
 *   get:
 *     tags: [Users]
 *     operationId: listUsers
 *     summary: List school users
 *     description: >
 *       Principal sees ADMIN_STAFF + ACCOUNTANT. Admin Staff sees ACCOUNTANT only.
 *       Results are scoped to the authenticated user's school.
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
 *         description: Filter by name or email
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/UserStatus'
 *         description: Filter by user status
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Users fetched
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    "/",
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
    userController.listUsers
);

// ──────────────────────────────────────────────────────────────────────────────
// GET / UPDATE / DELETE USER BY ID
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /user/{id}:
 *   get:
 *     tags: [Users]
 *     operationId: getUserById
 *     summary: Get user by ID
 *     description: >
 *       Principal or Admin Staff. Returns a specific user's full profile.
 *       canManageUser middleware enforces: Principal can manage ADMIN_STAFF + ACCOUNTANT;
 *       Admin Staff can only manage ACCOUNTANT (same school only).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *         example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User fetched
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
 *     tags: [Users]
 *     operationId: updateUser
 *     summary: Update user by ID
 *     description: >
 *       Principal or Admin Staff. Update another user's profile including profile image.
 *       Accepts multipart/form-data. Profile image (jpg/jpeg/png/webp, max 5 MB) is uploaded to S3.
 *       canManageUser authorization matrix is enforced.
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
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
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
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
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
 *     tags: [Users]
 *     operationId: deleteUser
 *     summary: Delete user by ID
 *     description: >
 *       Principal or Admin Staff. Permanently deletes a user.
 *       canManageUser authorization matrix is enforced.
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
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *                 result:
 *                   nullable: true
 *                   example: null
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
router.get(
    "/:id",
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
    loadTargetUser,
    canManageUser,
    userController.getUserById
);

router.put(
    "/:id",
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
    loadTargetUser,
    canManageUser,
    setPath("user"),
    uplaodFile(FileFilterType.IMAGE).fields([{ name: "profileImage", maxCount: 1 }]),
    persistAllToS3,
    bodyValidator(userUpdateDTO),
    userController.updateUser
);

router.delete(
    "/:id",
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
    loadTargetUser,
    canManageUser,
    userController.deleteUser
);

// ──────────────────────────────────────────────────────────────────────────────
// SUPER ADMIN → activate / deactivate a principal
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /user/{id}/status:
 *   put:
 *     tags: [Users]
 *     operationId: updatePrincipalStatus
 *     summary: Update principal account status
 *     description: Super Admin only. Activate, deactivate, or suspend a principal's account.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Principal user UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED, DELETED]
 *                 example: ACTIVE
 *     responses:
 *       200:
 *         description: Principal status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Updated principal status
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
    "/:id/status",
    loginCheck,
    hasPermission(Role.SUPER_ADMIN),
    loadTargetUser,
    bodyValidator(updatePrincipalStatusDTO),
    userController.updatePrincipalStatus
);


module.exports = router;
