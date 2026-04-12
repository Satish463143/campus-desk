const { Role } = require("../../config/constant.config")
const attachSchool = require("../../middleware/attachSchool.middleware")
const loginCheck = require("../../middleware/auth.middlewares")
const hasPermission = require("../../middleware/rbac.middlewares")
const { bodyValidator } = require("../../middleware/validator.middlewares")
const sectionController = require("./section.controller")
const { sectionDTO, updateSectionDTO } = require("./section.request")

const router = require("express").Router()

/**
 * @openapi
 * tags:
 *   name: Sections
 *   description: Section management
 */

/**
 * @openapi
 * /sections:
 *   post:
 *     tags: [Sections]
 *     operationId: createSection
 *     summary: Create a new section
 *     description: Admin Staff or Principal. Creates a section within a class.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SectionDTO'
 *     responses:
 *       201:
 *         description: Section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Section created successfully
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
 *       409:
 *         description: Section name already exists in this class
 *
 *   get:
 *     tags: [Sections]
 *     operationId: listSections
 *     summary: List sections
 *     description: Admin Staff, Principal, Accountant, or Teacher. Can be filtered by class or academic year.
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
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by class
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by academic year
 *     responses:
 *       200:
 *         description: Paginated list of sections
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sections fetched
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
    .post(loginCheck, attachSchool, hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]), bodyValidator(sectionDTO), sectionController.createSection)
    .get(loginCheck, attachSchool, hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.ACCOUNTANT, Role.TEACHER]), sectionController.listSections)

/**
 * @openapi
 * /sections/{id}:
 *   get:
 *     tags: [Sections]
 *     operationId: getSectionById
 *     summary: Get section by ID
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
 *         description: Section UUID
 *     responses:
 *       200:
 *         description: Section details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Section fetched successfully
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
 *     tags: [Sections]
 *     operationId: updateSection
 *     summary: Update a section
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
 *             $ref: '#/components/schemas/UpdateSectionDTO'
 *     responses:
 *       200:
 *         description: Section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Section updated successfully
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
 *       409:
 *         description: Section name already exists in this class
 */
router.route("/:id")
    .get(loginCheck, attachSchool, hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.ACCOUNTANT, Role.TEACHER]), sectionController.getSectionById)
    .put(loginCheck, attachSchool, hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]), bodyValidator(updateSectionDTO), sectionController.updateSection)

module.exports = router
