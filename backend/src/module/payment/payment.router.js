const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { initiatePaymentSchema, verifyPaymentSchema, manualPaymentSchema, createGatewaySchema, updateGatewaySchema, } = require('./payment.request');

const loginCheck    = require('../../middleware/auth.middlewares');
const hasPermission = require('../../middleware/rbac.middlewares');
const { bodyValidator } = require('../../middleware/validator.middlewares');
const attachSchool  = require('../../middleware/attachSchool.middleware');
const { Role }      = require('../../config/constant.config');

/**
 * @openapi
 * tags:
 *   name: Payments
 *   description: Payment gateway management, online payments, manual payments, and payment history
 */

const schoolStaff = [Role.ACCOUNTANT, Role.PRINCIPAL, Role.ADMIN_STAFF];

// ─────────────────────────────────────────────────────────────────────────────
// Gateway Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /payment/gateways:
 *   post:
 *     tags: [Payments]
 *     operationId: createGateway
 *     summary: Create a payment gateway
 *     description: Accountant, Principal, or Admin Staff. Configures a payment gateway for the school.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentMethod, config]
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, fone_pay, check, bank_transfer, esewa, khalti, ime_pay, card]
 *                 example: esewa
 *               config:
 *                 type: object
 *                 description: Gateway-specific configuration (merchant keys, URLs, etc.)
 *                 example: { merchantId: "ESEWA123", secretKey: "sk_test_..." }
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Gateway created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gateway created successfully
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
 *
 *   get:
 *     tags: [Payments]
 *     operationId: listGateways
 *     summary: List payment gateways
 *     description: Accountant, Principal, or Admin Staff.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of gateways
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Gateways fetched successfully
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
router.post(
  '/gateways',
  loginCheck, attachSchool,
  hasPermission(schoolStaff),
  bodyValidator(createGatewaySchema),
  paymentController.createGateway
);

router.get(
  '/gateways',
  loginCheck, attachSchool,
  hasPermission(schoolStaff),
  paymentController.listGateways
);

/**
 * @openapi
 * /payment/gateways/{id}:
 *   get:
 *     tags: [Payments]
 *     operationId: getGatewayById
 *     summary: Get gateway by ID
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
 *         description: Gateway details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     tags: [Payments]
 *     operationId: updateGateway
 *     summary: Update a gateway
 *     description: At least one field (config, isDefault, or status) must be provided.
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               config:
 *                 type: object
 *               isDefault:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Gateway updated
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
 *     tags: [Payments]
 *     operationId: deleteGateway
 *     summary: Delete a gateway
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
 *         description: Gateway deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/gateways/:id',
  loginCheck, attachSchool,
  hasPermission(schoolStaff),
  paymentController.getGatewayById
);

router.put(
  '/gateways/:id',
  loginCheck, attachSchool,
  hasPermission(schoolStaff),
  bodyValidator(updateGatewaySchema),
  paymentController.updateGateway
);

router.delete(
  '/gateways/:id',
  loginCheck, attachSchool,
  hasPermission(schoolStaff),
  paymentController.deleteGateway
);

// ─────────────────────────────────────────────────────────────────────────────
// Shared — active payment methods
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /payment/methods:
 *   get:
 *     tags: [Payments]
 *     operationId: getPaymentMethods
 *     summary: Get available payment methods
 *     description: Any authenticated user. Returns active payment gateways/methods for the school.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment methods fetched successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/methods', loginCheck, attachSchool, paymentController.getPaymentMethods);

// ─────────────────────────────────────────────────────────────────────────────
// Student fee summary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /payment/student/{studentId}/fees:
 *   get:
 *     tags: [Payments]
 *     operationId: getStudentFeeSummary
 *     summary: Get student fee summary
 *     description: Any authenticated user. Returns a summary of all fee records and payment status for a student.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student fee summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student fee summary fetched successfully
 *                 result:
 *                   type: object
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/student/:studentId/fees',
  loginCheck, attachSchool,
  hasPermission([...schoolStaff, Role.STUDENT, Role.PARENT]),
  paymentController.getStudentFeeSummary
);

// ─────────────────────────────────────────────────────────────────────────────
// Online Payment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /payment/initiate:
 *   post:
 *     tags: [Payments]
 *     operationId: initiatePayment
 *     summary: Initiate an online payment
 *     description: >
 *       Parent or Student only. Initiates an online payment via eSewa, Khalti, IME Pay, etc.
 *       Returns a gatewayUrl to redirect the user to for payment.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, amount, paymentMethod]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 description: Positive number (exact amount) or "all" (pay all outstanding fees)
 *                 oneOf:
 *                   - type: number
 *                     minimum: 0.01
 *                     example: 5000
 *                   - type: string
 *                     enum: [all]
 *                     example: all
 *               paymentMethod:
 *                 $ref: '#/components/schemas/OnlinePaymentMethod'
 *               gatewayId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional specific gateway ID to use
 *     responses:
 *       201:
 *         description: Payment initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment initiated successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     paymentId:
 *                       type: string
 *                       format: uuid
 *                     gatewayUrl:
 *                       type: string
 *                       description: URL to redirect user for payment
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
  '/initiate',
  loginCheck, attachSchool,
  hasPermission([Role.PARENT, Role.STUDENT]),
  bodyValidator(initiatePaymentSchema),
  paymentController.initiatePayment
);

/**
 * @openapi
 * /payment/verify:
 *   post:
 *     tags: [Payments]
 *     operationId: verifyPayment
 *     summary: Verify a completed online payment
 *     description: >
 *       Any authenticated user. Called after the user returns from the payment gateway.
 *       Verifies the transaction and updates payment status. Accepts gateway-specific additional fields.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId, gatewayReference, status]
 *             properties:
 *               paymentId:
 *                 type: string
 *                 format: uuid
 *               gatewayReference:
 *                 type: string
 *                 description: Gateway transaction reference
 *               transactionId:
 *                 type: string
 *               gatewayToken:
 *                 type: string
 *               encodedData:
 *                 type: string
 *                 description: Base64 encoded callback payload (e.g. eSewa HMAC verification)
 *               status:
 *                 type: string
 *                 enum: [success, failed, cancelled]
 *                 example: success
 *     responses:
 *       200:
 *         description: Payment verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment verified successfully
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
router.post(
  '/verify',
  loginCheck, attachSchool,
  bodyValidator(verifyPaymentSchema),
  paymentController.verifyPayment
);

// ─────────────────────────────────────────────────────────────────────────────
// Manual / Offline Payment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /payment/manual:
 *   post:
 *     tags: [Payments]
 *     operationId: recordManualPayment
 *     summary: Record a manual/offline payment
 *     description: Accountant, Principal, or Admin Staff. Records cash, check, or bank transfer payments.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, amount, paymentMethod]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 description: Must be positive, max 2 decimal places
 *                 example: 5000.00
 *               paymentMethod:
 *                 $ref: '#/components/schemas/ManualPaymentMethod'
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: Defaults to current date
 *               note:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *               depositedBy:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *               referenceNumber:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *               receiptUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Manual payment recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Manual payment recorded successfully
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
 *
 *   get:
 *     tags: [Payments]
 *     operationId: listManualPayments
 *     summary: List manual payments
 *     description: Accountant, Principal, or Admin Staff.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Manual payments list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Manual payments fetched successfully
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
router.post(
  '/manual',
  loginCheck, attachSchool,
  hasPermission(schoolStaff),
  bodyValidator(manualPaymentSchema),
  paymentController.recordManualPayment
);

router.get(
  '/manual',
  loginCheck, attachSchool,
  hasPermission(schoolStaff),
  paymentController.listManualPayments
);

/**
 * @openapi
 * /payment/manual/{paymentId}:
 *   get:
 *     tags: [Payments]
 *     operationId: getManualPaymentById
 *     summary: Get manual payment by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Manual payment details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/manual/:paymentId',
  loginCheck, attachSchool,
  hasPermission(schoolStaff),
  paymentController.getManualPaymentById
);

// ─────────────────────────────────────────────────────────────────────────────
// Payment History
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /payment/history:
 *   get:
 *     tags: [Payments]
 *     operationId: getPaymentHistory
 *     summary: Get payment history
 *     description: Any authenticated user. Returns payments scoped by role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Payment history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment history fetched successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/history', loginCheck, attachSchool, paymentController.getPaymentHistory);

/**
 * @openapi
 * /payment/{paymentId}/status:
 *   get:
 *     tags: [Payments]
 *     operationId: getPaymentStatus
 *     summary: Get payment status
 *     description: Any authenticated user. Returns current status of a payment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment status
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:paymentId/status', loginCheck, attachSchool, paymentController.getPaymentStatus);

/**
 * @openapi
 * /payment/{paymentId}/receipt:
 *   get:
 *     tags: [Payments]
 *     operationId: getPaymentReceipt
 *     summary: Get payment receipt
 *     description: Any authenticated user. Returns receipt data for a completed payment.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment receipt
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:paymentId/receipt', loginCheck, attachSchool, paymentController.getPaymentReceipt);

/**
 * @openapi
 * /payment/{paymentId}/allocations:
 *   get:
 *     tags: [Payments]
 *     operationId: getPaymentAllocations
 *     summary: Get fee allocations for a payment
 *     description: Any authenticated user. Returns how a payment was distributed across fee records.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment allocations
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:paymentId/allocations', loginCheck, attachSchool, paymentController.getPaymentAllocations);

/**
 * @openapi
 * /payment/{paymentId}:
 *   get:
 *     tags: [Payments]
 *     operationId: getPaymentById
 *     summary: Get payment by ID
 *     description: Any authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:paymentId', loginCheck, attachSchool, paymentController.getPaymentById);

module.exports = router;
