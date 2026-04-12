const { Role } = require("../../config/constant.config")
const attachSchool = require("../../middleware/attachSchool.middleware")
const loginCheck = require("../../middleware/auth.middlewares")
const hasPermission = require("../../middleware/rbac.middlewares")
const { bodyValidator } = require("../../middleware/validator.middlewares")
const subjectController = require("./subject.controller")
const Joi = require("joi")
const {
    subjectDTO,
    updateSubjectDTO,
    assignSubjectToClassDTO,
    assignTeacherToSectionDTO,
} = require("./subject.request")

const router = require("express").Router()

const ADMIN_ROLES   = [Role.ADMIN_STAFF, Role.PRINCIPAL]
const VIEWER_ROLES  = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.ACCOUNTANT, Role.TEACHER, Role.STUDENT, Role.PARENT]

/**
 * @openapi
 * tags:
 *   name: Subjects
 *   description: Subject management and class/section-teacher assignment
 */

// ─── Subject CRUD ─────────────────────────────────────────────────────────────

/**
 * @openapi
 * /subjects:
 *   post:
 *     tags: [Subjects]
 *     operationId: createSubject
 *     summary: Create a new subject
 *     description: Admin Staff or Principal. Creates a school-level subject.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubjectDTO'
 *     responses:
 *       201:
 *         description: Subject created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject created successfully
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
 *     tags: [Subjects]
 *     operationId: listSubjects
 *     summary: List subjects
 *     description: All roles. Returns a paginated list of all subjects for the school.
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
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated list of subjects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subjects fetched
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
    .post(loginCheck, attachSchool, hasPermission(ADMIN_ROLES), bodyValidator(subjectDTO), subjectController.createSubject)
    .get(loginCheck, attachSchool, hasPermission(VIEWER_ROLES), subjectController.listSubjects)

/**
 * @openapi
 * /subjects/{id}:
 *   get:
 *     tags: [Subjects]
 *     operationId: getSubjectById
 *     summary: Get subject by ID
 *     description: All roles including Student and Parent.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Subject UUID
 *     responses:
 *       200:
 *         description: Subject details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject fetched successfully
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
 *     tags: [Subjects]
 *     operationId: updateSubject
 *     summary: Update a subject
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
 *             $ref: '#/components/schemas/UpdateSubjectDTO'
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject updated successfully
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
    .get(loginCheck, attachSchool, hasPermission(VIEWER_ROLES), subjectController.getSubjectById)
    .put(loginCheck, attachSchool, hasPermission(ADMIN_ROLES), bodyValidator(updateSubjectDTO), subjectController.updateSubject)

// ─── Subject ↔ Class Assignment ───────────────────────────────────────────────

/**
 * @openapi
 * /subjects/class/{classId}:
 *   get:
 *     tags: [Subjects]
 *     operationId: getSubjectsByClass
 *     summary: Get subjects assigned to a class
 *     description: All roles. Returns subjects linked to the given class.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class UUID
 *     responses:
 *       200:
 *         description: List of subjects assigned to the class
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subjects fetched for class
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
    "/class/:classId",
    loginCheck, attachSchool, hasPermission(VIEWER_ROLES),
    subjectController.getSubjectsByClass
)

/**
 * @openapi
 * /subjects/class/assign:
 *   post:
 *     tags: [Subjects]
 *     operationId: assignSubjectToClass
 *     summary: Assign a subject to a class
 *     description: Admin Staff or Principal. Links a subject to a class.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignSubjectToClassDTO'
 *     responses:
 *       201:
 *         description: Subject assigned to class successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject assigned to class
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
 *         description: Subject already assigned to this class
 */
router.post(
    "/class/assign",
    loginCheck, attachSchool, hasPermission(ADMIN_ROLES), bodyValidator(assignSubjectToClassDTO),
    subjectController.assignSubjectToClass
)

/**
 * @openapi
 * /subjects/class/remove:
 *   delete:
 *     tags: [Subjects]
 *     operationId: removeSubjectFromClass
 *     summary: Remove a subject from a class
 *     description: Admin Staff or Principal. Unlinks a subject from a class.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignSubjectToClassDTO'
 *     responses:
 *       200:
 *         description: Subject removed from class successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subject removed from class
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
router.delete(
    "/class/remove",
    loginCheck, attachSchool, hasPermission(ADMIN_ROLES), bodyValidator(assignSubjectToClassDTO),
    subjectController.removeSubjectFromClass
)

// ─── Section ↔ Subject ↔ Teacher Assignment ───────────────────────────────────

/**
 * @openapi
 * /subjects/section/{sectionId}/teachers:
 *   get:
 *     tags: [Subjects]
 *     operationId: getTeachersBySectionSubjects
 *     summary: List subject-teacher assignments for a section
 *     description: All roles. Returns each subject in the section and its assigned teacher.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Section UUID
 *     responses:
 *       200:
 *         description: Subject-teacher assignments for the section
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teachers fetched for section
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
    "/section/:sectionId/teachers",
    loginCheck, attachSchool, hasPermission(VIEWER_ROLES),
    subjectController.getTeachersBySectionSubjects
)

/**
 * @openapi
 * /subjects/section/{sectionId}/assign:
 *   post:
 *     tags: [Subjects]
 *     operationId: assignTeacherToSection
 *     summary: Assign a teacher to a section-subject slot
 *     description: >
 *       Admin Staff or Principal. Assigns (or replaces) a teacher for a specific subject in a section.
 *       Subject must already be assigned to the section's class.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Section UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignTeacherToSectionDTO'
 *     responses:
 *       201:
 *         description: Teacher assigned successfully
 *       200:
 *         description: Teacher assignment updated (replaced)
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       422:
 *         description: Subject not yet assigned to this section's class
 */
router.post(
    "/section/:sectionId/assign",
    loginCheck, attachSchool, hasPermission(ADMIN_ROLES), bodyValidator(assignTeacherToSectionDTO),
    subjectController.assignTeacherToSection
)

/**
 * @openapi
 * /subjects/section/{sectionId}/remove:
 *   delete:
 *     tags: [Subjects]
 *     operationId: removeTeacherFromSection
 *     summary: Remove teacher from a section-subject slot
 *     description: Admin Staff or Principal. Unassigns the teacher from a subject in a section.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Section UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectId]
 *             properties:
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Teacher removed from section-subject slot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher removed from section
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
router.delete(
    "/section/:sectionId/remove",
    loginCheck, attachSchool, hasPermission(ADMIN_ROLES),
    bodyValidator(Joi.object({ subjectId: Joi.string().uuid().required() })),
    subjectController.removeTeacherFromSection
)

module.exports = router
