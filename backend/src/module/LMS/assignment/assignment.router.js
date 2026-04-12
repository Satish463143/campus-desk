const { Role, FileFilterType } = require("../../../config/constant.config");
const attachSchool = require("../../../middleware/attachSchool.middleware");
const loginCheck = require("../../../middleware/auth.middlewares");
const { setPath, uploadMixed, persistAllToS3 } = require("../../../middleware/aws.middlware");
const hasPermission = require("../../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../../middleware/validator.middlewares");
const assignmentController = require("./assignment.controller");
const {
  assignmentDTO,
  updateAssignmentDTO,
  submitAssignmentDTO,
  reviewSubmissionDTO
} = require("./assignment.request");

const router = require("express").Router();

// Who can read assignments
const readers = [
  Role.ADMIN_STAFF,
  Role.PRINCIPAL,
  Role.TEACHER,
  Role.STUDENT,
  Role.PARENT,
];

// Who can create/edit assignments
const writers = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER];

// Assignment file upload allows image OR document (pdf/doc/etc.), max 5 MB
const uploadAssignmentFiles = uploadMixed([
  FileFilterType.IMAGE,
  FileFilterType.DOCUMENT,
]).fields([{ name: "attachmentKeys", maxCount: 5 }]);

// Submission file upload allows image OR document (pdf/doc/etc.), max 5 MB
const uploadSubmissionFiles = uploadMixed([
  FileFilterType.IMAGE,
  FileFilterType.DOCUMENT,
]).fields([{ name: "submissionKeys", maxCount: 5 }]);

/**
 * @openapi
 * tags:
 *   name: LMS - Assignments
 *   description: Assignment creation, submission, and grading
 */

/**
 * @openapi
 * /assignments:
 *   post:
 *     tags: [LMS - Assignments]
 *     operationId: createAssignment
 *     summary: Create an assignment
 *     description: Admin Staff, Principal, or Teacher. Supports optional file attachments (images/docs, max 5) via multipart.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [academicYearId, classId, subjectId, title, dueDate, submissionType]
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
 *               chapterId:
 *                 type: string
 *                 format: uuid
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional — derived from auth; admin may override
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Chapter 3 Worksheet
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               instructions:
 *                 type: string
 *                 maxLength: 2000
 *               totalMarks:
 *                 type: number
 *                 minimum: 0
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               allowLateSubmission:
 *                 type: boolean
 *                 default: false
 *               submissionType:
 *                 type: string
 *                 enum: [text, file, text_file, link]
 *               publishStatus:
 *                 type: string
 *                 enum: [draft, published, closed, archived]
 *                 default: draft
 *               attachmentKeys:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 image or document files
 *               externalAttachmentUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Assignment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignment created successfully
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
 *     tags: [LMS - Assignments]
 *     operationId: listAssignments
 *     summary: List all assignments
 *     description: Admin Staff, Principal, Teacher, Student, or Parent.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: subjectId
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
 *         description: Assignments fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignments fetched
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

// ─── Core Assignment Routes ────────────────────────────────────────────────
router
  .route("/")
  .post(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    setPath("assignment"),
    uploadAssignmentFiles,
    persistAllToS3,
    bodyValidator(assignmentDTO),
    assignmentController.createAssignment
  )
  .get(loginCheck, attachSchool, hasPermission(readers), assignmentController.listAssignment);

/**
 * @openapi
 * /assignments/{id}:
 *   get:
 *     tags: [LMS - Assignments]
 *     operationId: getAssignmentById
 *     summary: Get assignment by ID
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
 *         description: Assignment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignment fetched
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
 *     tags: [LMS - Assignments]
 *     operationId: updateAssignment
 *     summary: Update an assignment
 *     description: Admin Staff, Principal, or Teacher. Supports file replacement via multipart. At least one field required.
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
 *               description:
 *                 type: string
 *               instructions:
 *                 type: string
 *               totalMarks:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               allowLateSubmission:
 *                 type: boolean
 *               submissionType:
 *                 type: string
 *                 enum: [text, file, text_file, link]
 *               publishStatus:
 *                 type: string
 *                 enum: [draft, published, closed, archived]
 *               attachmentKeys:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *               externalAttachmentUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Assignment updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignment updated successfully
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
 *     tags: [LMS - Assignments]
 *     operationId: deleteAssignment
 *     summary: Delete an assignment
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
 *         description: Assignment deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignment deleted successfully
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
  .get(loginCheck, attachSchool, hasPermission(readers), assignmentController.getAssignmentById)
  .put(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    setPath("assignment"),
    uploadAssignmentFiles,
    persistAllToS3,
    bodyValidator(updateAssignmentDTO),
    assignmentController.updateAssignment
  )
  .delete(loginCheck, attachSchool, hasPermission(writers), assignmentController.deleteAssignment);

/**
 * @openapi
 * /assignments/classes/{classId}/subjects/{subjectId}/assignments:
 *   get:
 *     tags: [LMS - Assignments]
 *     operationId: listAssignmentByClassAndSubject
 *     summary: List assignments for a class and subject
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
 *         name: subjectId
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
 *         description: Assignments fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignments fetched
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
router.get('/classes/:classId/subjects/:subjectId/assignments', loginCheck, attachSchool, hasPermission(readers), assignmentController.listAssignmentByClassAndSubject);

/**
 * @openapi
 * /assignments/students/me/assignments:
 *   get:
 *     tags: [LMS - Assignments]
 *     operationId: listAssignmentByStudent
 *     summary: List assignments for the logged-in student
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
 *         description: Student assignments fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignments fetched
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
router.get('/students/me/assignments', loginCheck, attachSchool, hasPermission([Role.STUDENT]), assignmentController.listAssignmentByStudent);

/**
 * @openapi
 * /assignments/parents/me/children/{studentId}/assignments:
 *   get:
 *     tags: [LMS - Assignments]
 *     operationId: listAssignmentByParent
 *     summary: List assignments for a parent's child
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
 *         description: Child assignments fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignments fetched
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
router.get('/parents/me/children/:studentId/assignments', loginCheck, attachSchool, hasPermission([Role.PARENT]), assignmentController.listAssignmentByParent);

/**
 * @openapi
 * /assignments/teachers/me/assignments:
 *   get:
 *     tags: [LMS - Assignments]
 *     operationId: listAssignmentByTeacher
 *     summary: List assignments created by the logged-in teacher
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
 *         description: Teacher assignments fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignments fetched
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
router.get('/teachers/me/assignments', loginCheck, attachSchool, hasPermission([Role.TEACHER]), assignmentController.listAssignmentByTeacher);

/**
 * @openapi
 * /assignments/{assignmentId}/submissions:
 *   post:
 *     tags: [LMS - Assignments]
 *     operationId: submitAssignment
 *     summary: Submit an assignment
 *     description: Student only. At least one of submissionKeys (files) or externalSubmissionLink must be provided.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
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
 *             properties:
 *               submissionKeys:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 image or document files
 *               externalSubmissionLink:
 *                 type: string
 *                 format: uri
 *                 description: External link (e.g. Google Drive) as an alternative to file upload
 *     responses:
 *       201:
 *         description: Submission created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assignment submitted successfully
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
 *     tags: [LMS - Assignments]
 *     operationId: getAssignmentSubmissions
 *     summary: List all submissions for an assignment
 *     description: Admin Staff, Principal, or Teacher.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
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
 *         description: Submissions listed
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

// ─── Assignment Submissions ────────────────────────────────────────────────
router.route('/:assignmentId/submissions')
  .post(
    loginCheck,
    attachSchool,
    hasPermission([Role.STUDENT]),
    setPath("submission"),
    uploadSubmissionFiles,
    persistAllToS3,
    bodyValidator(submitAssignmentDTO),
    assignmentController.submitAssignment
  )
  .get(loginCheck, attachSchool, hasPermission(writers), assignmentController.getAssignmentSubmissions);

/**
 * @openapi
 * /assignments/submissions/{id}:
 *   get:
 *     tags: [LMS - Assignments]
 *     operationId: getAssignmentSubmissionById
 *     summary: Get a single submission by ID
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
 *         description: Submission details
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
 *
 *   put:
 *     tags: [LMS - Assignments]
 *     operationId: updateAssignmentSubmission
 *     summary: Update (resubmit) a submission
 *     description: Student only. Replaces the submitted files or link.
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
 *             properties:
 *               submissionKeys:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *               externalSubmissionLink:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Submission updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Submission updated successfully
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
 *     tags: [LMS - Assignments]
 *     operationId: deleteAssignmentSubmission
 *     summary: Delete a submission
 *     description: Student only. Can only delete own submission.
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
 *         description: Submission deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Submission deleted successfully
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
router.route('/submissions/:id')
  .get(loginCheck, attachSchool, hasPermission(readers), assignmentController.getAssignmentSubmissionById)
  .put(
    loginCheck,
    attachSchool,
    hasPermission([Role.STUDENT]),
    setPath("submission"),
    uploadSubmissionFiles,
    persistAllToS3,
    bodyValidator(submitAssignmentDTO),
    assignmentController.updateAssignmentSubmission
  )
  .delete(loginCheck, attachSchool, hasPermission([Role.STUDENT]), assignmentController.deleteAssignmentSubmission);

/**
 * @openapi
 * /assignments/submissions/{id}/review:
 *   patch:
 *     tags: [LMS - Assignments]
 *     operationId: reviewAssignmentSubmission
 *     summary: Review and grade a submission
 *     description: Teacher, Admin Staff, or Principal. Updates submission status to reviewed or graded, with optional marks and feedback.
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reviewed, graded]
 *               marksObtained:
 *                 type: number
 *                 minimum: 0
 *               feedback:
 *                 type: string
 *                 maxLength: 2000
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

// ─── Teacher Review and Grading ────────────────────────────────────────────
router.patch(
  '/submissions/:id/review',
  loginCheck,
  attachSchool,
  hasPermission([Role.TEACHER, Role.ADMIN_STAFF, Role.PRINCIPAL]),
  bodyValidator(reviewSubmissionDTO),
  assignmentController.reviewAssignmentSubmission
);

/**
 * @openapi
 * /assignments/students/me/submissions:
 *   get:
 *     tags: [LMS - Assignments]
 *     operationId: listAssignmentSubmissionByStudent
 *     summary: List the logged-in student's own submissions
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
 *         description: Student submissions fetched
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
router.get('/students/me/submissions', loginCheck, attachSchool, hasPermission([Role.STUDENT]), assignmentController.listAssignmentSubmissionByStudent);

/**
 * @openapi
 * /assignments/parents/me/children/{studentId}/submissions:
 *   get:
 *     tags: [LMS - Assignments]
 *     operationId: listAssignmentSubmissionByParent
 *     summary: List a parent's child's submissions
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
 *         description: Child submissions fetched
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
router.get('/parents/me/children/:studentId/submissions', loginCheck, attachSchool, hasPermission([Role.PARENT]), assignmentController.listAssignmentSubmissionByParent);

/**
 * @openapi
 * /assignments/{assignmentId}/submission-stats:
 *   get:
 *     tags: [LMS - Assignments]
 *     operationId: getAssignmentSubmissionStats
 *     summary: Get submission statistics for an assignment
 *     description: Admin Staff, Principal, or Teacher. Returns counts of submitted, graded, pending students.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Submission statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Submission stats fetched
 *                 result:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     submitted:
 *                       type: integer
 *                     graded:
 *                       type: integer
 *                     pending:
 *                       type: integer
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

// ─── Teacher Stats ─────────────────────────────────────────────────────────
router.get('/:assignmentId/submission-stats', loginCheck, attachSchool, hasPermission(writers), assignmentController.getAssignmentSubmissionStats);

module.exports = router;
