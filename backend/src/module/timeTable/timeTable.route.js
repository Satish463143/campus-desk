const router = require("express").Router();
const timetableController = require("./timeTable.controller");
const { createTimetableDTO, bulkCreateTimetableDTO, updateTimetableDTO } = require("./timeTable.request");
const loginCheck = require("../../middleware/auth.middlewares");
const attachSchool = require("../../middleware/attachSchool.middleware");
const hasPermission = require("../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../middleware/validator.middlewares");
const { Role } = require("../../config/constant.config");

/**
 * @openapi
 * tags:
 *   name: Timetable
 *   description: Timetable scheduling for classes and sections
 */

/**
 * @openapi
 * /time-table/bulk:
 *   post:
 *     tags: [Timetable]
 *     operationId: bulkCreateTimetable
 *     summary: Bulk create timetable entries
 *     description: Admin Staff or Principal. Creates multiple timetable slots in a single request.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             minItems: 1
 *             items:
 *               type: object
 *               required: [classId, sectionId, periodId, subjectId, teacherId, dayOfWeek, classMode]
 *               properties:
 *                 classId:
 *                   type: string
 *                   format: uuid
 *                 sectionId:
 *                   type: string
 *                   format: uuid
 *                 periodId:
 *                   type: string
 *                   format: uuid
 *                 subjectId:
 *                   type: string
 *                   format: uuid
 *                 teacherId:
 *                   type: string
 *                   format: uuid
 *                 dayOfWeek:
 *                   $ref: '#/components/schemas/DayOfWeek'
 *                 roomNumber:
 *                   type: string
 *                   maxLength: 50
 *                   example: "Room 101"
 *                 classMode:
 *                   type: string
 *                   enum: [ONLINE, OFFLINE, HYBRID]
 *                   example: OFFLINE
 *     responses:
 *       201:
 *         description: Timetable entries created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Timetable created successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
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
router.post("/bulk",
    loginCheck,
    attachSchool,
    hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]),
    bodyValidator(bulkCreateTimetableDTO),
    timetableController.bulkCreateTimetable
);

/**
 * @openapi
 * /time-table:
 *   post:
 *     tags: [Timetable]
 *     operationId: createTimetable
 *     summary: Create a single timetable entry
 *     description: Admin Staff or Principal. Creates one timetable slot.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, sectionId, periodId, subjectId, teacherId, dayOfWeek, classMode]
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *               sectionId:
 *                 type: string
 *                 format: uuid
 *               periodId:
 *                 type: string
 *                 format: uuid
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *               dayOfWeek:
 *                 $ref: '#/components/schemas/DayOfWeek'
 *               roomNumber:
 *                 type: string
 *                 maxLength: 50
 *               classMode:
 *                 type: string
 *                 enum: [ONLINE, OFFLINE, HYBRID]
 *                 example: OFFLINE
 *     responses:
 *       201:
 *         description: Timetable entry created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Timetable created successfully
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
 *     tags: [Timetable]
 *     operationId: getTimetables
 *     summary: List timetable entries
 *     description: Admin Staff, Principal, Teacher, Student, or Parent.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           $ref: '#/components/schemas/DayOfWeek'
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
 *         description: Timetable entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Timetable fetched
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
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]),
        bodyValidator(createTimetableDTO),
        timetableController.createTimetable
    )
    .get(
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT]),
        timetableController.getTimetables
    );

/**
 * @openapi
 * /time-table/section/{sectionId}:
 *   get:
 *     tags: [Timetable]
 *     operationId: getSectionTimetable
 *     summary: Get timetable for a section
 *     description: Admin Staff, Principal, Teacher, Student, or Parent. Returns full weekly schedule for the section.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Section timetable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Section timetable fetched
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
 */
router.route("/section/:sectionId")
    .get(
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.STUDENT, Role.PARENT]),
        timetableController.getSectionTimetable
    );

/**
 * @openapi
 * /time-table/teacher/{teacherId}:
 *   get:
 *     tags: [Timetable]
 *     operationId: getTeacherTimetable
 *     summary: Get timetable for a teacher
 *     description: Admin Staff, Principal, or Teacher. Returns all assigned periods for the teacher.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Teacher timetable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher timetable fetched
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
 */
router.route("/teacher/:teacherId")
    .get(
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER]),
        timetableController.getTeacherTimetable
    );

/**
 * @openapi
 * /time-table/day/{dayOfWeek}:
 *   get:
 *     tags: [Timetable]
 *     operationId: getDaySchedule
 *     summary: Get full school schedule for a specific day
 *     description: Admin Staff, Principal, or Teacher.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dayOfWeek
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/DayOfWeek'
 *         description: Day of the week
 *         example: MONDAY
 *     responses:
 *       200:
 *         description: Day schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Day schedule fetched
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
 */
router.route("/day/:dayOfWeek")
    .get(
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER]),
        timetableController.getDaySchedule
    );

/**
 * @openapi
 * /time-table/{id}:
 *   get:
 *     tags: [Timetable]
 *     operationId: getTimetableById
 *     summary: Get timetable entry by ID
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
 *         description: Timetable entry details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Timetable entry fetched
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
 *     tags: [Timetable]
 *     operationId: updateTimetable
 *     summary: Update a timetable entry
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
 *             type: object
 *             minProperties: 1
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *               sectionId:
 *                 type: string
 *                 format: uuid
 *               periodId:
 *                 type: string
 *                 format: uuid
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *               dayOfWeek:
 *                 $ref: '#/components/schemas/DayOfWeek'
 *               roomNumber:
 *                 type: string
 *                 maxLength: 50
 *               classMode:
 *                 type: string
 *                 enum: [ONLINE, OFFLINE, HYBRID]
 *     responses:
 *       200:
 *         description: Timetable entry updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Timetable updated successfully
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
 *     tags: [Timetable]
 *     operationId: deleteTimetable
 *     summary: Delete a timetable entry
 *     description: Admin Staff or Principal.
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
 *         description: Timetable entry deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Timetable deleted successfully
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
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER]),
        timetableController.getTimetableById
    )
    .put(
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]),
        bodyValidator(updateTimetableDTO),
        timetableController.updateTimetable
    )
    .delete(
        loginCheck,
        attachSchool,
        hasPermission([Role.ADMIN_STAFF, Role.PRINCIPAL]),
        timetableController.deleteTimetable
    );

module.exports = router;
