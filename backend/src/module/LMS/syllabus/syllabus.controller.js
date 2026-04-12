const syllabusService = require("./syllabus.service");
const { getCache, setCache, clearCache } = require("../../../utils/redisCache");
const { Role, LMSPublishStatus } = require("../../../config/constant.config");

// Cache TTL constants
const CACHE_TTL = 600; // 10 minutes

class SyllabusController {
  // ─── Private helper ──────────────────────────────────────────────────────
  #validate = async (id, schoolId) => {
    if (!id) throw { status: 400, message: "Syllabus id is required" };
    const syllabus = await syllabusService.getSyllabusById(id, schoolId);
    if (!syllabus) throw { status: 404, message: "Syllabus not found" };
    return syllabus;
  };

  // ─── CREATE  POST / ──────────────────────────────────────────────────────
  createSyllabus = async (req, res, next) => {
    try {
      const {
        academicYearId,
        classId,
        sectionId,
        subjectId,
        title,
        description,
        objectives,
        publishStatus,
        externalFileUrl,
      } = req.body;

      // fileKeys comes from S3 upload middleware:
      // single upload → string, multiple → string[]. Normalise to array.
      const raw = req.body.fileKey;
      const fileKeys = raw ? (Array.isArray(raw) ? raw : [raw]) : [];

      const syllabus = await syllabusService.createSyllabus({
        schoolId: req.authUser.schoolId,
        academicYearId,
        classId,
        sectionId,
        subjectId,
        title,
        description,
        objectives,
        publishStatus,
        fileKeys,
        externalFileUrl,
        createdBy: req.authUser.id,
      });

      await clearCache(`syllabus_list_*_school${req.authUser.schoolId}`);

      return res.json({
        message: "Syllabus created successfully",
        result: syllabus,
        meta: null,
      });
    } catch (exception) {
      console.error("createSyllabus controller error:", exception);
      next(exception);
    }
  };

  // ─── LIST  GET /?page&limit&search&filters ───────────────────────────────
  listSyllabus = async (req, res, next) => {
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
        publishStatus: req.query.publishStatus || "",
      };

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter) {
         filters.publishStatus = LMSPublishStatus.PUBLISHED;
      }

      const cacheKey = `syllabus_list_p${page}_l${limit}_s${search}_ay${filters.academicYearId}_cl${filters.classId}_sec${filters.sectionId}_sub${filters.subjectId}_ps${filters.publishStatus}_school${req.authUser.schoolId}`;

      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Syllabus list fetched (cached)",
          result: cached.data,
          meta: { currentPage: page, limit, total: cached.count },
        });
      }

      const { data, count } = await syllabusService.listSyllabus(
        { schoolId: req.authUser.schoolId, search, ...filters },
        { limit, skip }
      );

      await setCache(cacheKey, { data, count }, CACHE_TTL);

      return res.json({
        message: "Syllabus list fetched",
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch (exception) {
      console.error("listSyllabus controller error:", exception);
      next(exception);
    }
  };

  // ─── GET BY ID  GET /:id ─────────────────────────────────────────────────
  getSyllabusById = async (req, res, next) => {
    try {
      const cacheKey = `syllabus_${req.params.id}_school${req.authUser.schoolId}`;
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Syllabus fetched (cached)",
          result: cached,
          meta: null,
        });
      }

      const syllabus = await this.#validate(req.params.id, req.authUser.schoolId);

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter && syllabus.publishStatus !== LMSPublishStatus.PUBLISHED) {
         throw { status: 403, message: "You don't have permission to view this syllabus" };
      }

      await setCache(cacheKey, syllabus, CACHE_TTL);

      return res.json({
        message: "Syllabus fetched successfully",
        result: syllabus,
        meta: null,
      });
    } catch (exception) {
      console.error("getSyllabusById controller error:", exception);
      next(exception);
    }
  };

  // ─── UPDATE  PUT /:id ────────────────────────────────────────────────────
  updateSyllabus = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      // Normalise uploaded URLs (single → array)
      const raw = req.body.fileKey;
      const fileKeys = raw ? (Array.isArray(raw) ? raw : [raw]) : undefined;

      const updated = await syllabusService.updateSyllabus(
        req.params.id,
        req.authUser.schoolId,
        { ...req.body, fileKeys, updatedBy: req.authUser.id }
      );

      // Clear both list cache and single-item cache
      await Promise.all([
        clearCache(`syllabus_list_*_school${req.authUser.schoolId}`),
        clearCache(`syllabus_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Syllabus updated successfully",
        result: updated,
        meta: null,
      });
    } catch (exception) {
      console.error("updateSyllabus controller error:", exception);
      next(exception);
    }
  };

  // ─── DELETE  DELETE /:id ─────────────────────────────────────────────────
  deleteSyllabus = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      const deleted = await syllabusService.deleteSyllabus(
        req.params.id,
        req.authUser.schoolId
      );

      await Promise.all([
        clearCache(`syllabus_list_*_school${req.authUser.schoolId}`),
        clearCache(`syllabus_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Syllabus deleted successfully",
        result: deleted,
        meta: null,
      });
    } catch (exception) {
      console.error("deleteSyllabus controller error:", exception);
      next(exception);
    }
  };

  listSyllabusByStudent = async (req, res, next) => {
    try {
       const studentId = req.authUser.studentProfile?.id;
       if (!studentId) throw { status: 403, message: "Student profile not found." };
       // Enforce fetching for their specific enrollment contexts if needed inside service,
       // but here we just reuse the lists route logic that already locks to PUBLISHED.
       return this.listSyllabus(req, res, next);
    } catch (error) {
       next(error);
    }
  };

  listSyllabusByParent = async (req, res, next) => {
    try {
       const studentId = req.params.studentId;
       if (!studentId) throw { status: 400, message: "Student ID is required." };
       
       req.authUser.role = Role.STUDENT;
       req.authUser.studentProfile = { id: studentId };
       
       return this.listSyllabus(req, res, next);
    } catch (error) {
       next(error);
    }
  };
}

module.exports = new SyllabusController();