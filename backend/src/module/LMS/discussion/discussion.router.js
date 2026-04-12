const router = require("express").Router();
const { Role } = require("../../../config/constant.config");
const attachSchool = require("../../../middleware/attachSchool.middleware");
const loginCheck = require("../../../middleware/auth.middlewares");
const hasPermission = require("../../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../../middleware/validator.middlewares");

const discussionController = require("./discussion.controller");
const {
  createDiscussionDTO,
  updateDiscussionDTO,
  createReplyDTO,
  updateReplyDTO
} = require("./discussion.request");

// ─── Roles ───
const allRoles = Object.values(Role);

/**
 * @openapi
 * tags:
 *   name: LMS - Discussions
 *   description: LMS discussion threads and replies
 */

/**
 * @openapi
 * /discussions:
 *   post:
 *     tags: [LMS - Discussions]
 *     operationId: createDiscussion
 *     summary: Create a discussion thread
 *     description: All authenticated roles. Can be scoped to a chapter, assignment, exam, live class, or left general.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 255
 *                 example: Question about Chapter 3 exercise
 *               message:
 *                 type: string
 *                 minLength: 3
 *                 example: I don't understand how to derive the formula in step 4.
 *               targetType:
 *                 type: string
 *                 enum: [chapter, assignment, live_class, exam, general]
 *                 default: general
 *               targetId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the entity referenced by targetType
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *               sectionId:
 *                 type: string
 *                 format: uuid
 *                 description: Requires classId when provided
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               chapterId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Discussion created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Discussion created successfully
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
 *     tags: [LMS - Discussions]
 *     operationId: listDiscussions
 *     summary: List discussion threads
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
 *         name: targetType
 *         schema:
 *           type: string
 *           enum: [chapter, assignment, live_class, exam, general]
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
 *         description: Discussions fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Discussions fetched
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
    hasPermission(allRoles),
    bodyValidator(createDiscussionDTO),
    discussionController.createDiscussion
  )
  .get(
    loginCheck,
    attachSchool,
    hasPermission(allRoles),
    discussionController.listDiscussions
  );

/**
 * @openapi
 * /discussions/{id}:
 *   get:
 *     tags: [LMS - Discussions]
 *     operationId: getDiscussionById
 *     summary: Get a discussion thread by ID
 *     description: All authenticated roles. Includes replies.
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
 *         description: Discussion details with replies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Discussion fetched
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
 *     tags: [LMS - Discussions]
 *     operationId: updateDiscussion
 *     summary: Update a discussion thread
 *     description: All authenticated roles (owner check enforced by service). At least one field required.
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
 *                 minLength: 3
 *                 maxLength: 255
 *               message:
 *                 type: string
 *                 minLength: 3
 *               isClosed:
 *                 type: boolean
 *                 description: Set to true to close the thread (no more replies)
 *     responses:
 *       200:
 *         description: Discussion updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Discussion updated successfully
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
 *     tags: [LMS - Discussions]
 *     operationId: deleteDiscussion
 *     summary: Delete a discussion thread
 *     description: All authenticated roles (owner/admin check enforced by service).
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
 *         description: Discussion deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Discussion deleted successfully
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
    hasPermission(allRoles),
    discussionController.getDiscussionById
  )
  .put(
    loginCheck,
    attachSchool,
    hasPermission(allRoles),
    bodyValidator(updateDiscussionDTO),
    discussionController.updateDiscussion
  )
  .delete(
    loginCheck,
    attachSchool,
    hasPermission(allRoles),
    discussionController.deleteDiscussion
  );

/**
 * @openapi
 * /discussions/{id}/replies:
 *   post:
 *     tags: [LMS - Discussions]
 *     operationId: createReply
 *     summary: Add a reply to a discussion
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
 *         description: Discussion thread ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 example: Thanks for the explanation, that clarifies step 4!
 *     responses:
 *       201:
 *         description: Reply created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reply created successfully
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

// ─── Replies ───
router.post("/:id/replies",
  loginCheck,
  attachSchool,
  hasPermission(allRoles),
  bodyValidator(createReplyDTO),
  discussionController.createReply
);

/**
 * @openapi
 * /discussions/{id}/replies/{replyId}:
 *   put:
 *     tags: [LMS - Discussions]
 *     operationId: updateReply
 *     summary: Update a reply
 *     description: All authenticated roles (owner check enforced by service).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Discussion thread ID
 *       - in: path
 *         name: replyId
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
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *     responses:
 *       200:
 *         description: Reply updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reply updated successfully
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
 *     tags: [LMS - Discussions]
 *     operationId: deleteReply
 *     summary: Delete a reply
 *     description: All authenticated roles (owner/admin check enforced by service).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Discussion thread ID
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reply deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reply deleted successfully
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
router.route("/:id/replies/:replyId")
  .put(
    loginCheck,
    attachSchool,
    hasPermission(allRoles),
    bodyValidator(updateReplyDTO),
    discussionController.updateReply
  )
  .delete(
    loginCheck,
    attachSchool,
    hasPermission(allRoles),
    discussionController.deleteReply
  );

module.exports = router;
