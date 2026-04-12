const { Role, FileFilterType } = require("../../../config/constant.config");
const attachSchool = require("../../../middleware/attachSchool.middleware");
const loginCheck = require("../../../middleware/auth.middlewares");
const { setPath, uploadMixed, persistAllToS3 } = require("../../../middleware/aws.middlware");
const hasPermission = require("../../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../../middleware/validator.middlewares");
const resourceController = require("./resource.controller");
const { resourceDTO, updateResourceDTO } = require("./resource.request");

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

// Resources allow image + document + video (max 5 files, 200 MB limit for video)
const uploadResourceFiles = uploadMixed([
  FileFilterType.IMAGE,
  FileFilterType.DOCUMENT,
  FileFilterType.VIDEO,
]).fields([{ name: "fileKey", maxCount: 5 }]);

/**
 * @openapi
 * tags:
 *   name: LMS - Resources
 *   description: Learning resources — PDFs, notes, videos, and links attached to chapters
 */

/**
 * @openapi
 * /resources:
 *   post:
 *     tags: [LMS - Resources]
 *     operationId: createResource
 *     summary: Upload a learning resource
 *     description: Admin Staff, Principal, or Teacher. Supports images, documents, and videos (max 5 files). Videos are streamed via HTTP 206 Partial Content.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [type, title]
 *             properties:
 *               chapterId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [video, pdf, note, attachment, link]
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 example: Chapter 3 — Video Lecture
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               fileKey:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image, document, or video files (max 5). Video files support range requests.
 *               externalUrl:
 *                 type: string
 *                 format: uri
 *                 description: External URL for link-type resources (YouTube, Google Drive, etc.)
 *               publishStatus:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Resource created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resource created successfully
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
 *     tags: [LMS - Resources]
 *     operationId: listResources
 *     summary: List all resources
 *     description: All authenticated roles.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chapterId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [video, pdf, note, attachment, link]
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
 *         description: Resources fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resources fetched
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
    setPath("resource"),
    uploadResourceFiles,
    persistAllToS3,
    bodyValidator(resourceDTO),
    resourceController.createResource
  )
  .get(loginCheck, attachSchool, hasPermission(readers), resourceController.listResources);

/**
 * @openapi
 * /resources/students/me/resources:
 *   get:
 *     tags: [LMS - Resources]
 *     operationId: listResourcesByStudent
 *     summary: List resources for the logged-in student
 *     description: Student only. Returns resources for the student's enrolled subjects.
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
 *         description: Student resources fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resources fetched
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
router.get("/students/me/resources", loginCheck, attachSchool, hasPermission([Role.STUDENT]), resourceController.listResourcesByStudent);

/**
 * @openapi
 * /resources/parents/me/children/{studentId}/resources:
 *   get:
 *     tags: [LMS - Resources]
 *     operationId: listResourcesByParent
 *     summary: List resources for a parent's child
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
 *         description: Child resources fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resources fetched
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
router.get("/parents/me/children/:studentId/resources", loginCheck, attachSchool, hasPermission([Role.PARENT]), resourceController.listResourcesByParent);

/**
 * @openapi
 * /resources/{id}:
 *   get:
 *     tags: [LMS - Resources]
 *     operationId: getResourceById
 *     summary: Get resource by ID
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
 *         description: Resource details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resource fetched
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
 *     tags: [LMS - Resources]
 *     operationId: updateResource
 *     summary: Update a resource
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               chapterId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [video, pdf, note, attachment, link]
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               fileKey:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *               externalUrl:
 *                 type: string
 *                 format: uri
 *               publishStatus:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: Resource updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resource updated successfully
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
 *     tags: [LMS - Resources]
 *     operationId: deleteResource
 *     summary: Delete a resource
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
 *         description: Resource deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resource deleted successfully
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
  .get(loginCheck, attachSchool, hasPermission(readers), resourceController.getResourceById)
  .put(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    setPath("resource"),
    uploadResourceFiles,
    persistAllToS3,
    bodyValidator(updateResourceDTO),
    resourceController.updateResource
  )
  .delete(loginCheck, attachSchool, hasPermission(writers), resourceController.deleteResource);

/**
 * @openapi
 * /resources/{id}/stream:
 *   get:
 *     tags: [LMS - Resources]
 *     operationId: streamResourceVideo
 *     summary: Stream a video resource
 *     description: All authenticated roles. Returns HTTP 206 Partial Content supporting browser seek. Use `?fileIndex=0` to specify which file to stream.
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
 *         name: fileIndex
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Zero-based index of the file to stream
 *     responses:
 *       206:
 *         description: Partial video content (supports Range header)
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// ─── Video streaming endpoint ─────────────────────────────────────────────
router.get(
  "/:id/stream",
  loginCheck,
  attachSchool,
  hasPermission(readers),
  resourceController.streamVideo
);

/**
 * @openapi
 * /resources/{id}/url:
 *   get:
 *     tags: [LMS - Resources]
 *     operationId: getResourcePresignedUrl
 *     summary: Get a short-lived presigned URL for a file
 *     description: All authenticated roles. Returns a 5-minute S3 signed URL for downloading PDFs, images, and document files. Use `?fileIndex=0` to select which file.
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
 *         name: fileIndex
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Zero-based index of the file
 *     responses:
 *       200:
 *         description: Presigned URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Presigned URL generated
 *                 result:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                       description: S3 presigned URL (expires in 5 minutes)
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

// ─── Presigned URL for non-video files ───────────────────────────────────
router.get(
  "/:id/url",
  loginCheck,
  attachSchool,
  hasPermission(readers),
  resourceController.getPresignedUrl
);

module.exports = router;
