const liveClassService = require("./liveClass.service");
const { getCache, setCache, clearCache } = require("../../../utils/redisCache");
const { Role } = require("../../../config/constant.config");

// Cache TTL constants
const CACHE_TTL = 600; // 10 minutes

class LiveClassController {
  // ─── Private helper ──────────────────────────────────────────────────────
  #validate = async (id, schoolId) => {
    if (!id) throw { status: 400, message: "Live Class id is required" };
    const liveClass = await liveClassService.getLiveClassById(id, schoolId);
    if (!liveClass) throw { status: 404, message: "Live Class not found" };
    return liveClass;
  };

  // ─── CREATE  POST / ──────────────────────────────────────────────────────
  createLiveClass = async (req, res, next) => {
    try {
      const {
        academicYearId,
        classId,
        sectionId,
        subjectId,
        chapterId,
        periodId,
        liveClassType,
        title,
        description,
        joinLink,
        platform,
        scheduledAt,
        endAt,
        recordingLink,
        status
      } = req.body;

      const teacherId = req.authUser.role === Role.TEACHER 
        ? req.authUser.teacherProfile?.id 
        : req.body.teacherId;

      if (!teacherId) throw { status: 400, message: "Teacher ID is missing or invalid role" };

      const liveClass = await liveClassService.createLiveClass({
        schoolId: req.authUser.schoolId,
        academicYearId,
        classId,
        sectionId,
        subjectId,
        chapterId,
        periodId,
        teacherId,
        liveClassType,
        title,
        description,
        joinLink,
        platform,
        scheduledAt: new Date(scheduledAt),
        endAt: endAt ? new Date(endAt) : undefined,
        recordingLink,
        status,
      });

      await clearCache(`liveclass_list_*_school${req.authUser.schoolId}`);

      return res.status(201).json({
        message: "Live Class created successfully",
        result: liveClass,
        meta: null,
      });
    } catch (exception) {
      console.error("createLiveClass controller error:", exception);
      next(exception);
    }
  };

  // ─── LIST  GET /?page&limit&search&filters ───────────────────────────────
  listLiveClasses = async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      // Allow today/upcoming filters easily (fromDate, toDate)
      const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : undefined;
      const toDate = req.query.toDate ? new Date(req.query.toDate) : undefined;

      const filters = {
        academicYearId: req.query.academicYearId || "",
        classId: req.query.classId || "",
        sectionId: req.query.sectionId || "",
        subjectId: req.query.subjectId || "",
        chapterId: req.query.chapterId || "",
        periodId: req.query.periodId || "",
        teacherId: req.query.teacherId || "",
        status: req.query.status || "",
        fromDate,
        toDate
      };

      const cacheKey = `liveclass_list_p${page}_l${limit}_s${search}_ay${filters.academicYearId}_cl${filters.classId}_sec${filters.sectionId}_sub${filters.subjectId}_chap${filters.chapterId}_per${filters.periodId}_tch${filters.teacherId}_st${filters.status}_fd${filters.fromDate?.getTime()||''}_td${filters.toDate?.getTime()||''}_school${req.authUser.schoolId}`;

      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Live Classes list fetched (cached)",
          result: cached.data,
          meta: { currentPage: page, limit, total: cached.count },
        });
      }

      const { data, count } = await liveClassService.listLiveClasses(
        { schoolId: req.authUser.schoolId, search, ...filters },
        { limit, skip }
      );

      await setCache(cacheKey, { data, count }, CACHE_TTL);

      return res.json({
        message: "Live Classes list fetched",
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch (exception) {
      console.error("listLiveClasses controller error:", exception);
      next(exception);
    }
  };

  // ─── GET BY ID  GET /:id ─────────────────────────────────────────────────
  getLiveClassById = async (req, res, next) => {
    try {
      const cacheKey = `liveclass_${req.params.id}_school${req.authUser.schoolId}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Live Class fetched (cached)",
          result: cached,
          meta: null,
        });
      }

      const liveClass = await this.#validate(req.params.id, req.authUser.schoolId);
      await setCache(cacheKey, liveClass, CACHE_TTL);

      return res.json({
        message: "Live Class fetched successfully",
        result: liveClass,
        meta: null,
      });
    } catch (exception) {
      console.error("getLiveClassById controller error:", exception);
      next(exception);
    }
  };

  // ─── UPDATE  PUT /:id ────────────────────────────────────────────────────
  updateLiveClass = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      const payload = { ...req.body };
      if (payload.scheduledAt) payload.scheduledAt = new Date(payload.scheduledAt);
      if (payload.endAt) payload.endAt = new Date(payload.endAt);

      const updated = await liveClassService.updateLiveClass(
        req.params.id,
        req.authUser.schoolId,
        payload
      );

      // Clear both list cache and single-item cache
      await Promise.all([
        clearCache(`liveclass_list_*_school${req.authUser.schoolId}`),
        clearCache(`liveclass_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Live Class updated successfully",
        result: updated,
        meta: null,
      });
    } catch (exception) {
      console.error("updateLiveClass controller error:", exception);
      next(exception);
    }
  };

  // ─── DELETE  DELETE /:id ─────────────────────────────────────────────────
  deleteLiveClass = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      const deleted = await liveClassService.deleteLiveClass(
        req.params.id,
        req.authUser.schoolId
      );

      await Promise.all([
        clearCache(`liveclass_list_*_school${req.authUser.schoolId}`),
        clearCache(`liveclass_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Live Class deleted successfully",
        result: deleted,
        meta: null,
      });
    } catch (exception) {
      console.error("deleteLiveClass controller error:", exception);
      next(exception);
    }
  };

  // ─── SPECIFIC ROLE VIEWS ─────────────────────────────────────────────────

  listLiveClassesByClassAndSection = async (req, res, next) => {
    req.query.classId = req.params.classId;
    req.query.sectionId = req.params.sectionId;
    return this.listLiveClasses(req, res, next);
  };

  listLiveClassesByStudent = async (req, res, next) => {
    const profile = req.authUser.studentProfile;
    if(!profile) return res.status(403).json({message: "Student profile not found"});
    return this.listLiveClasses(req, res, next);
  };

  listLiveClassesByTeacher = async (req, res, next) => {
    const profile = req.authUser.teacherProfile;
    if(!profile) return res.status(403).json({message: "Teacher profile not found"});
    req.query.teacherId = profile.id;
    return this.listLiveClasses(req, res, next);
  };

}

module.exports = new LiveClassController();