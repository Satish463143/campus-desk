const chapterService = require("./chapter.service");
const { getCache, setCache, clearCache } = require("../../../utils/redisCache");
const { Role, LMSPublishStatus } = require("../../../config/constant.config");

// Cache TTL constants
const CACHE_TTL = 600; // 10 minutes

class ChapterController {
  // ─── Private helper ──────────────────────────────────────────────────────
  #validate = async (id, schoolId) => {
    if (!id) throw { status: 400, message: "Chapter id is required" };
    const chapter = await chapterService.getChapterById(id, schoolId);
    if (!chapter) throw { status: 404, message: "Chapter not found" };
    return chapter;
  };

  // ─── CREATE  POST / ──────────────────────────────────────────────────────
  createChapter = async (req, res, next) => {
    try {
      const {
        academicYearId,
        classId,
        sectionId,
        subjectId,
        syllabusId,
        title,
        description,
        orderIndex,
        estimatedMinutes,
        publishStatus,
      } = req.body;

      const chapter = await chapterService.createChapter({
        schoolId: req.authUser.schoolId,
        academicYearId,
        classId,
        sectionId,
        subjectId,
        syllabusId,
        title,
        description,
        orderIndex,
        estimatedMinutes,
        publishStatus,
        createdBy: req.authUser.id,
      });

      await clearCache(`chapter_list_*_school${req.authUser.schoolId}`);

      return res.status(201).json({
        message: "Chapter created successfully",
        result: chapter,
        meta: null,
      });
    } catch (exception) {
      console.error("createChapter controller error:", exception);
      next(exception);
    }
  };

  // ─── LIST  GET /?page&limit&search&filters ───────────────────────────────
  listChapter = async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      const filters = {
        academicYearId: req.query.academicYearId || "",
        classId: req.query.classId || "",
        sectionId: req.query.sectionId || "",
        subjectId: req.query.subjectId || "",
        syllabusId: req.query.syllabusId || "",
        publishStatus: req.query.publishStatus || "",
      };

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter) {
         filters.publishStatus = LMSPublishStatus.PUBLISHED;
      }

      const cacheKey = `chapter_list_p${page}_l${limit}_s${search}_ay${filters.academicYearId}_cl${filters.classId}_sec${filters.sectionId}_sub${filters.subjectId}_syl${filters.syllabusId}_ps${filters.publishStatus}_school${req.authUser.schoolId}`;

      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Chapter list fetched (cached)",
          result: cached.data,
          meta: { currentPage: page, limit, total: cached.count },
        });
      }

      const { data, count } = await chapterService.listChapters(
        { schoolId: req.authUser.schoolId, search, ...filters },
        { limit, skip }
      );

      await setCache(cacheKey, { data, count }, CACHE_TTL);

      return res.json({
        message: "Chapter list fetched",
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch (exception) {
      console.error("listChapter controller error:", exception);
      next(exception);
    }
  };

  // ─── GET BY ID  GET /:id ─────────────────────────────────────────────────
  getChapterById = async (req, res, next) => {
    try {
      const cacheKey = `chapter_${req.params.id}_school${req.authUser.schoolId}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Chapter fetched (cached)",
          result: cached,
          meta: null,
        });
      }

      const chapter = await this.#validate(req.params.id, req.authUser.schoolId);

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter && chapter.publishStatus !== LMSPublishStatus.PUBLISHED) {
         throw { status: 403, message: "You don't have permission to view this chapter" };
      }

      // If Student, append their progress
      if (req.authUser.role === Role.STUDENT) {
        const studentId = req.authUser.studentProfile?.id;
        if (studentId) {
          chapter.progress = await chapterService.getChapterProgress(chapter.id, studentId);
        }
      }

      await setCache(cacheKey, chapter, CACHE_TTL);

      return res.json({
        message: "Chapter fetched successfully",
        result: chapter,
        meta: null,
      });
    } catch (exception) {
      console.error("getChapterById controller error:", exception);
      next(exception);
    }
  };

  // ─── Progress Tracking ──────────────────────────────────────────────────

  updateProgress = async (req, res, next) => {
    try {
      let studentId = req.authUser.studentProfile?.id;
      const isStaff = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.SUPER_ADMIN, Role.TEACHER].includes(req.authUser.role);

      // If staff updates, they might provide a studentId in body (but usually patch is for specific progress)
      // For simplicity, we assume patch :id/progress updates the LOGGED IN student's progress
      // UNLESS staff is doing it, in which case we might need studentId in query or something.
      // But usually, teachers CREATE/UPDATE via same logic.
      
      if (!studentId && !isStaff) throw { status: 403, message: "Only students or staff can track progress" };
      
      // If staff is updating, they MUST provide studentId? Or we rely on studentId from req.query?
      // Let's stick to: students update THEIR OWN. Teachers use CREATE (UPSERT) to set specific student progress.
      
      if (!isStaff && !studentId) throw { status: 403, message: "Student profile not found" };

      await this.#validate(req.params.id, req.authUser.schoolId);

      const progress = await chapterService.upsertChapterProgress(
        req.authUser.schoolId,
        req.params.id,
        studentId,
        req.body
      );

      await clearCache(`chapter_${req.params.id}_school${req.authUser.schoolId}`);

      return res.json({
        message: "Chapter progress updated",
        result: progress,
        meta: null,
      });
    } catch (error) {
      next(error);
    }
  };

  createProgress = async (req, res, next) => {
    try {
      const isStaff = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.SUPER_ADMIN, Role.TEACHER].includes(req.authUser.role);
      let studentId = isStaff ? req.body.studentId : req.authUser.studentProfile?.id;

      if (!studentId) throw { status: 400, message: "Student ID is required" };

      await this.#validate(req.params.id, req.authUser.schoolId);

      const progress = await chapterService.upsertChapterProgress(
        req.authUser.schoolId,
        req.params.id,
        studentId,
        req.body
      );

      await clearCache(`chapter_${req.params.id}_school${req.authUser.schoolId}`);

      return res.status(201).json({
        message: "Chapter progress created/updated",
        result: progress,
        meta: null,
      });
    } catch (error) {
      next(error);
    }
  };

  getProgress = async (req, res, next) => {
    try {
      const isStaff = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.SUPER_ADMIN, Role.TEACHER].includes(req.authUser.role);
      
      if (isStaff) {
        // Teacher view: list all progress for this chapter
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const skip = (page - 1) * limit;

        const filters = {
           studentId: req.query.studentId,
           isCompleted: req.query.isCompleted === 'true' ? true : req.query.isCompleted === 'false' ? false : undefined
        };

        const { data, count } = await chapterService.listAllChapterProgress(
          req.params.id,
          req.authUser.schoolId,
          filters,
          { limit, skip }
        );

        return res.json({
          message: "All students' chapter progress fetched",
          result: data,
          meta: { currentPage: page, limit, total: count },
        });
      }

      // Student view: their own only
      const studentId = req.authUser.studentProfile?.id;
      if (!studentId) throw { status: 403, message: "Student profile not found" };

      const progress = await chapterService.getChapterProgress(req.params.id, studentId);

      return res.json({
        message: "Chapter progress fetched",
        result: progress,
        meta: null,
      });
    } catch (error) {
      next(error);
    }
  };

  // ─── UPDATE  PUT /:id ────────────────────────────────────────────────────
  updateChapter = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      const updated = await chapterService.updateChapter(
        req.params.id,
        req.authUser.schoolId,
        { ...req.body, updatedBy: req.authUser.id }
      );

      await Promise.all([
        clearCache(`chapter_list_*_school${req.authUser.schoolId}`),
        clearCache(`chapter_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Chapter updated successfully",
        result: updated,
        meta: null,
      });
    } catch (exception) {
      console.error("updateChapter controller error:", exception);
      next(exception);
    }
  };

  // ─── DELETE  DELETE /:id ─────────────────────────────────────────────────
  deleteChapter = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      const deleted = await chapterService.deleteChapter(
        req.params.id,
        req.authUser.schoolId
      );

      await Promise.all([
        clearCache(`chapter_list_*_school${req.authUser.schoolId}`),
        clearCache(`chapter_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Chapter deleted successfully",
        result: deleted,
        meta: null,
      });
    } catch (exception) {
      console.error("deleteChapter controller error:", exception);
      next(exception);
    }
  };

  listChapterByStudent = async (req, res, next) => {
    try {
       const studentId = req.authUser.studentProfile?.id;
       if (!studentId) throw { status: 403, message: "Student profile not found." };
       return this.listChapter(req, res, next);
    } catch (error) {
       next(error);
    }
  };

  listChapterByParent = async (req, res, next) => {
    try {
       const studentId = req.params.studentId;
       if (!studentId) throw { status: 400, message: "Student ID is required." };
       
       req.authUser.role = Role.STUDENT;
       req.authUser.studentProfile = { id: studentId };
       
       return this.listChapter(req, res, next);
    } catch (error) {
       next(error);
    }
  };
}

module.exports = new ChapterController();