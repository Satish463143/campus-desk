const { Role } = require("../../../config/constant.config");
const attachSchool = require("../../../middleware/attachSchool.middleware");
const loginCheck = require("../../../middleware/auth.middlewares");
const hasPermission = require("../../../middleware/rbac.middlewares");
const { bodyValidator } = require("../../../middleware/validator.middlewares");
const progressTrackerController = require("./progressTracking.controller");
const { generateReportDTO } = require("./progressTracking.request");

const router = require("express").Router();

// ─── Roles ─────────────────────────────────────────────────────────────
const schoolAdminRoles = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN];
const allRoles = [...schoolAdminRoles, Role.STUDENT, Role.PARENT];

/**
 * @openapi
 * tags:
 *   name: LMS - Progress Tracking
 *   description: Student progress reports — dynamic calculation and saved PDF reports
 */

/**
 * @openapi
 * /progress/dynamic/student:
 *   get:
 *     tags: [LMS - Progress Tracking]
 *     operationId: getDynamicStudentProgress
 *     summary: Get real-time progress for a student
 *     description: All authenticated roles. Students see their own; parents pass studentId query param; admins/teachers pass studentId.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Academic year to compute progress for
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Required for Parent/Teacher/Admin roles; derived from auth for Student role
 *     responses:
 *       200:
 *         description: Dynamic student progress
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Student progress fetched
 *                 result:
 *                   type: object
 *                   description: Aggregated progress metrics (chapters, assignments, exams)
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

// ─── Dynamic Progress Routes ───────────────────────────────────────────
router.get(
  "/dynamic/student",
  loginCheck,
  attachSchool,
  hasPermission(allRoles),
  progressTrackerController.getDynamicStudentProgress
);

/**
 * @openapi
 * /progress/dynamic/section:
 *   get:
 *     tags: [LMS - Progress Tracking]
 *     operationId: getDynamicSectionProgress
 *     summary: Get real-time progress for all students in a section
 *     description: Admin Staff, Principal, Teacher, or Super Admin.
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
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Section progress data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Section progress fetched
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       studentId:
 *                         type: string
 *                         format: uuid
 *                       progress:
 *                         type: object
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
router.get(
  "/dynamic/section",
  loginCheck,
  attachSchool,
  hasPermission(schoolAdminRoles),
  progressTrackerController.getDynamicSectionProgress
);

/**
 * @openapi
 * /progress/reports:
 *   get:
 *     tags: [LMS - Progress Tracking]
 *     operationId: listSavedProgressReports
 *     summary: List saved progress reports
 *     description: All authenticated roles. Students see only their own; admins see all (filtered by query).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: Saved reports listed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reports fetched
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

// ─── Saved Progress Report Routes ──────────────────────────────────────
router.get(
  "/reports",
  loginCheck,
  attachSchool,
  hasPermission(allRoles),
  progressTrackerController.listSavedReports
);

/**
 * @openapi
 * /progress/reports/generate:
 *   post:
 *     tags: [LMS - Progress Tracking]
 *     operationId: generateProgressReport
 *     summary: Generate and save progress reports
 *     description: Admin Staff, Principal, Teacher, or Super Admin. Can generate for a single student or all students in a section.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [academicYearId]
 *             properties:
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               studentId:
 *                 type: string
 *                 format: uuid
 *                 description: Generate for a single student. Either studentId or sectionId must be provided.
 *               sectionId:
 *                 type: string
 *                 format: uuid
 *                 description: Generate for all students in a section. Either studentId or sectionId must be provided.
 *               classId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *                 example: Term 1 Progress Report
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Progress reports generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Progress reports generated successfully
 *                 result:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     createdCount:
 *                       type: integer
 *                       example: 35
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  "/reports/generate",
  loginCheck,
  attachSchool,
  hasPermission(schoolAdminRoles),
  bodyValidator(generateReportDTO),
  progressTrackerController.generateProgressReport
);

/**
 * @openapi
 * /progress/reports/{id}/download:
 *   get:
 *     tags: [LMS - Progress Tracking]
 *     operationId: downloadProgressReport
 *     summary: Download a progress report as PDF
 *     description: All authenticated roles. Students can only download their own report.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Progress report UUID
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf:
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
router.get(
  "/reports/:id/download",
  loginCheck,
  attachSchool,
  hasPermission(allRoles),
  progressTrackerController.downloadProgressReport
);

module.exports = router;
