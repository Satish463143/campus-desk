const router = require("express").Router();
const { Role } = require("../../../config/constant.config");
const attachSchool = require("../../../middleware/attachSchool.middleware");
const loginCheck = require("../../../middleware/auth.middlewares");
const hasPermission = require("../../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../../middleware/validator.middlewares");

const announcementController = require("./announcement.controller");
const { createAnnouncementDTO, updateAnnouncementDTO } = require("./announcement.request");

// ─── Roles ─────────────────────────────────────────────────────────────
const readers = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT, Role.SUPER_ADMIN];
const writers = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN];

/**
 * @openapi
 * tags:
 *   name: LMS - Announcements
 *   description: School-wide and class-level announcements for the LMS
 */

/**
 * @openapi
 * /announcements:
 *   post:
 *     tags: [LMS - Announcements]
 *     operationId: createAnnouncement
 *     summary: Create an announcement
 *     description: Admin Staff, Principal, Teacher, or Super Admin. Optionally scoped to a class, section, or subject. If sectionId is provided, classId is required.
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
 *                 example: End-of-term exam schedule
 *               message:
 *                 type: string
 *                 minLength: 3
 *                 example: The final exams will begin on April 20th. Please review the schedule.
 *               publishStatus:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *               publishAt:
 *                 type: string
 *                 format: date-time
 *                 description: ISO date-time to schedule publishing
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
 *                 description: Requires classId when provided
 *     responses:
 *       201:
 *         description: Announcement created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcement created successfully
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
 *     tags: [LMS - Announcements]
 *     operationId: listAnnouncements
 *     summary: List announcements
 *     description: All authenticated roles. Returns paginated announcements visible to the user's school.
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
 *         description: Announcements fetched
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcements fetched
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
    hasPermission(writers),
    bodyValidator(createAnnouncementDTO),
    announcementController.createAnnouncement
  )
  .get(
    loginCheck,
    attachSchool,
    hasPermission(readers),
    announcementController.listAnnouncements
  );

/**
 * @openapi
 * /announcements/students/me/announcements:
 *   get:
 *     tags: [LMS - Announcements]
 *     operationId: listAnnouncementsByStudent
 *     summary: List announcements for the logged-in student
 *     description: Student only. Returns announcements targeted at the student's own class and sections.
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
 *         description: Announcements for student
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcements fetched
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
router.get("/students/me/announcements", loginCheck, attachSchool, hasPermission([Role.STUDENT]), announcementController.listAnnouncementsByStudent);

/**
 * @openapi
 * /announcements/parents/me/children/{studentId}/announcements:
 *   get:
 *     tags: [LMS - Announcements]
 *     operationId: listAnnouncementsByParent
 *     summary: List announcements for a parent's child
 *     description: Parent only. Returns announcements targeted at the specified child's class and sections.
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
 *         description: Announcements for parent's child
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcements fetched
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
router.get("/parents/me/children/:studentId/announcements", loginCheck, attachSchool, hasPermission([Role.PARENT]), announcementController.listAnnouncementsByParent);

/**
 * @openapi
 * /announcements/{id}:
 *   get:
 *     tags: [LMS - Announcements]
 *     operationId: getAnnouncementById
 *     summary: Get announcement by ID
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
 *         description: Announcement details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcement fetched
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
 *     tags: [LMS - Announcements]
 *     operationId: updateAnnouncement
 *     summary: Update an announcement
 *     description: Admin Staff, Principal, Teacher, or Super Admin. At least one field required.
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
 *               publishStatus:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               publishAt:
 *                 type: string
 *                 format: date-time
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               classId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               sectionId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Announcement updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcement updated successfully
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
 *     tags: [LMS - Announcements]
 *     operationId: deleteAnnouncement
 *     summary: Delete an announcement
 *     description: Admin Staff, Principal, Teacher, or Super Admin.
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
 *         description: Announcement deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Announcement deleted successfully
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
    hasPermission(readers),
    announcementController.getAnnouncementById
  )
  .put(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    bodyValidator(updateAnnouncementDTO),
    announcementController.updateAnnouncement
  )
  .delete(
    loginCheck,
    attachSchool,
    hasPermission(writers),
    announcementController.deleteAnnouncement
  );


module.exports = router;
