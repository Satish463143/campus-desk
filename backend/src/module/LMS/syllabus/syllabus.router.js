const { Role, FileFilterType } = require("../../../config/constant.config");
const attachSchool = require("../../../middleware/attachSchool.middleware");
const loginCheck = require("../../../middleware/auth.middlewares");
const { setPath, uploadMixed, persistAllToS3 } = require("../../../middleware/aws.middlware");
const hasPermission = require("../../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../../middleware/validator.middlewares");
const syllabusController = require("./syllabus.controller");
const { syllabusDTO, updateSyllabusDTO } = require("./syllabus.request");

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

// Syllabus allows image OR document (pdf/doc/etc.), max 5 MB (no video → 5 MB limit)
const uploadSyllabusFile = uploadMixed([
  FileFilterType.IMAGE,
  FileFilterType.DOCUMENT,
]).fields([{ name: "fileKey", maxCount: 5 }]);

/**
 * @openapi
 * tags:
 *   name: LMS - Syllabus
 *   description: Syllabus documents per class and subject
 */

/**
 * @openapi
 * /syllabuses:
 *   post:
 *     tags: [LMS - Syllabus]
 *     operationId: createSyllabus
 *     summary: Create a syllabus
 *     description: Admin Staff, Principal, or Teacher. Supports image/document file attachments (max 5) and/or an external file URL.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Mathematics Syllabus — Grade 8, Term 1
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               objectives:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Learning objectives for this syllabus
 *               publishStatus:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *               fileKey:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image or document files (max 5, max 5 MB each)
 *               externalFileUrl:
 *                 type: string
 *                 format: uri
 *                 description: External URL (e.g. Google Drive, OneDrive)
 *     responses:
 *       201:
 *         description: Syllabus created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Syllabus created successfully
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
 *     tags: [LMS - Syllabus]
 *     operationId: listSyllabuses
 *     summary: List syllabuses
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Syllabuses fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Syllabuses fetched
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
    setPath("syllabus"),
    uploadSyllabusFile,
    persistAllToS3,
    bodyValidator(syllabusDTO),
    syllabusController.createSyllabus
  )
  .get(loginCheck, attachSchool, hasPermission(readers), syllabusController.listSyllabus);

/**
 * @openapi
 * /syllabuses/students/me/syllabuses:
 *   get:
 *     tags: [LMS - Syllabus]
 *     operationId: listSyllabusesByStudent
 *     summary: List syllabuses for the logged-in student
 *     description: Student only. Returns syllabuses for the student's enrolled class and subjects.
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
 *         description: Student syllabuses fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Syllabuses fetched
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

// ─── Filtered Views ───
router.get("/students/me/syllabuses", loginCheck, attachSchool, hasPermission([Role.STUDENT]), syllabusController.listSyllabusByStudent);

/**
 * @openapi
 * /syllabuses/parents/me/children/{studentId}/syllabuses:
 *   get:
 *     tags: [LMS - Syllabus]
 *     operationId: listSyllabusesByParent
 *     summary: List syllabuses for a parent's child
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
 *         description: Child syllabuses fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Syllabuses fetched
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
router.get("/parents/me/children/:studentId/syllabuses", loginCheck, attachSchool, hasPermission([Role.PARENT]), syllabusController.listSyllabusByParent);

/**
 * @openapi
 * /syllabuses/{id}:
 *   get:
 *     tags: [LMS - Syllabus]
 *     operationId: getSyllabusById
 *     summary: Get syllabus by ID
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
 *         description: Syllabus details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Syllabus fetched
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
 *     tags: [LMS - Syllabus]
 *     operationId: updateSyllabus
 *     summary: Update a syllabus
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
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               objectives:
 *                 type: string
 *               publishStatus:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               fileKey:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *               externalFileUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Syllabus updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Syllabus updated successfully
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
 *     tags: [LMS - Syllabus]
 *     operationId: deleteSyllabus
 *     summary: Delete a syllabus
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
 *         description: Syllabus deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Syllabus deleted successfully
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
  .get(loginCheck, attachSchool, hasPermission(readers), syllabusController.getSyllabusById)
  .put(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    setPath("syllabus"),
    uploadSyllabusFile,
    persistAllToS3,
    bodyValidator(updateSyllabusDTO),
    syllabusController.updateSyllabus
  )
  .delete(loginCheck, attachSchool, hasPermission(writers), syllabusController.deleteSyllabus);

module.exports = router;
