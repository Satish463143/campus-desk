const { Role } = require("../../../config/constant.config");
const attachSchool = require("../../../middleware/attachSchool.middleware");
const loginCheck = require("../../../middleware/auth.middlewares");
const hasPermission = require("../../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../../middleware/validator.middlewares");
const liveClassController = require("./liveClass.controller");
const { liveClassDTO, updateLiveClassDTO } = require("./liveClass.request");

const router = require("express").Router();

// Who can read live classes
const readers = [
  Role.ADMIN_STAFF,
  Role.PRINCIPAL,
  Role.TEACHER,
  Role.STUDENT,
  Role.PARENT,
];

// Who can create/edit live classes
const writers = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER];

/**
 * @openapi
 * tags:
 *   name: LMS - Live Classes
 *   description: Live class scheduling and management
 */

/**
 * @openapi
 * /live-classes/students/me/live-classes:
 *   get:
 *     tags: [LMS - Live Classes]
 *     operationId: listLiveClassesByStudent
 *     summary: List live classes for the logged-in student
 *     description: Student only.
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
 *         description: Student live classes fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Live classes fetched
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

// ─── Filtered Views ────────────────────────────────────────────────────────
router.get('/students/me/live-classes', loginCheck, attachSchool, hasPermission([Role.STUDENT]), liveClassController.listLiveClassesByStudent);

/**
 * @openapi
 * /live-classes/teachers/me/live-classes:
 *   get:
 *     tags: [LMS - Live Classes]
 *     operationId: listLiveClassesByTeacher
 *     summary: List live classes created by the logged-in teacher
 *     description: Teacher only.
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
 *         description: Teacher live classes fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Live classes fetched
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
router.get('/teachers/me/live-classes', loginCheck, attachSchool, hasPermission([Role.TEACHER]), liveClassController.listLiveClassesByTeacher);

/**
 * @openapi
 * /live-classes/classes/{classId}/sections/{sectionId}/live-classes:
 *   get:
 *     tags: [LMS - Live Classes]
 *     operationId: listLiveClassesByClassAndSection
 *     summary: List live classes for a class and section
 *     description: All authenticated roles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: sectionId
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Live classes fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Live classes fetched
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
router.get('/classes/:classId/sections/:sectionId/live-classes', loginCheck, attachSchool, hasPermission(readers), liveClassController.listLiveClassesByClassAndSection);

/**
 * @openapi
 * /live-classes:
 *   post:
 *     tags: [LMS - Live Classes]
 *     operationId: createLiveClass
 *     summary: Schedule a live class
 *     description: Admin Staff, Principal, or Teacher.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [academicYearId, classId, subjectId, title, joinLink, scheduledAt]
 *             properties:
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *               sectionId:
 *                 type: string
 *                 format: uuid
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               chapterId:
 *                 type: string
 *                 format: uuid
 *               periodId:
 *                 type: string
 *                 format: uuid
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional — derived from auth; admin may override
 *               liveClassType:
 *                 type: string
 *                 enum: [regular, extra]
 *                 default: regular
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Chapter 5 — Quadratic Equations
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               joinLink:
 *                 type: string
 *                 format: uri
 *                 example: https://meet.google.com/abc-defg-hij
 *               platform:
 *                 type: string
 *                 maxLength: 255
 *                 example: Google Meet
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               endAt:
 *                 type: string
 *                 format: date-time
 *               recordingLink:
 *                 type: string
 *                 format: uri
 *               status:
 *                 type: string
 *                 enum: [scheduled, live, completed, cancelled]
 *                 default: scheduled
 *     responses:
 *       201:
 *         description: Live class scheduled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Live class created successfully
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
 *     tags: [LMS - Live Classes]
 *     operationId: listLiveClasses
 *     summary: List all live classes
 *     description: All authenticated roles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, live, completed, cancelled]
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
 *         description: Live classes fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Live classes fetched
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

// ─── Core Live Class Routes ────────────────────────────────────────────────
router
  .route("/")
  .post(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    bodyValidator(liveClassDTO),
    liveClassController.createLiveClass
  )
  .get(loginCheck, attachSchool, hasPermission(readers), liveClassController.listLiveClasses);

/**
 * @openapi
 * /live-classes/{id}:
 *   get:
 *     tags: [LMS - Live Classes]
 *     operationId: getLiveClassById
 *     summary: Get live class by ID
 *     description: All authenticated roles.
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
 *         description: Live class details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Live class fetched
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
 *     tags: [LMS - Live Classes]
 *     operationId: updateLiveClass
 *     summary: Update a live class
 *     description: Admin Staff, Principal, or Teacher. At least one field required.
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
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               joinLink:
 *                 type: string
 *                 format: uri
 *               platform:
 *                 type: string
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               endAt:
 *                 type: string
 *                 format: date-time
 *               recordingLink:
 *                 type: string
 *                 format: uri
 *               status:
 *                 type: string
 *                 enum: [scheduled, live, completed, cancelled]
 *               liveClassType:
 *                 type: string
 *                 enum: [regular, extra]
 *     responses:
 *       200:
 *         description: Live class updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Live class updated successfully
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
 *     tags: [LMS - Live Classes]
 *     operationId: deleteLiveClass
 *     summary: Delete a live class
 *     description: Admin Staff, Principal, or Teacher.
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
 *         description: Live class deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Live class deleted successfully
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
router
  .route("/:id")
  .get(loginCheck, attachSchool, hasPermission(readers), liveClassController.getLiveClassById)
  .put(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    bodyValidator(updateLiveClassDTO),
    liveClassController.updateLiveClass
  )
  .delete(loginCheck, attachSchool, hasPermission(writers), liveClassController.deleteLiveClass);

module.exports = router;
