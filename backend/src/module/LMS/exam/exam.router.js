const router = require("express").Router();
const { Role, FileFilterType } = require("../../../config/constant.config");
const attachSchool = require("../../../middleware/attachSchool.middleware");
const loginCheck = require("../../../middleware/auth.middlewares");
const hasPermission = require("../../../middleware/rbac.middlewares");
const { setPath, uploadMixed, persistAllToS3 } = require("../../../middleware/aws.middlware");
const { bodyValidator } = require("../../../middleware/validator.middlewares");
const { examDTO, updateExamDTO, submitExamDTO, reviewExamSubmissionDTO } = require("./exam.request");
const examController = require("./exam.controller");

// ─── File Upload Configurations ──────────────────────────────────────────
const uploadExamFiles = uploadMixed([
  FileFilterType.IMAGE,
  FileFilterType.DOCUMENT
]).array("questionFiles", 5);

const uploadSubmissionFiles = uploadMixed([
  FileFilterType.IMAGE,
  FileFilterType.DOCUMENT
]).array("answerFiles", 5);


// ─── Role Arrays ───────────────────────────────────────────────────────────
const readers = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT];
const writers = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER];

/**
 * @openapi
 * tags:
 *   name: LMS - Exams
 *   description: Exam creation, scheduling, submission, and grading
 */

/**
 * @openapi
 * /exams/students/me/exams:
 *   get:
 *     tags: [LMS - Exams]
 *     operationId: listExamsByStudent
 *     summary: List exams for the logged-in student
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
 *         description: Student exams fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exams fetched
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
router.get("/students/me/exams", loginCheck, attachSchool, hasPermission([Role.STUDENT]), examController.listExamsByStudent);

/**
 * @openapi
 * /exams/parents/me/children/{studentId}/exams:
 *   get:
 *     tags: [LMS - Exams]
 *     operationId: listExamsByParent
 *     summary: List exams for a parent's child
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
 *         description: Child exams fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exams fetched
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
router.get("/parents/me/children/:studentId/exams", loginCheck, attachSchool, hasPermission([Role.PARENT]), examController.listExamsByParent);

/**
 * @openapi
 * /exams/teachers/me/exams:
 *   get:
 *     tags: [LMS - Exams]
 *     operationId: listExamsByTeacher
 *     summary: List exams created by the logged-in teacher
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
 *         description: Teacher exams fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exams fetched
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
router.get("/teachers/me/exams", loginCheck, attachSchool, hasPermission([Role.TEACHER]), examController.listExamsByTeacher);

/**
 * @openapi
 * /exams/classes/{classId}/sections/{sectionId}/exams:
 *   get:
 *     tags: [LMS - Exams]
 *     operationId: listExamsByClassAndSection
 *     summary: List exams for a class and section
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
 *         description: Exams fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exams fetched
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
router.get("/classes/:classId/sections/:sectionId/exams", loginCheck, attachSchool, hasPermission(readers), examController.listExamsByClassAndSection);

/**
 * @openapi
 * /exams:
 *   post:
 *     tags: [LMS - Exams]
 *     operationId: createExam
 *     summary: Create an exam
 *     description: Admin Staff, Principal, or Teacher. Supports optional question file uploads (images/docs, max 5) via multipart.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [academicYearId, classId, subjectId, title, examCategory, totalMarks]
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
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional — derived from auth; admin may override
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Mid-term Algebra Exam
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *               instructions:
 *                 type: string
 *                 maxLength: 5000
 *               examCategory:
 *                 type: string
 *                 enum: [formative, summative, terminal]
 *               totalMarks:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *                 example: 100
 *               passMarks:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *               examDate:
 *                 type: string
 *                 format: date
 *               startAt:
 *                 type: string
 *                 format: date-time
 *               endAt:
 *                 type: string
 *                 format: date-time
 *               questionText:
 *                 type: string
 *                 maxLength: 5000
 *               externalQuestionFileUrl:
 *                 type: string
 *                 format: uri
 *               questionFiles:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 image or document files
 *               status:
 *                 type: string
 *                 enum: [draft, published, closed, evaluated, archived]
 *                 default: draft
 *               isPublished:
 *                 type: boolean
 *                 default: false
 *               resultPublished:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Exam created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exam created successfully
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
 *     tags: [LMS - Exams]
 *     operationId: listExams
 *     summary: List all exams
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
 *           enum: [draft, published, closed, evaluated, archived]
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
 *         description: Exams fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exams fetched
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

// ─── Core Exam Routes ──────────────────────────────────────────────────────
router.route("/")
  .post(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    setPath("exams"),
    uploadExamFiles,
    persistAllToS3,
    bodyValidator(examDTO),
    examController.createExam
  )
  .get(loginCheck, attachSchool, hasPermission(readers), examController.listExams);

/**
 * @openapi
 * /exams/{id}:
 *   get:
 *     tags: [LMS - Exams]
 *     operationId: getExamById
 *     summary: Get exam by ID
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
 *         description: Exam details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exam fetched
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
 *     tags: [LMS - Exams]
 *     operationId: updateExam
 *     summary: Update an exam
 *     description: Admin Staff, Principal, or Teacher. At least one field required. Supports file replacement via multipart.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               examCategory:
 *                 type: string
 *                 enum: [formative, summative, terminal]
 *               totalMarks:
 *                 type: number
 *               passMarks:
 *                 type: number
 *               examDate:
 *                 type: string
 *                 format: date
 *               startAt:
 *                 type: string
 *                 format: date-time
 *               endAt:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [draft, published, closed, evaluated, archived]
 *               isPublished:
 *                 type: boolean
 *               resultPublished:
 *                 type: boolean
 *               questionFiles:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Exam updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exam updated successfully
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
 *     tags: [LMS - Exams]
 *     operationId: deleteExam
 *     summary: Delete an exam
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
 *         description: Exam deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exam deleted successfully
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
  .get(loginCheck, attachSchool, hasPermission(readers), examController.getExamById)
  .put(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    setPath("exams"),
    uploadExamFiles,
    persistAllToS3,
    bodyValidator(updateExamDTO),
    examController.updateExam
  )
  .delete(loginCheck, attachSchool, hasPermission(writers), examController.deleteExam);

/**
 * @openapi
 * /exams/{id}/submit:
 *   post:
 *     tags: [LMS - Exams]
 *     operationId: submitExam
 *     summary: Submit exam answers
 *     description: Student only. Uploads answer files (images/docs, max 5) and/or provides an external answer file URL.
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
 *               answerFiles:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Answer images or documents (max 5)
 *               externalAnswerFileUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Exam submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Exam submitted successfully
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

// ─── Exam Submission Routes ────────────────────────────────────────────────
router.post(
  "/:id/submit",
  loginCheck,
  attachSchool,
  hasPermission([Role.STUDENT]),
  setPath("exam_submissions"),
  uploadSubmissionFiles,
  persistAllToS3,
  bodyValidator(submitExamDTO),
  examController.submitExam
);

/**
 * @openapi
 * /exams/{id}/submissions:
 *   get:
 *     tags: [LMS - Exams]
 *     operationId: listExamSubmissions
 *     summary: List all submissions for an exam
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
 *         description: Exam submissions fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Submissions fetched
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
router.get(
  "/:id/submissions",
  loginCheck,
  attachSchool,
  hasPermission(writers),
  examController.listExamSubmissions
);

/**
 * @openapi
 * /exams/{id}/submissions/me:
 *   get:
 *     tags: [LMS - Exams]
 *     operationId: getMyExamSubmission
 *     summary: Get the logged-in student's own exam submission
 *     description: Student only.
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
 *         description: Student's exam submission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Submission fetched
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
router.get(
  "/:id/submissions/me",
  loginCheck,
  attachSchool,
  hasPermission([Role.STUDENT]),
  examController.getMyExamSubmission
);

/**
 * @openapi
 * /exams/{examId}/submissions/{submissionId}/review:
 *   put:
 *     tags: [LMS - Exams]
 *     operationId: reviewExamSubmission
 *     summary: Review and grade an exam submission
 *     description: Admin Staff, Principal, or Teacher.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: submissionId
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reviewed]
 *               marksObtained:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1000
 *               feedback:
 *                 type: string
 *                 maxLength: 5000
 *     responses:
 *       200:
 *         description: Submission reviewed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Submission reviewed successfully
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
  "/:examId/submissions/:submissionId/review",
  loginCheck,
  attachSchool,
  hasPermission(writers),
  bodyValidator(reviewExamSubmissionDTO),
  examController.reviewExamSubmission
);

module.exports = router;
