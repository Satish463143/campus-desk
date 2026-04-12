const { Role } = require("../../config/constant.config")
const attachSchool = require("../../middleware/attachSchool.middleware")
const loginCheck = require("../../middleware/auth.middlewares")
const hasPermission = require("../../middleware/rbac.middlewares")
const { bodyValidator } = require("../../middleware/validator.middlewares")
const academicYearController = require("./academicYear.controller")
const { academicYearDTO, updateAcademicYearDTO } = require("./academicYear.request")

const router = require("express").Router()

/**
 * @openapi
 * tags:
 *   name: Academic Years
 *   description: Academic year management
 */

/**
 * @openapi
 * /academic-years:
 *   post:
 *     tags: [Academic Years]
 *     operationId: createAcademicYear
 *     summary: Create an academic year
 *     description: Admin Staff or Principal. Creates a new academic year for the school.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDate, endDate]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 20
 *                 description: Academic year label
 *                 example: "2024-2025"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-04-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Must be after startDate
 *                 example: "2025-03-31"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Academic year created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Academic year created successfully
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
 *     tags: [Academic Years]
 *     operationId: listAcademicYears
 *     summary: List academic years
 *     description: Admin Staff, Principal, Accountant, or Teacher. Returns all academic years for the school.
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
 *     responses:
 *       200:
 *         description: List of academic years
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Academic years fetched
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
    .post(loginCheck, attachSchool, hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]), bodyValidator(academicYearDTO), academicYearController.createAcademicYear)
    .get(loginCheck, attachSchool, hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.ACCOUNTANT, Role.TEACHER]), academicYearController.listAcademicYears)

/**
 * @openapi
 * /academic-years/{id}:
 *   get:
 *     tags: [Academic Years]
 *     operationId: getAcademicYearById
 *     summary: Get academic year by ID
 *     description: Admin Staff, Principal, Accountant, or Teacher.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Academic year UUID
 *     responses:
 *       200:
 *         description: Academic year details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Academic year fetched successfully
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
 *     tags: [Academic Years]
 *     operationId: updateAcademicYear
 *     summary: Update an academic year
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
 *                 maxLength: 20
 *                 example: "2024-2025"
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Academic year updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Academic year updated successfully
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
    .get(loginCheck, attachSchool, hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.ACCOUNTANT, Role.TEACHER]), academicYearController.getAcademicYearById)
    .put(loginCheck, attachSchool, hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]), bodyValidator(updateAcademicYearDTO), academicYearController.updateAcademicYear)

module.exports = router
