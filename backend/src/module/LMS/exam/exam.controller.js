const examService = require("./exam.service");
const { getCache, setCache, clearCache } = require("../../../utils/redisCache");
const { Role, ExamSubmissionStatus } = require("../../../config/constant.config");

const CACHE_TTL = 600; // 10 mins

class ExamController {
  // ─── Utility ─────────────────────────────────────────────────────────────
  #validate = async (id, schoolId) => {
    if (!id) throw { status: 400, message: "Exam id is required" };
    const exam = await examService.getExamById(id, schoolId);
    if (!exam) throw { status: 404, message: "Exam not found" };
    return exam;
  };

  #normalizeFiles = (raw) => {
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  };

  // ─── CREATE  POST / ──────────────────────────────────────────────────────
  createExam = async (req, res, next) => {
    try {
      const payload = { ...req.body };
      
      const teacherId = req.authUser.role === Role.TEACHER 
        ? req.authUser.teacherProfile?.id 
        : payload.teacherId;

      if (!teacherId) throw { status: 400, message: "Teacher ID is missing" };
      payload.teacherId = teacherId;

      payload.schoolId = req.authUser.schoolId;
      payload.questionFileKeys = this.#normalizeFiles(req.body.questionFiles);
      
      if (payload.examDate) payload.examDate = new Date(payload.examDate);
      if (payload.startAt) payload.startAt = new Date(payload.startAt);
      if (payload.endAt) payload.endAt = new Date(payload.endAt);

      const exam = await examService.createExam(payload);
      
      await clearCache(`exam_list_*_school${req.authUser.schoolId}`);

      return res.status(201).json({
        message: "Exam created successfully",
        result: exam,
        meta: null,
      });
    } catch (exception) {
      next(exception);
    }
  };

  // ─── LIST  GET /?filters ─────────────────────────────────────────────────
  listExams = async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate) : undefined;
      const isPublished = req.query.isPublished ? req.query.isPublished === 'true' : undefined;

      const filters = {
        academicYearId: req.query.academicYearId || "",
        classId: req.query.classId || "",
        sectionId: req.query.sectionId || "",
        subjectId: req.query.subjectId || "",
        teacherId: req.query.teacherId || "",
        chapterId: req.query.chapterId || "",
        status: req.query.status || "",
        examCategory: req.query.examCategory || "",
        isPublished,
        fromDate,
        toDate
      };

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter) {
         filters.isPublished = true;
      }

      const cacheKey = `exam_list_p${page}_l${limit}_s${search}_ay${filters.academicYearId}_cl${filters.classId}_sec${filters.sectionId}_sub${filters.subjectId}_tch${filters.teacherId}_ch${filters.chapterId}_st${filters.status}_cat${filters.examCategory}_pub${filters.isPublished}_fd${filters.fromDate?.getTime()||''}_td${filters.toDate?.getTime()||''}_school${req.authUser.schoolId}`;

      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Exams fetched successfully (cached)",
          result: cached.data,
          meta: { currentPage: page, limit, total: cached.count },
        });
      }

      const { data, count } = await examService.listExams(
        { schoolId: req.authUser.schoolId, search, ...filters },
        { limit, skip }
      );

      await setCache(cacheKey, { data, count }, CACHE_TTL);

      return res.json({
        message: "Exams list fetched",
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch (exception) {
      next(exception);
    }
  };

  // ─── GET BY ID  GET /:id ─────────────────────────────────────────────────
  getExamById = async (req, res, next) => {
    try {
      const cacheKey = `exam_${req.params.id}_school${req.authUser.schoolId}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Exam fetched successfully (cached)",
          result: cached,
          meta: null,
        });
      }

      const exam = await this.#validate(req.params.id, req.authUser.schoolId);
      
      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter && !exam.isPublished) {
         throw { status: 403, message: "You don't have permission to view this exam" };
      }

      const stats = await examService.getExamSubmissionStats(req.params.id, req.authUser.schoolId);
      const combinedResult = { ...exam, stats };

      await setCache(cacheKey, combinedResult, CACHE_TTL);

      return res.json({
        message: "Exam fetched successfully",
        result: combinedResult,
        meta: null,
      });
    } catch (exception) {
      next(exception);
    }
  };

  // ─── UPDATE  PUT /:id ────────────────────────────────────────────────────
  updateExam = async (req, res, next) => {
    try {
      const existing = await this.#validate(req.params.id, req.authUser.schoolId);
      
      const payload = { ...req.body };
      
      const newFiles = this.#normalizeFiles(req.body.questionFiles);
      if (newFiles.length > 0) {
        payload.questionFileKeys = [...(existing.questionFileKeys || []), ...newFiles];
      }

      if (payload.examDate) payload.examDate = new Date(payload.examDate);
      if (payload.startAt) payload.startAt = new Date(payload.startAt);
      if (payload.endAt) payload.endAt = new Date(payload.endAt);

      const updated = await examService.updateExam(
        req.params.id,
        req.authUser.schoolId,
        payload
      );

      await Promise.all([
        clearCache(`exam_list_*_school${req.authUser.schoolId}`),
        clearCache(`exam_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Exam updated successfully",
        result: updated,
        meta: null,
      });
    } catch (exception) {
      next(exception);
    }
  };

  // ─── DELETE  DELETE /:id ─────────────────────────────────────────────────
  deleteExam = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      const deleted = await examService.deleteExam(
        req.params.id,
        req.authUser.schoolId
      );

      await Promise.all([
        clearCache(`exam_list_*_school${req.authUser.schoolId}`),
        clearCache(`exam_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Exam deleted successfully",
        result: deleted,
        meta: null,
      });
    } catch (exception) {
      next(exception);
    }
  };

  // ─── Filtered Role Views ─────────────────────────────────────────────────
  listExamsByClassAndSection = async (req, res, next) => {
    req.query.classId = req.params.classId;
    req.query.sectionId = req.params.sectionId;
    // For students/parents checking class exams, only show PUBLISHED exams
    if ([Role.STUDENT, Role.PARENT].includes(req.authUser.role)) {
      req.query.isPublished = 'true';
    }
    return this.listExams(req, res, next);
  };

  listExamsByStudent = async (req, res, next) => {
    try {
       const profile = req.authUser.studentProfile;
       if (!profile) throw { status: 403, message: "Student profile missing" };
       req.query.isPublished = 'true';
       // Here you'd ideally also scope it to the student's specific enrollments if not already done by listExams
       return this.listExams(req, res, next);
    } catch(error) {
       next(error);
    }
  };

  listExamsByParent = async (req, res, next) => {
    try {
       const studentId = req.params.studentId;
       if (!studentId) throw { status: 400, message: "Student ID missing" };
       
       req.authUser.role = Role.STUDENT;
       req.authUser.studentProfile = { id: studentId };
       
       return this.listExams(req, res, next);
    } catch(error) {
       next(error);
    }
  };

  listExamsByTeacher = async (req, res, next) => {
    const profile = req.authUser.teacherProfile;
    if(!profile) return res.status(403).json({message: "Teacher profile missing"});
    req.query.teacherId = profile.id;
    return this.listExams(req, res, next);
  };

  // ─── Exam Submissions ────────────────────────────────────────────────────
  submitExam = async (req, res, next) => {
    try {
      const exam = await this.#validate(req.params.id, req.authUser.schoolId);
      
      const studentId = req.authUser.studentProfile?.id;
      if (!studentId) throw { status: 403, message: "Student profile required for submission" };

      // Check date bounds
      const now = new Date();
      if (exam.startAt && now < new Date(exam.startAt)) {
        throw { status: 400, message: "Exam hasn't started yet" };
      }

      const existingSubmission = await examService.getExamSubmissionByStudent(
        req.params.id,
        studentId,
        req.authUser.schoolId
      );

      const payload = {
        schoolId: req.authUser.schoolId,
        examId: req.params.id,
        studentId,
        submittedAt: now,
        isLate: exam.endAt ? now > new Date(exam.endAt) : false,
        status: ExamSubmissionStatus.SUBMITTED,
        externalAnswerFileUrl: req.body.externalAnswerFileUrl
      };

      const newFiles = this.#normalizeFiles(req.body.answerFiles);
      if (newFiles.length > 0) {
        payload.answerFileKeys = [
          ...(existingSubmission?.answerFileKeys || []),
          ...newFiles
        ];
      } else if (!payload.externalAnswerFileUrl && !existingSubmission?.answerFileKeys?.length) {
         throw { status: 400, message: "Please provide either answer files or an external answer link" };
      }

      const submission = await examService.submitExam(payload);

      // Invalidate the exam cache since submission stats map there
      await clearCache(`exam_${req.params.id}_school${req.authUser.schoolId}`);

      return res.status(201).json({
        message: "Exam submitted successfully",
        result: submission,
        meta: null,
      });
    } catch (exception) {
      next(exception);
    }
  };

  listExamSubmissions = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;

      const { data, count } = await examService.listExamSubmissions(
        req.params.id,
        req.authUser.schoolId,
        { limit, skip }
      );

      return res.json({
        message: "Exam submissions fetched successfully",
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch (exception) {
      next(exception);
    }
  };

  getMyExamSubmission = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);
      
      const studentId = req.authUser.studentProfile?.id;
      if (!studentId) throw { status: 403, message: "Student profile needed" };

      const submission = await examService.getExamSubmissionByStudent(
        req.params.id,
        studentId,
        req.authUser.schoolId
      );

      if (!submission) {
        return res.status(404).json({ message: "No submission found", result: null, meta: null });
      }

      return res.json({
        message: "Submission fetched successfully",
        result: submission,
        meta: null,
      });
    } catch (exception) {
      next(exception);
    }
  };

  reviewExamSubmission = async (req, res, next) => {
    try {
      const { examId, submissionId } = req.params;
      const exam = await this.#validate(examId, req.authUser.schoolId);
      
      const teacherId = req.authUser.teacherProfile?.id;
      if (!teacherId || exam.teacherId !== teacherId && req.authUser.role !== Role.ADMIN_STAFF) {
         throw { status: 403, message: "Insufficient permissions to review this exam" };
      }

      const submission = await examService.getExamSubmissionById(
        submissionId,
        examId,
        req.authUser.schoolId
      );
      if (!submission) throw { status: 404, message: "Submission not found" };

      const { status, marksObtained, feedback } = req.body;
      
      if (marksObtained !== undefined && marksObtained > exam.totalMarks) {
        throw { status: 400, message: `Marks obtained cannot exceed total marks (${exam.totalMarks})` };
      }

      const reviewed = await examService.reviewExamSubmission(
        submissionId,
        examId,
        req.authUser.schoolId,
        teacherId,
        { status, marksObtained, feedback }
      );
      
      await clearCache(`exam_${examId}_school${req.authUser.schoolId}`);

      return res.json({
        message: "Exam reviewed successfully",
        result: reviewed,
        meta: null,
      });
    } catch (exception) {
      next(exception);
    }
  };
}

module.exports = new ExamController();