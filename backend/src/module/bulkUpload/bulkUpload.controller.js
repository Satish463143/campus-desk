/**
 * FILE: bulkUpload.controller.js
 * LOCATION: /src/module/bulkUpload/bulkUpload.controller.js
 *
 * Express controller for the bulk student admission upload endpoint.
 * Delegates all business logic to bulkUpload.service.js.
 */

"use strict";

const bulkUploadService = require("./bulkUpload.service");

class BulkUploadController {
  /**
   * POST /bulk-upload/admissions
   *
   * Accepts a single .xlsx or .csv file via multipart/form-data (field: "file").
   * Processes each row as a new admission in "migration" status.
   */
  uploadAdmissions = async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          result: null,
          message: "No file uploaded. Please attach an .xlsx or .csv file.",
          meta: null,
        });
      }

      const allowedTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel",                                           // .xls
        "text/csv",
        "application/csv",
        "application/octet-stream", // some clients send xlsx as this
      ];

      // Loose MIME check — also allow by extension
      const ext = (req.file.originalname || "").split(".").pop().toLowerCase();
      const validExt = ["xlsx", "xls", "csv"].includes(ext);
      const validMime = allowedTypes.includes(req.file.mimetype);

      if (!validMime && !validExt) {
        return res.status(400).json({
          result: null,
          message: "Invalid file type. Only .xlsx, .xls, and .csv files are accepted.",
          meta: null,
        });
      }

      const result = await bulkUploadService.processFile(
        req.file.buffer,
        req.file.mimetype || "application/octet-stream",
        req.authUser.schoolId
      );

      const skippedMsg = result.skippedCount > 0 ? `, ${result.skippedCount} already existed (skipped)` : "";
      return res.status(200).json({
        result,
        message: `Bulk upload complete. ${result.successCount} record(s) created, ${result.errorCount} failed${skippedMsg}.`,
        meta: null,
      });
    } catch (exception) {
      console.error("bulkUpload.controller error:", exception);
      next(exception);
    }
  };

  /**
   * GET /bulk-upload/template
   *
   * Returns a download link / instructions for the Excel template.
   * The actual template file is served from S3 or a static URL configured
   * via BULK_UPLOAD_TEMPLATE_URL env var.
   */
  getTemplate = async (req, res, next) => {
    try {
      const templateUrl =
        process.env.BULK_UPLOAD_TEMPLATE_URL ||
        "https://docs.google.com/spreadsheets/d/1lHY0vFuPXzUm_hMEV78XwpDm7jnBKbbc/export?format=xlsx";

      return res.json({
        result: { url: templateUrl },
        message: "Template URL fetched successfully",
        meta: null,
      });
    } catch (exception) {
      next(exception);
    }
  };
}

module.exports = new BulkUploadController();