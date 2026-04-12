

"use strict";

const router = require("express").Router();
const multer = require("multer");
const loginCheck  = require("../../middleware/auth.middlewares");
const hasPermission = require("../../middleware/rbac.middlewares");
const attachSchool  = require("../../middleware/attachSchool.middleware");
const { Role } = require("../../config/constant.config");
const bulkUploadController = require("./bulkUpload.controller");

// Store file in memory so the service can read the buffer directly
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

const CAN_WRITE = [Role.PRINCIPAL, Role.ADMIN_STAFF, Role.ACCOUNTANT];

// Auth + school-scoping on all routes
router.use(loginCheck, attachSchool);

/**
 * @openapi
 * /bulk-upload/admissions:
 *   post:
 *     tags: [BulkUpload]
 *     operationId: bulkUploadAdmissions
 *     summary: Import multiple student admissions from an Excel or CSV file
 *     description: |
 *       Accepts a single .xlsx / .xls / .csv file.
 *       Multi-sheet Excel template columns are merged automatically.
 *       Every valid row becomes an Admission record in **pending** status.
 *       Validation is intentionally loose — rows with missing optional fields
 *       are still imported with sensible defaults.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Bulk upload processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *                   properties:
 *                     successCount:
 *                       type: integer
 *                     errorCount:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                 meta:
 *                   nullable: true
 *       400:
 *         description: No file or invalid file type
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  "/admissions",
  hasPermission(CAN_WRITE),
  upload.single("file"),
  bulkUploadController.uploadAdmissions
);

/**
 * @openapi
 * /bulk-upload/template:
 *   get:
 *     tags: [BulkUpload]
 *     operationId: getBulkUploadTemplate
 *     summary: Get the download URL for the bulk-upload Excel template
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template URL
 */
router.get("/template", hasPermission(CAN_WRITE), bulkUploadController.getTemplate);

module.exports = router;