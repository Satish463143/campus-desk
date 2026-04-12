const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../../../config/aws.config");
const resourceService = require("./resource.service");
const { getCache, setCache, clearCache } = require("../../../utils/redisCache");
const { Role, LMSPublishStatus, LMSResourceType } = require("../../../config/constant.config");

const BUCKET = process.env.S3_BUCKET_NAME;
const CACHE_TTL = 600; // 10 min

// ─── Helper: parse the S3 key from a public URL ─────────────────────────────
// URL format: https://<bucket>.s3.<region>.amazonaws.com/<key>
function extractS3Key(url) {
  try {
    const { pathname } = new URL(url);
    return pathname.startsWith("/") ? pathname.slice(1) : pathname;
  } catch {
    return url; // already a key
  }
}

class ResourceController {
  // ─── Private: validate resource exists and belongs to school ─────────────
  #validate = async (id, schoolId) => {
    if (!id) throw { status: 400, message: "Resource id is required" };
    const resource = await resourceService.getResourceById(id, schoolId);
    if (!resource) throw { status: 404, message: "Resource not found" };
    return resource;
  };

  // ─── CREATE  POST / ───────────────────────────────────────────────────────
  createResource = async (req, res, next) => {
    try {
      const {
        chapterId,
        type,
        title,
        description,
        externalUrl,
        publishStatus,
      } = req.body;

      // Normalise uploaded file URLs (persistAllToS3 sets req.body.fileKey)
      const raw = req.body.fileKey;
      const fileKeys = raw ? (Array.isArray(raw) ? raw : [raw]) : [];

      const resource = await resourceService.createResource({
        schoolId: req.authUser.schoolId,
        chapterId,
        type,
        title,
        description,
        fileKeys,
        externalUrl,
        publishStatus,
        createdBy: req.authUser.id,
      });

      await clearCache(`resource_list_*_school${req.authUser.schoolId}`);

      return res.status(201).json({
        message: "Resource created successfully",
        result: resource,
        meta: null,
      });
    } catch (exception) {
      console.error("createResource error:", exception);
      next(exception);
    }
  };

  // ─── LIST  GET /?page&limit&search&type&chapterId ─────────────────────────
  listResources = async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page  = Math.max(parseInt(req.query.page) || 1, 1);
      const skip  = (page - 1) * limit;
      const search = req.query.search?.trim() || "";

      const filters = {
        chapterId:     req.query.chapterId     || "",
        type:          req.query.type          || "",
        publishStatus: req.query.publishStatus || "",
      };

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter) {
         filters.publishStatus = LMSPublishStatus.PUBLISHED;
      }

      const cacheKey = `resource_list_p${page}_l${limit}_s${search}_ch${filters.chapterId}_t${filters.type}_ps${filters.publishStatus}_school${req.authUser.schoolId}`;

      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Resource list fetched (cached)",
          result: cached.data,
          meta: { currentPage: page, limit, total: cached.count },
        });
      }

      const { data, count } = await resourceService.listResources(
        { schoolId: req.authUser.schoolId, search, ...filters },
        { limit, skip }
      );

      await setCache(cacheKey, { data, count }, CACHE_TTL);

      return res.json({
        message: "Resource list fetched",
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch (exception) {
      console.error("listResources error:", exception);
      next(exception);
    }
  };

  // ─── GET BY ID  GET /:id ──────────────────────────────────────────────────
  getResourceById = async (req, res, next) => {
    try {
      const cacheKey = `resource_${req.params.id}_school${req.authUser.schoolId}`;
      const cached   = await getCache(cacheKey);
      if (cached) {
        return res.json({
          message: "Resource fetched (cached)",
          result: cached,
          meta: null,
        });
      }

      const resource = await this.#validate(req.params.id, req.authUser.schoolId);

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter && resource.publishStatus !== LMSPublishStatus.PUBLISHED) {
         throw { status: 403, message: "You don't have permission to view this resource" };
      }

      await setCache(cacheKey, resource, CACHE_TTL);

      return res.json({
        message: "Resource fetched successfully",
        result: resource,
        meta: null,
      });
    } catch (exception) {
      console.error("getResourceById error:", exception);
      next(exception);
    }
  };

  // ─── UPDATE  PUT /:id ─────────────────────────────────────────────────────
  updateResource = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      const raw      = req.body.fileKey;
      const fileKeys = raw ? (Array.isArray(raw) ? raw : [raw]) : undefined;

      const updated = await resourceService.updateResource(
        req.params.id,
        req.authUser.schoolId,
        { ...req.body, fileKeys, updatedBy: req.authUser.id }
      );

      await Promise.all([
        clearCache(`resource_list_*_school${req.authUser.schoolId}`),
        clearCache(`resource_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Resource updated successfully",
        result: updated,
        meta: null,
      });
    } catch (exception) {
      console.error("updateResource error:", exception);
      next(exception);
    }
  };

  // ─── DELETE  DELETE /:id ──────────────────────────────────────────────────
  deleteResource = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);

      const deleted = await resourceService.deleteResource(req.params.id);

      await Promise.all([
        clearCache(`resource_list_*_school${req.authUser.schoolId}`),
        clearCache(`resource_${req.params.id}_school${req.authUser.schoolId}`),
      ]);

      return res.json({
        message: "Resource deleted successfully",
        result: deleted,
        meta: null,
      });
    } catch (exception) {
      console.error("deleteResource error:", exception);
      next(exception);
    }
  };

  // ─── STREAM VIDEO  GET /:id/stream?fileIndex=0 ────────────────────────────
  // Implements HTTP Range requests so Chrome/Safari can seek videos without
  // downloading the whole file. Only works for type === 'video'.
  streamVideo = async (req, res, next) => {
    try {
      const resource = await this.#validate(req.params.id, req.authUser.schoolId);

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter && resource.publishStatus !== LMSPublishStatus.PUBLISHED) {
         throw { status: 403, message: "You don't have permission to stream this resource" };
      }

      if (resource.type !== LMSResourceType.VIDEO) {
        throw { status: 400, message: "This resource is not a video" };
      }

      const fileIndex = parseInt(req.query.fileIndex) || 0;
      const fileUrl   = resource.fileKeys[fileIndex];
      if (!fileUrl) throw { status: 404, message: "Video file not found" };

      const s3Key = extractS3Key(fileUrl);

      // ── 1. First get the object size via HeadObject-like approach ──────────
      // We ask S3 for the whole object but only use its ContentLength header
      const headCmd = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
      const head    = await s3.send(headCmd);
      const fileSize = head.ContentLength;

      const rangeHeader = req.headers.range;

      if (!rangeHeader) {
        // No Range header → send entire file (small videos / first request)
        res.writeHead(200, {
          "Content-Type":   head.ContentType || "video/mp4",
          "Content-Length": fileSize,
          "Accept-Ranges":  "bytes",
        });
        head.Body.pipe(res);
        return;
      }

      // ── 2. Parse Range: bytes=start-end ────────────────────────────────────
      const [startStr, endStr] = rangeHeader.replace("bytes=", "").split("-");
      const start = parseInt(startStr, 10);
      const end   = endStr ? parseInt(endStr, 10) : Math.min(start + 10 * 1024 * 1024 - 1, fileSize - 1); // 10 MB chunk by default
      const chunkSize = end - start + 1;

      // ── 3. Fetch the specific byte range from S3 ───────────────────────────
      const rangeCmd = new GetObjectCommand({
        Bucket: BUCKET,
        Key:    s3Key,
        Range:  `bytes=${start}-${end}`,
      });
      const rangeData = await s3.send(rangeCmd);

      res.writeHead(206, {
        "Content-Range":  `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges":  "bytes",
        "Content-Length": chunkSize,
        "Content-Type":   rangeData.ContentType || "video/mp4",
      });

      rangeData.Body.pipe(res);
    } catch (exception) {
      console.error("streamVideo error:", exception);
      next(exception);
    }
  };

  // ─── PRESIGNED URL  GET /:id/url?fileIndex=0 ─────────────────────────────
  // For non-video files (pdf, image, doc): returns a short-lived signed URL
  // the frontend opens directly. TTL 300 s (5 min).
  getPresignedUrl = async (req, res, next) => {
    try {
      const resource = await this.#validate(req.params.id, req.authUser.schoolId);

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter && resource.publishStatus !== LMSPublishStatus.PUBLISHED) {
         throw { status: 403, message: "You don't have permission to access this resource" };
      }

      if (resource.type === LMSResourceType.VIDEO) {
        throw { status: 400, message: "Use the /stream endpoint for videos" };
      }

      const fileIndex = parseInt(req.query.fileIndex) || 0;
      const fileUrl   = resource.fileKeys[fileIndex];
      if (!fileUrl && !resource.externalUrl) {
        throw { status: 404, message: "No file attached to this resource" };
      }

      // If it's a plain external link — just return it
      if (!fileUrl && resource.externalUrl) {
        return res.json({
          message: "External resource URL",
          result: { url: resource.externalUrl, expiresIn: null },
          meta: null,
        });
      }

      const s3Key = extractS3Key(fileUrl);
      const cmd   = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
      const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 }); // 5 min

      return res.json({
        message: "Presigned URL generated",
        result: { url: signedUrl, expiresIn: 300 },
        meta: null,
      });
    } catch (exception) {
      console.error("getPresignedUrl error:", exception);
      next(exception);
    }
  };

  listResourcesByStudent = async (req, res, next) => {
    try {
       const studentId = req.authUser.studentProfile?.id;
       if (!studentId) throw { status: 403, message: "Student profile not found." };
       return this.listResources(req, res, next);
    } catch (error) {
       next(error);
    }
  };

  listResourcesByParent = async (req, res, next) => {
    try {
       const studentId = req.params.studentId;
       if (!studentId) throw { status: 400, message: "Student ID is required." };
       
       req.authUser.role = Role.STUDENT;
       req.authUser.studentProfile = { id: studentId };
       
       return this.listResources(req, res, next);
    } catch (error) {
       next(error);
    }
  };
}

module.exports = new ResourceController();