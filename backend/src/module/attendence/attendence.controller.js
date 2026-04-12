const attendanceService = require("./attendence.service");

class AttendanceController { 
    markPeriodAttendance = async (req, res, next) => {
        try {
        const schoolId = req.authUser.schoolId;
        const response = await attendanceService.markPeriodAttendance(schoolId, req.body);

        res.json({
            result:response,
            message:"Period attendance marked successfully",  
            meta:null
        }
        );
        } catch (error) {
        next(error);
        }
    };

  getPeriodAttendances = async (req, res, next) => {
    try {
      const schoolId = req.authUser.schoolId;
      const {
        academicYearId,
        sectionId,
        studentId,
        date,
        periodId,
      } = req.query;

      if (!academicYearId) {
        throw {status:400,message:"academicYearId is required"}
      }

      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
      const skip = (page - 1) * limit;

      const { data, count } = await attendanceService.getPeriodAttendances({
        schoolId,
        academicYearId,
        sectionId,
        studentId,
        date,
        periodId,
        skip,
        limit,
      });

      res.json({
            result:data,
            message:"Period attendance fetched successfully",
            meta:{
                currentPage: page,
                limit:limit,
                total: count,
            }
        });
    } catch (error) {
      next(error);
    }
  };

  getSectionDailySummary = async (req, res, next) => {
    try {
      const schoolId = req.authUser.schoolId;
      const { sectionId } = req.params;
      const { date } = req.query;

      if (!date) {
        throw {status:400,message:"date query param is required"}
      }

      const response = await attendanceService.getSectionDailySummary(schoolId, sectionId, date);

      res.json({
        result:response,
        message:"Section daily summary fetched successfully",
        meta:null
      });
    } catch (error) {
      next(error);
    }
  };

  getStudentDailySummary = async (req, res, next) => {
    try {
      const schoolId = req.authUser.schoolId;
      const { studentId } = req.params;
      const { from, to } = req.query;

      const response = await attendanceService.getStudentDailySummary(schoolId, studentId, from, to);

      res.json({
        result:response,
        message:"Student daily summary fetched successfully",
        meta:null
      });
    } catch (error) {
      next(error);
    }
  };

  getPeriodAttendanceById = async (req, res, next) => {
    try {
      const schoolId = req.authUser.schoolId;
      const { id } = req.params;

      const response = await attendanceService.getPeriodAttendanceById(id, schoolId);

      res.json({
        result:response,
        message:"Attendance details fetched successfully",
        meta:null
      });
    } catch (error) {
      next(error);
    }
  };

  updatePeriodAttendance = async (req, res, next) => {
    try {
      const schoolId = req.authUser.schoolId;
      const { id } = req.params;

      const response = await attendanceService.updatePeriodAttendance(id, schoolId, req.body);

      res.json({
        result:response,
        message:"Attendance updated successfully",
        meta:null
      });
    } catch (error) {
      next(error);
    }
  };

  deletePeriodAttendance = async (req, res, next) => {
    try {
      const schoolId = req.authUser.schoolId;
      const { id } = req.params;

      const response = await attendanceService.deletePeriodAttendance(id, schoolId);

      res.json({
        result:response,
        message:"Attendance deleted successfully",
        meta:null
      });
    } catch (error) {
      next(error);
    }
  };

  markTeacherAttendance = async (req, res, next) => {
    try {
      const schoolId = req.authUser.schoolId;

      const response = await attendanceService.markTeacherAttendance(schoolId, req.body);

      res.status(201).json({
        result:response,
        message:"Teacher attendance marked successfully",
        meta:null
      });
    } catch (error) {
      next(error);
    }
  };

  getTeacherAttendance = async (req, res, next) => {
    try {
      const schoolId = req.authUser.schoolId;
      const { teacherId, from, to } = req.query;

      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
      const skip = (page - 1) * limit;

      const response = await attendanceService.getTeacherAttendance({
        schoolId,
        teacherId,
        from,
        to,
        skip,
        limit,
      });

      res.json({
        result:response.data,
        message:"Teacher attendance fetched successfully",
        meta:{
          currentPage: page,
          limit:limit,
          total: response.count,
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AttendanceController();