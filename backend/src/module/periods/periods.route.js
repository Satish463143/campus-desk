const router = require("express").Router();
const periodController = require("./periods.controller");
const { createPeriodDTO, updatePeriodDTO } = require("./periods.request");
const loginCheck = require("../../middleware/auth.middlewares");
const attachSchool = require("../../middleware/attachSchool.middleware");
const hasPermission = require("../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../middleware/validator.middlewares");
const { Role } = require("../../config/constant.config");

/**
 * @openapi
 * tags:
 *   name: Periods
 *   description: School period (time slot) management
 */

/**
 * @openapi
 * /periods:
 *   post:
 *     tags: [Periods]
 *     operationId: createPeriod
 *     summary: Create a period
 *     description: Admin Staff or Principal. Creates a time-slot period for an academic year.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, periodNumber, startTime, durationMinutes, academicYearId]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Period 1"
 *               periodNumber:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               startTime:
 *                 type: string
 *                 description: "24-hour time in HH:MM format"
 *                 pattern: "^([01]\\d|2[0-3]):[0-5]\\d$"
 *                 example: "08:00"
 *               durationMinutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 300
 *                 example: 45
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               isBreak:
 *                 type: boolean
 *                 example: false
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Period created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Period created successfully
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
 *     tags: [Periods]
 *     operationId: getPeriods
 *     summary: List periods
 *     description: Admin Staff, Principal, Teacher, or Student.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic year
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of periods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Periods fetched
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
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]),
        bodyValidator(createPeriodDTO),
        periodController.createPeriod
    )
    .get(
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT]),
        periodController.getPeriods
    );

/**
 * @openapi
 * /periods/{id}:
 *   get:
 *     tags: [Periods]
 *     operationId: getPeriodById
 *     summary: Get period by ID
 *     description: Admin Staff, Principal, Teacher, or Student.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Period UUID
 *     responses:
 *       200:
 *         description: Period details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Period fetched
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
 *     tags: [Periods]
 *     operationId: updatePeriod
 *     summary: Update a period
 *     description: Admin Staff or Principal. At least one field must be provided.
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
 *               periodNumber:
 *                 type: integer
 *                 minimum: 1
 *               startTime:
 *                 type: string
 *                 description: HH:MM 24-hour format
 *                 example: "09:00"
 *               durationMinutes:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 300
 *               isBreak:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Period updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Period updated successfully
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
 *     tags: [Periods]
 *     operationId: deletePeriod
 *     summary: Delete a period
 *     description: Admin Staff or Principal.
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
 *         description: Period deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Period deleted successfully
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
router.route("/:id")
    .get(
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT]),
        periodController.getPeriodById
    )
    .put(
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]),
        bodyValidator(updatePeriodDTO),
        periodController.updatePeriod
    )
    .delete(
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]),
        periodController.deletePeriod
    );

module.exports = router;
