const router = require("express").Router();
const feeManagementController = require("./feeManagement.controller");
const { Role } = require("../../config/constant.config");
const attachSchool = require("../../middleware/attachSchool.middleware");
const loginCheck = require("../../middleware/auth.middlewares");
const hasPermission = require("../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../middleware/validator.middlewares");
const {
  createFeeCategoryDTO,
  createFeeStructureDTO,
  assignStudentFeeDTO,
  upsertScholarshipDTO,
  recordPaymentDTO,
  scheduleReminderDTO,
  feeSettingDTO,
  updateFeeStructureDTO,
  updateFeeCategoryDTO,
  extendFeeDTO,
  bulkAssignStudentFeeDTO,
  updateStudentFeeDTO
} = require("./feeManagement.request");

const roles = [ Role.PRINCIPAL, Role.ACCOUNTANT, Role.ADMIN_STAFF];

/**
 * @openapi
 * tags:
 *   name: Fee Management
 *   description: Fee categories, structures, student fee assignments, payments, scholarships, and reminders
 */

router.use(loginCheck, attachSchool);

// ─── Fee Category ──────────────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/category:
 *   post:
 *     tags: [Fee Management]
 *     operationId: createFeeCategory
 *     summary: Create a fee category
 *     description: Principal, Accountant, or Admin Staff.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: Tuition Fee
 *               code:
 *                 type: string
 *                 maxLength: 20
 *                 description: Uppercase code identifier
 *                 example: TUI
 *               scope:
 *                 type: string
 *                 enum: [school, class, optional]
 *                 default: school
 *                 example: school
 *               description:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *                 example: Monthly tuition fee
 *     responses:
 *       201:
 *         description: Fee category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee category created successfully
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
 *     tags: [Fee Management]
 *     operationId: getFeeCategories
 *     summary: List fee categories
 *     description: Principal, Accountant, or Admin Staff.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of fee categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee categories fetched successfully
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
router.route("/category")
  .post(hasPermission(roles), bodyValidator(createFeeCategoryDTO), feeManagementController.createFeeCategory)
  .get(hasPermission(roles), feeManagementController.getFeeCategories);

/**
 * @openapi
 * /fee-management/category/{id}:
 *   get:
 *     tags: [Fee Management]
 *     operationId: getFeeCategoryById
 *     summary: Get fee category by ID
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
 *         description: Fee category details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee category fetched successfully
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
 *     tags: [Fee Management]
 *     operationId: updateFeeCategory
 *     summary: Update a fee category
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
 *               name:
 *                 type: string
 *                 maxLength: 50
 *               code:
 *                 type: string
 *                 maxLength: 20
 *               scope:
 *                 type: string
 *                 enum: [school, class, optional]
 *               description:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Fee category updated
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
 *     tags: [Fee Management]
 *     operationId: deleteFeeCategory
 *     summary: Delete a fee category
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
 *         description: Fee category deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/category/:id")
  .get(hasPermission(roles), feeManagementController.getFeeCategoryById)
  .put(hasPermission(roles), bodyValidator(updateFeeCategoryDTO), feeManagementController.updateFeeCategory)
  .delete(hasPermission(roles), feeManagementController.deleteFeeCategory)

// ─── Fee Structure ─────────────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/structure:
 *   post:
 *     tags: [Fee Management]
 *     operationId: createFeeStructure
 *     summary: Create a fee structure
 *     description: Links a fee category to a class/academic year with amount and frequency.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, academicYearId, feeCategoryId, amount, frequency]
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               feeCategoryId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 description: Must be positive
 *                 example: 5000
 *               frequency:
 *                 $ref: '#/components/schemas/FeeFrequency'
 *               allowPartialPayment:
 *                 type: boolean
 *                 example: true
 *               isOptional:
 *                 type: boolean
 *                 example: false
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Fee structure created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee structure created successfully
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
 *     tags: [Fee Management]
 *     operationId: getFeeStructures
 *     summary: List fee structures
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: List of fee structures
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee structures fetched successfully
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
router.route("/structure")
  .post(hasPermission(roles), bodyValidator(createFeeStructureDTO), feeManagementController.createFeeStructure)
  .get(hasPermission(roles), feeManagementController.getFeeStructures);

/**
 * @openapi
 * /fee-management/structure/{id}:
 *   get:
 *     tags: [Fee Management]
 *     operationId: getFeeStructureById
 *     summary: Get fee structure by ID
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
 *         description: Fee structure details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   put:
 *     tags: [Fee Management]
 *     operationId: updateFeeStructure
 *     summary: Update a fee structure
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
 *               classId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               feeCategoryId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               amount:
 *                 type: number
 *               frequency:
 *                 $ref: '#/components/schemas/FeeFrequency'
 *               allowPartialPayment:
 *                 type: boolean
 *               isOptional:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Fee structure updated
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
 *     tags: [Fee Management]
 *     operationId: deleteFeeStructure
 *     summary: Delete a fee structure
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
 *         description: Fee structure deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/structure/:id")
  .get(hasPermission(roles), feeManagementController.getFeeStructureById)
  .put(hasPermission(roles), bodyValidator(updateFeeStructureDTO), feeManagementController.updateFeeStructure)
  .delete(hasPermission(roles), feeManagementController.deleteFeeStructure)

// ─── Fee Setting ───────────────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/setting:
 *   put:
 *     tags: [Fee Management]
 *     operationId: upsertFeeSetting
 *     summary: Create or update fee settings
 *     description: Principal, Accountant, or Admin Staff. Upserts grace days, reminders, and defaults.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [graceDays, reminderEnabled]
 *             properties:
 *               graceDays:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 90
 *                 example: 7
 *               reminderEnabled:
 *                 type: boolean
 *                 example: true
 *               showOverdueFeeTab:
 *                 type: boolean
 *               defaultDueDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 example: 30
 *     responses:
 *       200:
 *         description: Fee setting saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee setting saved successfully
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
 *     tags: [Fee Management]
 *     operationId: getFeeSetting
 *     summary: Get fee settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current fee settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee setting fetched successfully
 *                 result:
 *                   type: object
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.route("/setting")
  .put(hasPermission(roles), bodyValidator(feeSettingDTO), feeManagementController.upsertFeeSetting)
  .get(hasPermission(roles), feeManagementController.getFeeSetting);

// ─── Assign Student Fee ────────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/student:
 *   post:
 *     tags: [Fee Management]
 *     operationId: assignStudentFee
 *     summary: Assign a fee to a student
 *     description: Principal, Accountant, or Admin Staff. Creates a StudentFee record linking a student to a fee structure.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, feeStructureId, dueDate]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               feeStructureId:
 *                 type: string
 *                 format: uuid
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-05-31"
 *               amount:
 *                 type: number
 *                 description: Override amount (optional; uses fee structure amount if not provided)
 *                 example: 4500
 *               periodLabel:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *                 example: "April 2024"
 *               periodStart:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               periodEnd:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Student fee assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student fee assigned successfully
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
router.route("/student")
  .post(hasPermission(roles), bodyValidator(assignStudentFeeDTO), feeManagementController.assignStudentFee);

router.route("/student/bulk")
  .post(hasPermission(roles), bodyValidator(bulkAssignStudentFeeDTO), feeManagementController.bulkAssignStudentFees);

// ─── Fee Records & Payments ────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/records:
 *   get:
 *     tags: [Fee Management]
 *     operationId: listFeeRecords
 *     summary: List fee records
 *     description: Principal, Accountant, Admin Staff, Student, or Parent. Returns fee records filtered by role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, PARTIAL, OVERDUE, WAIVED]
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
 *         description: Paginated fee records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fee records fetched
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
router.route("/records")
  .get(hasPermission([...roles, Role.STUDENT, Role.PARENT]), feeManagementController.listFeeRecords);

/**
 * @openapi
 * /fee-management/payments:
 *   get:
 *     tags: [Fee Management]
 *     operationId: listPayments
 *     summary: List payment transactions
 *     description: Principal, Accountant, Admin Staff, Student, or Parent. Returns payment history filtered by role.
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
 *                   example: Payments fetched
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
router.route("/payments")
  .get(hasPermission([...roles, Role.STUDENT, Role.PARENT]), feeManagementController.listPayments);

// ─── Extend Fee Due Date ───────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/student-fee/{id}/extend:
 *   put:
 *     tags: [Fee Management]
 *     operationId: extendFee
 *     summary: Extend a student fee due date
 *     description: Principal, Accountant, or Admin Staff.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: StudentFee UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [days]
 *             properties:
 *               days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 90
 *                 example: 14
 *     responses:
 *       200:
 *         description: Due date extended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Due date extended
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
router.route("/student-fee/:id/extend")
  .put(hasPermission(roles), bodyValidator(extendFeeDTO), feeManagementController.extendFee);

// ─── Update / Delete Student Fee ──────────────────────────────────────────────

router.route("/student-fee/:id")
  .put(hasPermission(roles), bodyValidator(updateStudentFeeDTO), feeManagementController.updateStudentFee)
  .delete(hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]), feeManagementController.deleteStudentFee);

// ─── Student & Parent Fees ─────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/student/{studentId}:
 *   get:
 *     tags: [Fee Management]
 *     operationId: getStudentFees
 *     summary: Get fees for a specific student
 *     description: Principal, Accountant, Admin Staff, Student (own), or Parent.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, PARTIAL, OVERDUE, WAIVED]
 *     responses:
 *       200:
 *         description: Student fee records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student fees fetched successfully
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
router.route("/student/:studentId")
  .get(hasPermission([...roles, Role.STUDENT, Role.PARENT]), feeManagementController.getStudentFees);

/**
 * @openapi
 * /fee-management/parent/{parentId}:
 *   get:
 *     tags: [Fee Management]
 *     operationId: getParentFees
 *     summary: Get fees for all children of a parent
 *     description: Principal, Accountant, Admin Staff, or Parent (own).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Parent's children fee records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Parent fees fetched
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
router.route("/parent/:parentId")
  .get(hasPermission([...roles, Role.PARENT]), feeManagementController.getParentFees);

// ─── Scholarship ───────────────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/scholarship:
 *   post:
 *     tags: [Fee Management]
 *     operationId: upsertScholarship
 *     summary: Create or update a scholarship for a student
 *     description: Principal, Accountant, or Admin Staff. Upserts a scholarship/discount on a student's fee.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, type, value, startDate, endDate]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               feeCategoryId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               type:
 *                 $ref: '#/components/schemas/DiscountType'
 *               value:
 *                 type: number
 *                 description: Percentage (0–100) or fixed amount
 *                 example: 50
 *               reason:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *               referredBy:
 *                 type: string
 *                 maxLength: 150
 *                 nullable: true
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-04-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-03-31"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Scholarship upserted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Scholarship saved
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
router.route("/scholarship")
  .post(hasPermission(roles), bodyValidator(upsertScholarshipDTO), feeManagementController.upsertScholarship);

// ─── Record Offline Payment ────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/payment:
 *   post:
 *     tags: [Fee Management]
 *     operationId: recordFeePayment
 *     summary: Record a fee payment
 *     description: Principal, Accountant, or Admin Staff. Records an offline payment with optional allocations to specific fee records.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, totalAmount, paymentMethod]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               totalAmount:
 *                 type: number
 *                 description: Total amount paid
 *                 example: 5000
 *               paymentMethod:
 *                 $ref: '#/components/schemas/PaymentMethod'
 *               transactionId:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *               receivedBy:
 *                 type: string
 *                 maxLength: 100
 *                 nullable: true
 *               note:
 *                 type: string
 *                 maxLength: 255
 *                 nullable: true
 *               allocations:
 *                 type: array
 *                 description: Optional allocation of payment to specific fee records
 *                 items:
 *                   type: object
 *                   required: [studentFeeId, amount]
 *                   properties:
 *                     studentFeeId:
 *                       type: string
 *                       format: uuid
 *                     amount:
 *                       type: number
 *                       example: 2500
 *     responses:
 *       200:
 *         description: Payment recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment recorded successfully
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
router.route("/payment")
  .post(hasPermission(roles), bodyValidator(recordPaymentDTO), feeManagementController.recordPayment);

// ─── Overdue Fees ──────────────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/overdue:
 *   get:
 *     tags: [Fee Management]
 *     operationId: getOverdueFees
 *     summary: Get overdue fee records
 *     description: Principal, Accountant, or Admin Staff. Returns all unpaid fees past their due date.
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Overdue fee records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Overdue fees fetched
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
router.route("/overdue")
  .get(hasPermission(roles), feeManagementController.getOverdueFees);

// ─── Reminders ─────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/reminder:
 *   post:
 *     tags: [Fee Management]
 *     operationId: scheduleReminder
 *     summary: Schedule a fee reminder
 *     description: Principal, Accountant, or Admin Staff. Schedules a payment reminder for a student fee.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentFeeId, reminderDate, reminderType]
 *             properties:
 *               studentFeeId:
 *                 type: string
 *                 format: uuid
 *               reminderDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-04-28"
 *               reminderType:
 *                 type: string
 *                 enum: [EMAIL, SMS, PUSH]
 *                 example: EMAIL
 *     responses:
 *       201:
 *         description: Reminder scheduled
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.route("/reminder")
  .post(hasPermission(roles), bodyValidator(scheduleReminderDTO), feeManagementController.scheduleReminder);

/**
 * @openapi
 * /fee-management/reminder/pending:
 *   get:
 *     tags: [Fee Management]
 *     operationId: getPendingReminders
 *     summary: Get pending fee reminders
 *     description: Principal, Accountant, or Admin Staff. Returns all scheduled but unsent reminders.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending reminders list
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.route("/reminder/pending")
  .get(hasPermission(roles), feeManagementController.getPendingReminders);

// ─── Audit Logs ────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/audit-logs:
 *   get:
 *     tags: [Fee Management]
 *     operationId: getFeeAuditLogs
 *     summary: Get fee audit logs
 *     description: Principal, Accountant, or Admin Staff. Returns all fee-related change events.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
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
 *         description: Audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Audit logs fetched
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
router.route("/audit-logs")
  .get(hasPermission(roles), feeManagementController.getFeeAuditLogs);

// ─── Scholarship History ───────────────────────────────────────────────────────

/**
 * @openapi
 * /fee-management/scholarship/history/{studentId}:
 *   get:
 *     tags: [Fee Management]
 *     operationId: getScholarshipHistory
 *     summary: Get scholarship history for a student
 *     description: Principal, Accountant, or Admin Staff.
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
 *         description: Scholarship history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Scholarship history fetched
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
router.route("/scholarship/history/:studentId")
  .get(hasPermission(roles), feeManagementController.getScholarshipHistory);

router.route("/scholarship/active/:studentId")
  .get(hasPermission(roles), feeManagementController.getActiveScholarships);

router.route("/scholarship/:id")
  .delete(hasPermission(roles), feeManagementController.deleteScholarship);

module.exports = router;
