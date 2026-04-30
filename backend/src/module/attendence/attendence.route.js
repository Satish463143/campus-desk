const router = require("express").Router();

const attendanceController = require("./attendence.controller");
const { Role } = require("../../config/constant.config");
const attachSchool = require("../../middleware/attachSchool.middleware");
const loginCheck = require("../../middleware/auth.middlewares");
const hasPermission = require("../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../middleware/validator.middlewares");
const {
  markPeriodAttendanceDTO,
  updatePeriodAttendanceDTO,
  markTeacherAttendanceDTO,
} = require("./attendence.request");

/**
 * @openapi
 * tags:
 *   name: Attendance
 *   description: Student period attendance and teacher self-attendance
 */

// ------------------------------------------------------------------
// STUDENT PERIOD ATTENDANCE ROUTES
// ------------------------------------------------------------------

/**
 * @openapi
 * /attendance/student/period:
 *   post:
 *     tags: [Attendance]
 *     operationId: markPeriodAttendance
 *     summary: Mark student attendance for a period
 *     description: >
 *       Principal, Admin Staff, or Teacher. Bulk-marks attendance for all students
 *       in a section for a specific period and date. Only submit students who are NOT present
 *       (absent/late/leave) — PRESENT is implied for everyone not listed.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sectionId, classId, academicYearId, date, periodId, teacherId, attendance]
 *             properties:
 *               sectionId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-03-15"
 *               periodId:
 *                 type: string
 *                 format: uuid
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *               teacherLatitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 nullable: true
 *                 example: 26.4525
 *               teacherLongitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 nullable: true
 *                 example: 87.2832
 *               attendance:
 *                 type: array
 *                 description: Only non-present students (absent/late/leave)
 *                 items:
 *                   type: object
 *                   required: [studentId, status]
 *                   properties:
 *                     studentId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [ABSENT, LATE, LEAVE]
 *                       example: ABSENT
 *                     remark:
 *                       type: string
 *                       nullable: true
 *                       example: "Sick leave"
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attendance marked successfully
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
 *     tags: [Attendance]
 *     operationId: getPeriodAttendances
 *     summary: Get period attendance records
 *     description: Principal, Admin Staff, or Teacher. Returns raw period-level attendance with filters.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-03-15"
 *       - in: query
 *         name: periodId
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
 *           default: 20
 *     responses:
 *       200:
 *         description: Period attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attendance fetched
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
router.post(
  "/student/period",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER]),
  bodyValidator(markPeriodAttendanceDTO),
  attendanceController.markPeriodAttendance
);

router.get(
  "/student/period",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER]),
  attendanceController.getPeriodAttendances
);

/**
 * @openapi
 * /attendance/student/section/{sectionId}/daily-summary:
 *   get:
 *     tags: [Attendance]
 *     operationId: getSectionDailySummary
 *     summary: Get section daily attendance summary
 *     description: >
 *       Principal, Admin Staff, or Teacher. Returns the daily attendance status for all
 *       students in a section for a given date. Status derived from period records.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-03-15"
 *     responses:
 *       200:
 *         description: Section daily attendance summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Daily summary fetched
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
router.get(
  "/student/section/:sectionId/daily-summary",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER]),
  attendanceController.getSectionDailySummary
);

/**
 * @openapi
 * /attendance/student/{studentId}/daily-summary:
 *   get:
 *     tags: [Attendance]
 *     operationId: getStudentDailySummary
 *     summary: Get student daily attendance summary
 *     description: >
 *       Principal, Admin Staff, Teacher, Student, or Parent.
 *       Returns daily attendance status for a student across a date range.
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
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (inclusive)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (inclusive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Student daily attendance summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student daily summary fetched
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
  "/student/:studentId/daily-summary",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER, Role.STUDENT, Role.PARENT]),
  attendanceController.getStudentDailySummary
);

/**
 * @openapi
 * /attendance/student/period/{id}:
 *   get:
 *     tags: [Attendance]
 *     operationId: getPeriodAttendanceById
 *     summary: Get a single period attendance record
 *     description: Principal, Admin Staff, or Teacher.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Attendance record UUID
 *     responses:
 *       200:
 *         description: Period attendance record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attendance record fetched
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
 *     tags: [Attendance]
 *     operationId: updatePeriodAttendance
 *     summary: Correct a period attendance record
 *     description: Principal, Admin Staff, or Teacher. Use this for corrections.
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
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, LEAVE]
 *                 example: PRESENT
 *               remark:
 *                 type: string
 *                 nullable: true
 *                 example: "Arrived late"
 *     responses:
 *       200:
 *         description: Attendance record updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attendance updated
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
 *     tags: [Attendance]
 *     operationId: deletePeriodAttendance
 *     summary: Delete a period attendance record
 *     description: Principal or Admin Staff only (restricted for audit safety).
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
 *         description: Attendance record deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Attendance record deleted
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
router.get(
  "/student/period/:id",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER]),
  attendanceController.getPeriodAttendanceById
);

router.put(
  "/student/period/:id",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER]),
  bodyValidator(updatePeriodAttendanceDTO),
  attendanceController.updatePeriodAttendance
);

router.delete(
  "/student/period/:id",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
  attendanceController.deletePeriodAttendance
);

// ------------------------------------------------------------------
// TEACHER DAILY SELF ATTENDANCE ROUTES
// ------------------------------------------------------------------

/**
 * @openapi
 * /attendance/teacher/self:
 *   post:
 *     tags: [Attendance]
 *     operationId: markTeacherAttendance
 *     summary: Mark teacher self-attendance
 *     description: >
 *       Principal, Admin Staff, or Teacher. Records a teacher's daily attendance (once per day).
 *       Not period-wise.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teacherId, date, status]
 *             properties:
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-03-15"
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE, LEAVE]
 *                 example: PRESENT
 *               remark:
 *                 type: string
 *                 nullable: true
 *               checkInTime:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               checkOutTime:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Teacher attendance recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher attendance marked
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
router.post(
  "/teacher/self",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER]),
  bodyValidator(markTeacherAttendanceDTO),
  attendanceController.markTeacherAttendance
);

/**
 * @openapi
 * /attendance/teacher:
 *   get:
 *     tags: [Attendance]
 *     operationId: getTeacherAttendance
 *     summary: Get teacher attendance history
 *     description: Principal, Admin Staff, or Teacher. Returns daily attendance records for a teacher.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Teacher profile UUID (optional for TEACHER role — uses own ID)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Teacher attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Teacher attendance fetched
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
  "/teacher",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER]),
  attendanceController.getTeacherAttendance
);

// ------------------------------------------------------------------
// ANALYTICS / SUMMARY ROUTES (Principal Dashboard)
// ------------------------------------------------------------------

router.get(
  "/student/school-summary",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
  attendanceController.getSchoolAttendanceSummary
);

router.get(
  "/student/class-summary",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF, Role.TEACHER]),
  attendanceController.getClassAttendanceSummary
);

router.get(
  "/teacher/summary",
  loginCheck,
  attachSchool,
  hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
  attendanceController.getTeacherAttendanceSummary
);

module.exports = router;

