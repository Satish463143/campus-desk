const { Role } = require("../../../config/constant.config");
const attachSchool = require("../../../middleware/attachSchool.middleware");
const loginCheck = require("../../../middleware/auth.middlewares");
const hasPermission = require("../../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../../middleware/validator.middlewares");
const chapterController = require("./chapter.controller");
const { chapterDTO, updateChapterDTO } = require("./chapter.request");

const router = require("express").Router();

// Who can read
const readers = [
  Role.ADMIN_STAFF,
  Role.PRINCIPAL,
  Role.TEACHER,
  Role.STUDENT,
  Role.PARENT,
];

// Who can write
const writers = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER];

/**
 * @openapi
 * tags:
 *   name: LMS - Chapters
 *   description: Syllabus chapters with progress tracking
 */

/**
 * @openapi
 * /chapters:
 *   post:
 *     tags: [LMS - Chapters]
 *     operationId: createChapter
 *     summary: Create a chapter
 *     description: Admin Staff, Principal, or Teacher.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [academicYearId, classId, subjectId, title]
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
 *               syllabusId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Chapter 1 — Introduction to Algebra
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               orderIndex:
 *                 type: integer
 *                 minimum: 0
 *                 default: 0
 *               estimatedMinutes:
 *                 type: integer
 *                 minimum: 1
 *                 example: 60
 *               publishStatus:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Chapter created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chapter created successfully
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
 *     tags: [LMS - Chapters]
 *     operationId: listChapters
 *     summary: List chapters
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
 *         name: syllabusId
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
 *         description: Chapters fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chapters fetched
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
router
  .route("/")
  .post(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    bodyValidator(chapterDTO),
    chapterController.createChapter
  )
  .get(loginCheck, attachSchool, hasPermission(readers), chapterController.listChapter);

/**
 * @openapi
 * /chapters/students/me/chapters:
 *   get:
 *     tags: [LMS - Chapters]
 *     operationId: listChaptersByStudent
 *     summary: List chapters for the logged-in student
 *     description: Student only. Returns chapters for the student's enrolled class and subjects.
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
 *         description: Student chapters fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chapters fetched
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
router.get("/students/me/chapters", loginCheck, attachSchool, hasPermission([Role.STUDENT]), chapterController.listChapterByStudent);

/**
 * @openapi
 * /chapters/parents/me/children/{studentId}/chapters:
 *   get:
 *     tags: [LMS - Chapters]
 *     operationId: listChaptersByParent
 *     summary: List chapters for a parent's child
 *     description: Parent only.
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Child chapters fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chapters fetched
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
router.get("/parents/me/children/:studentId/chapters", loginCheck, attachSchool, hasPermission([Role.PARENT]), chapterController.listChapterByParent);

/**
 * @openapi
 * /chapters/{id}:
 *   get:
 *     tags: [LMS - Chapters]
 *     operationId: getChapterById
 *     summary: Get chapter by ID
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
 *         description: Chapter details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chapter fetched
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
 *     tags: [LMS - Chapters]
 *     operationId: updateChapter
 *     summary: Update a chapter
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
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               orderIndex:
 *                 type: integer
 *                 minimum: 0
 *               estimatedMinutes:
 *                 type: integer
 *                 minimum: 1
 *               publishStatus:
 *                 type: string
 *                 enum: [draft, published, archived]
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
 *               syllabusId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Chapter updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chapter updated successfully
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
 *     tags: [LMS - Chapters]
 *     operationId: deleteChapter
 *     summary: Delete a chapter
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
 *         description: Chapter deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chapter deleted successfully
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
  .get(loginCheck, attachSchool, hasPermission(readers), chapterController.getChapterById)
  .put(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    bodyValidator(updateChapterDTO),
    chapterController.updateChapter
  )
  .delete(loginCheck, attachSchool, hasPermission(writers), chapterController.deleteChapter);

/**
 * @openapi
 * /chapters/{id}/progress:
 *   get:
 *     tags: [LMS - Chapters]
 *     operationId: getChapterProgress
 *     summary: Get progress for a chapter
 *     description: Admin Staff, Principal, Teacher, or Student. Returns completion percentage and status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Required for teachers/admins to view a specific student's progress
 *     responses:
 *       200:
 *         description: Progress fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Progress fetched
 *                 result:
 *                   type: object
 *                   properties:
 *                     completionPercent:
 *                       type: number
 *                       example: 75
 *                     isCompleted:
 *                       type: boolean
 *                       example: false
 *                 meta:
 *                   nullable: true
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *
 *   post:
 *     tags: [LMS - Chapters]
 *     operationId: createChapterProgress
 *     summary: Create progress record for a chapter
 *     description: Admin Staff, Principal, Teacher, or Student. Teachers may pass studentId to create progress on behalf of a student.
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
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *                 description: Required for teachers — specifies the target student
 *               completionPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 0
 *               isCompleted:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Progress created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Progress created successfully
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
 *   patch:
 *     tags: [LMS - Chapters]
 *     operationId: updateChapterProgress
 *     summary: Update progress for a chapter
 *     description: Admin Staff, Principal, Teacher, or Student. At least one field required.
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
 *               completionPercent:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Progress updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Progress updated successfully
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

// ─── Progress Tracking ───
const staffAndStudent = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT];

router.route("/:id/progress")
  .get(loginCheck, attachSchool, hasPermission(staffAndStudent), chapterController.getProgress)
  .post(
    loginCheck,
    attachSchool,
    hasPermission(staffAndStudent),
    bodyValidator(require("./chapter.request").createChapterProgressDTO),
    chapterController.createProgress
  )
  .patch(
    loginCheck,
    attachSchool,
    hasPermission(staffAndStudent),
    bodyValidator(require("./chapter.request").updateChapterProgressDTO),
    chapterController.updateProgress
  );

module.exports = router;
