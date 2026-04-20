const loginCheck = require("../../middleware/auth.middlewares");
const verifyToken = require("../../middleware/validateToken.middleware");
const { bodyValidator } = require("../../middleware/validator.middlewares");
const authController = require("./auth.controller");
const { loginSchema, changePasswordSchema } = require("./auth.request");

const router = require("express").Router();

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication and session management
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     operationId: login
 *     summary: Login with email and password
 *     description: Authenticates a user and returns a JWT access token (1 day) and refresh token (7 days).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: principal@school.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Secret@123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 result:
 *                   type: object
 *                   properties:
 *                     userDetails:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: principal@school.com
 *                         role:
 *                           $ref: '#/components/schemas/Role'
 *                     token:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: JWT access token (expires in 1 day)
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                         refreshToken:
 *                           type: string
 *                           description: JWT refresh token (expires in 7 days)
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/login', bodyValidator(loginSchema), authController.login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     operationId: getLoggedInUser
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile loaded from the JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User Profile
 *                 result:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       format: email
 *                     role:
 *                       $ref: '#/components/schemas/Role'
 *                     status:
 *                       $ref: '#/components/schemas/UserStatus'
 *                     schoolId:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', loginCheck, authController.getLoggedInUser);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     operationId: logout
 *     summary: Logout current session
 *     description: Blacklists the current JWT token in Redis, invalidating the session.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User logged out successfully
 *                 result:
 *                   nullable: true
 *                   example: null
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/logout", loginCheck, verifyToken, authController.logout);

router.post("/refresh",loginCheck, verifyToken, authController.refreshToken);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     operationId: changePassword
 *     summary: Change own password
 *     description: Allows any authenticated user to change their own password by providing the current password and a new password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword, confirmPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 description: Current (old) password
 *                 example: OldSecret@123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password to set
 *                 example: NewSecret@456
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Must match newPassword
 *                 example: NewSecret@456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *                 result:
 *                   nullable: true
 *                   example: null
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/change-password", loginCheck, verifyToken, bodyValidator(changePasswordSchema), authController.changePassword);


module.exports = router;
