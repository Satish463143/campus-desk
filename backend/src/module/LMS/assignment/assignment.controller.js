const assignmentService = require("./assignment.service");
const { getCache, setCache, clearCache } = require("../../../utils/redisCache");
const { Role } = require("../../../config/constant.config");

// Cache TTL constants
const CACHE_TTL = 600; // 10 minutes

class AssignmentController {
  // ─── Private helper ──────────────────────────────────────────────────────
  #validate = async (id, schoolId) => {
    if (!id) throw { status: 400, message: "Assignment id is required" };
    const assignment = await assignmentService.getAssignmentById(id, schoolId);
    if (!assignment) throw { status: 404, message: "Assignment not found" };
    return assignment;
  };

  #validateSubmission = async (id, schoolId) => {
    if (!id) throw { status: 400, message: "Submission id is required" };
    const submission = await assignmentService.getSubmissionById(id, schoolId);
    if (!submission) throw { status: 404, message: "Submission not found" };
    return submission;
  }

  // ─── CREATE ASSIGNMENT ───────────────────────────────────────────────────
  createAssignment = async (req, res, next) => {
    try {
      const {
        academicYearId,
        classId,
        sectionId,
        chapterId,
        subjectId,
        title,
        description,
        instructions,
        totalMarks,
        dueDate,
        allowLateSubmission,
        submissionType,
        publishStatus,
        externalAttachmentUrl,
      } = req.body;

      // Ensure teacherId. Use req.body.teacherId if Admin creates it, else from authUser if teacher
      const teacherId = req.authUser.role === Role.TEACHER 
        ? req.authUser.teacherProfile?.id 
        : req.body.teacherId;

      if (!teacherId) throw { status: 400, message: "Teacher ID is missing or invalid role" };

      // fileKeys comes from S3 upload middleware (named attachmentKeys in router)
      const raw = req.body.attachmentKeys;
      const attachmentKeys = raw ? (Array.isArray(raw) ? raw : [raw]) : [];

      const assignment = await assignmentService.createAssignment({
        schoolId: req.authUser.schoolId,
        academicYearId,
        classId,
        sectionId,
        chapterId,
        subjectId,
        teacherId,
        title,
        description,
        instructions,
        totalMarks,
        dueDate: new Date(dueDate),
        allowLateSubmission,
        submissionType,
        publishStatus,
        attachmentKeys,
        externalAttachmentUrl,
      });

      await clearCache(`assignment_list_*_school${req.authUser.schoolId}`);

      return res.status(201).json({
        message: "Assignment created successfully",
        result: assignment,
        meta: null,
      });
    } catch (exception) {
      console.error("createAssignment controller error:", exception);
      next(exception);
    }
  };

  // ─── LIST ASSIGNMENTS ────────────────────────────────────────────────────
  listAssignment = async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      // Only allow seeing published assignments if not staff/teacher
      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      
      const filters = {
        academicYearId: req.query.academicYearId || "",
        classId: req.query.classId || "",
        sectionId: req.query.sectionId || "",
        subjectId: req.query.subjectId || "",
        chapterId: req.query.chapterId || "",
        publishStatus: req.query.publishStatus || "",
      };

      if (!isWriter) {
         filters.publishStatus = 'published';
      }

      const cacheKey = `assignment_list_p${page}_l${limit}_s${search}_ay${filters.academicYearId}_cl${filters.classId}_sec${filters.sectionId}_sub${filters.subjectId}_chap${filters.chapterId}_ps${filters.publishStatus}_school${req.authUser.schoolId}`;

      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Assignment list fetched (cached)",
          result: cached.data,
          meta: { currentPage: page, limit, total: cached.count },
        });
      }

      const { data, count } = await assignmentService.listAssignment(
        { schoolId: req.authUser.schoolId, search, ...filters },
        { limit, skip }
      );

      await setCache(cacheKey, { data, count }, CACHE_TTL);

      return res.json({
        message: "Assignment list fetched",
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch (exception) {
      console.error("listAssignment controller error:", exception);
      next(exception);
    }
  };

  // ─── GET ASSIGNMENT BY ID ────────────────────────────────────────────────
  getAssignmentById = async (req, res, next) => {
    try {
      const cacheKey = `assignment_${req.params.id}_school${req.authUser.schoolId}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Assignment fetched (cached)",
          result: cached,
          meta: null,
        });
      }

      const assignment = await this.#validate(req.params.id, req.authUser.schoolId);

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter && assignment.publishStatus !== 'published') {
         throw { status: 403, message: "You don't have permission to view this assignment" };
      }

      await setCache(cacheKey, assignment, CACHE_TTL);

      return res.json({
        message: "Assignment fetched successfully",
        result: assignment,
        meta: null,
      });
    } catch (exception) {
      console.error("getAssignmentById controller error:", exception);
      next(exception);
    }
  };

  // ─── UPDATE ASSIGNMENT ───────────────────────────────────────────────────
  updateAssignment = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      // Normalise uploaded URLs (single → array)
      const raw = req.body.attachmentKeys;
      const attachmentKeys = raw ? (Array.isArray(raw) ? raw : [raw]) : undefined;
      
      const payload = { ...req.body };
      if (attachmentKeys !== undefined) payload.attachmentKeys = attachmentKeys;
      if (payload.dueDate) payload.dueDate = new Date(payload.dueDate);

      const updated = await assignmentService.updateAssignment(
        req.params.id,
        req.authUser.schoolId,
        payload
      );

      await Promise.all([
        clearCache(`assignment_list_*_school${req.authUser.schoolId}`),
        clearCache(`assignment_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Assignment updated successfully",
        result: updated,
        meta: null,
      });
    } catch (exception) {
      console.error("updateAssignment controller error:", exception);
      next(exception);
    }
  };

  // ─── DELETE ASSIGNMENT ───────────────────────────────────────────────────
  deleteAssignment = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      const deleted = await assignmentService.deleteAssignment(
        req.params.id,
        req.authUser.schoolId
      );

      await Promise.all([
        clearCache(`assignment_list_*_school${req.authUser.schoolId}`),
        clearCache(`assignment_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Assignment deleted successfully",
        result: deleted,
        meta: null,
      });
    } catch (exception) {
      console.error("deleteAssignment controller error:", exception);
      next(exception);
    }
  };

  // ─── SPECIFIC LIST VIEWS ─────────────────────────────────────────────────
  listAssignmentByClassAndSubject = async (req, res, next) => {
    req.query.classId = req.params.classId;
    req.query.subjectId = req.params.subjectId;
    return this.listAssignment(req, res, next);
  }

  listAssignmentByStudent = async (req, res, next) => {
    try {
       // A student can see published assignments for their class/section
       const profile = req.authUser.studentProfile;
       if(!profile) throw { status: 403, message: "Student profile not found" };
       
       // For simplicity, we just trigger listAssignment with publishStatus = published.
       // Real implementation would join through student enrollments to pinpoint exact assignments.
       req.query.publishStatus = "published";
       return this.listAssignment(req, res, next);
    } catch(error) {
       next(error);
    }
  }

  listAssignmentByParent = async (req, res, next) => {
    try {
       const studentId = req.params.studentId;
       if(!studentId) throw { status: 400, message: "Student ID is required." };
       
       req.authUser.role = Role.STUDENT;
       req.authUser.studentProfile = { id: studentId };
       
       req.query.publishStatus = "published";
       return this.listAssignment(req, res, next);
    } catch(error) {
       next(error);
    }
  }

  listAssignmentByTeacher = async (req, res, next) => {
    const profile = req.authUser.teacherProfile;
    if(!profile) return res.status(403).json({message: "Teacher profile not found"});
    req.query.teacherId = profile.id;
    return this.listAssignment(req, res, next);
  }

  // ─── SUBMISSIONS ─────────────────────────────────────────────────────────

  submitAssignment = async (req, res, next) => {
    try {
      const assignment = await this.#validate(req.params.assignmentId, req.authUser.schoolId);
      const studentId = req.authUser.studentProfile?.id;
      if (!studentId) throw { status: 403, message: "Only students can submit assignments" };

      const now = new Date();
      const isLate = now > new Date(assignment.dueDate);
      
      if (isLate && !assignment.allowLateSubmission) {
        throw { status: 400, message: "Late submissions are not allowed for this assignment" };
      }

      const raw = req.body.submissionKeys;
      const submissionKeys = raw ? (Array.isArray(raw) ? raw : [raw]) : [];

      const submission = await assignmentService.submitAssignment({
        schoolId: req.authUser.schoolId,
        assignmentId: assignment.id,
        studentId,
        submissionKeys,
        externalSubmissionLink: req.body.externalSubmissionLink,
        isLate
      });

      return res.status(201).json({
        message: "Assignment submitted successfully",
        result: submission,
        meta: null
      });

    } catch (exception) {
      console.error("submitAssignment controller error:", exception);
      next(exception);
    }
  }

  getAssignmentSubmissions = async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;

      const { data, count } = await assignmentService.listSubmissionsByAssignment(
        req.params.assignmentId,
        req.authUser.schoolId,
        { limit, skip }
      );

      return res.json({
        message: "Submissions fetched successfully",
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch (exception) {
      next(exception);
    }
  }

  getAssignmentSubmissionById = async (req, res, next) => {
    try {
      const submission = await this.#validateSubmission(req.params.id, req.authUser.schoolId);
      return res.json({
        message: "Submission fetched successfully",
        result: submission,
        meta: null
      });
    } catch (exception) {
      next(exception);
    }
  }

  updateAssignmentSubmission = async (req, res, next) => {
    try {
      const submission = await this.#validateSubmission(req.params.id, req.authUser.schoolId);
      const studentId = req.authUser.studentProfile?.id;
      
      if (submission.student.id !== studentId) {
        throw { status: 403, message: "You can only update your own submission" };
      }

      if (submission.status === "graded") {
        throw { status: 400, message: "Cannot update a graded submission" };
      }

      const raw = req.body.submissionKeys;
      const submissionKeys = raw ? (Array.isArray(raw) ? raw : [raw]) : undefined;

      const updated = await assignmentService.updateSubmission(
        req.params.id,
        req.authUser.schoolId,
        studentId,
        {
          submissionKeys,
          externalSubmissionLink: req.body.externalSubmissionLink
        }
      );

      return res.json({
        message: "Submission updated successfully",
        result: updated,
        meta: null
      });
    } catch (exception) {
      next(exception);
    }
  }

  deleteAssignmentSubmission = async (req, res, next) => {
    try {
      const submission = await this.#validateSubmission(req.params.id, req.authUser.schoolId);
      const studentId = req.authUser.studentProfile?.id;
      
      if (submission.student.id !== studentId) {
        throw { status: 403, message: "You can only delete your own submission" };
      }

      const deleted = await assignmentService.deleteSubmission(req.params.id, req.authUser.schoolId);
      return res.json({
        message: "Submission deleted successfully",
        result: deleted,
        meta: null
      });
    } catch (exception) {
      next(exception);
    }
  }

  reviewAssignmentSubmission = async (req, res, next) => {
    try {
      await this.#validateSubmission(req.params.id, req.authUser.schoolId);
      
      const { status, marksObtained, feedback } = req.body;
      
      const updated = await assignmentService.reviewSubmission(req.params.id, {
        status,
        marksObtained,
        feedback,
        reviewedBy: req.authUser.id
      });

      return res.json({
        message: `Submission marked as ${status} successfully`,
        result: updated,
        meta: null
      });
    } catch (exception) {
      next(exception);
    }
  }

  listAssignmentSubmissionByStudent = async (req, res, next) => {
    try {
      const studentId = req.authUser.studentProfile?.id;
      if(!studentId) throw { status: 403, message: "Student profile not found" };

      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;

      const { data, count } = await assignmentService.listSubmissionsByStudent(
        studentId, 
        req.authUser.schoolId,
        { limit, skip }
      );

      return res.json({
        message: "Student submissions fetched successfully",
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch(exception) {
      next(exception);
    }
  }

  listAssignmentSubmissionByParent = async (req, res, next) => {
    // In a real scenario, check if the parent truly owns this child via relationships
    // For now we just filter by the provided studentId
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;

      const { data, count } = await assignmentService.listSubmissionsByStudent(
        req.params.studentId, 
        req.authUser.schoolId,
        { limit, skip }
      );

      return res.json({
        message: "Child submissions fetched successfully",
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch(exception) {
      next(exception);
    }
  }

  getAssignmentSubmissionStats = async (req, res, next) => {
    try {
      const stats = await assignmentService.getSubmissionStats(req.params.assignmentId, req.authUser.schoolId);

      return res.json({
        message: "Submission stats fetched successfully",
        result: stats,
        meta: null
      });
    } catch (exception) {
      next(exception);
    }
  }
}

module.exports = new AssignmentController();