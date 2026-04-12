const progressTrackingService = require("./progressTracking.service");
const { Role } = require("../../../config/constant.config");

class ProgressTrackingController {

  getDynamicStudentProgress = async (req, res, next) => {
    try {
      const { academicYearId } = req.query;
      let studentId;

      if (req.authUser.role === Role.STUDENT) {
        studentId = req.authUser.studentProfile?.id;
      } else if (req.authUser.role === Role.PARENT) {
        // Assume PARENT role provides studentId via query (or can access their children)
        studentId = req.query.studentId;
      } else {
        studentId = req.params.studentId || req.query.studentId;
      }

      if (!studentId || !academicYearId) {
        throw { status: 400, message: "studentId and academicYearId are required" };
      }

      const result = await progressTrackingService.getDynamicStudentProgress(
        req.authUser.schoolId,
        academicYearId,
        studentId
      );

      res.json({
        result,
        message: "Dynamic progress fetched successfully",
        meta: null
      });
    } catch (error) {
      next(error);
    }
  };

  getDynamicSectionProgress = async (req, res, next) => {
    try {
      const { academicYearId, sectionId } = req.query;
      if (!academicYearId || !sectionId) {
        throw { status: 400, message: "academicYearId and sectionId are required" };
      }

      const result = await progressTrackingService.getDynamicSectionProgress(
        req.authUser.schoolId,
        academicYearId,
        sectionId
      );

      res.json({
        result,
        message: "Section dynamic progress fetched successfully",
        meta: { totalStudents: result.length }
      });
    } catch (error) {
      next(error);
    }
  };

  generateProgressReport = async (req, res, next) => {
    try {
      const createdBy = req.authUser.id;
      const result = await progressTrackingService.generateProgressReport(
        req.authUser.schoolId,
        createdBy,
        req.body
      );

      res.status(201).json({
        result,
        message: "Progress reports generated successfully",
        meta: { createdCount: result.length }
      });
    } catch (error) {
      next(error);
    }
  };

  listSavedReports = async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;

      const filters = {
        studentId: req.query.studentId,
        academicYearId: req.query.academicYearId,
        classId: req.query.classId,
        sectionId: req.query.sectionId
      };

      if (req.authUser.role === Role.STUDENT) {
        filters.studentId = req.authUser.studentProfile?.id;
      }

      const { data, count } = await progressTrackingService.listSavedReports(
        req.authUser.schoolId,
        filters,
        { limit, skip }
      );

      res.json({
        result: data,
        message: "Saved reports fetched successfully",
        meta: { currentPage: page, limit, total: count }
      });
    } catch (error) {
      next(error);
    }
  };

  downloadProgressReport = async (req, res, next) => {
    try {
      const reportId = req.params.id;
      await progressTrackingService.generatePDFStream(reportId, req.authUser.schoolId, res);
      // Let PDF pipe control response closure
    } catch (error) {
      next(error);
    }
  };

}

module.exports = new ProgressTrackingController();
