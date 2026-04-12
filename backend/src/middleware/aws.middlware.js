const multer = require('multer');
const path = require('path');
const {s3}  = require('../config/aws.config');
const { uploadToS3 } = require('../utils/s3.upload');
const { randomStringGenerator } = require('../utils/helper');
const { FileFilterType } = require('../config/constant.config');
require("dotenv").config();

const BUCKET = process.env.S3_BUCKET_NAME;

const generateFileName = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const code = randomStringGenerator(20);
  return `School-Management-${code}${ext}`;
};

// ─── Extension map per FileFilterType ────────────────────────────────────
const EXT_MAP = {
  [FileFilterType.IMAGE]:    ['jpg', 'jpeg', 'png', 'webp'],
  [FileFilterType.DOCUMENT]: ['pdf', 'txt', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'],
  [FileFilterType.VIDEO]:    ['mp4', 'mov', 'mkv', 'avi', 'webm'],
  [FileFilterType.AUDIO]:    ['mp3', 'wav', 'aac', 'm4a'],
};

// ─── Filters ──────────────────────────────────────────────────────────────
const fileFilterByType = (allowed) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('File format not supported'));
};


// ─── Persist uploaded files from memory to S3 ────────────────────────────
// Uploads all files in req.file / req.files to S3.
// When multiple files share the same fieldname their URLs are collected as
// an array on req.body (e.g. req.body.fileKey = ['url1','url2',...]).
// A single file keeps the existing plain-string behaviour.
async function persistAllToS3(req, res, next) {
  try {
    const folder = req.uploadPath || 'uploads';

    // normalize to an array-of-[fieldname, filesArray] entries
    const fieldEntries = [];
    if (req.file) fieldEntries.push(['file', [req.file]]);
    if (req.files && !Array.isArray(req.files)) {
      for (const [field, arr] of Object.entries(req.files)) {
        if (Array.isArray(arr) && arr.length) fieldEntries.push([field, arr]);
      }
    } else if (Array.isArray(req.files) && req.files.length) {
      fieldEntries.push(['files', req.files]);
    }

    if (!req.body) req.body = {};

    for (const [fieldname, files] of fieldEntries) {
      const urls = [];

      for (const file of files) {
        const Key = `${folder}/${generateFileName(file)}`;
        const ContentType = file.mimetype || 'application/octet-stream';

        const { url, key, bucket } = await uploadToS3({
          s3,
          Bucket: BUCKET,
          Key,
          Body: file.buffer,
          ContentType,
          CacheControl: 'public, max-age=31536000',
        });

        // enrich the multer file object (backward compat)
        file.key      = key;
        file.bucket   = bucket;
        file.location = url;

        urls.push(url);
      }

      // single file  → plain string  (no breaking change for existing routes)
      // multiple files → array of strings
      req.body[fieldname] = urls.length === 1 ? urls[0] : urls;
    }
    next();
  } catch (err) {
    console.log('here',err);
    next(err);
  }
}

// ─── Public API (keeps your old function names) ──────────────────────────
const uplaodFile = (fileType = FileFilterType.IMAGE) => {
  let allowed = ['jpg', 'jpeg', 'png', 'webp'];
  if (fileType === FileFilterType.DOCUMENT) {
    allowed = ['pdf', 'txt', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
  } else if (fileType === FileFilterType.VIDEO) {
    allowed = ['mp4', 'mov', 'mkv'];
  } else if (Array.isArray(fileType) && fileType.includes('image') && fileType.includes('video')) {
    // Handle IMAGE_VIDEO type - allow both images and videos
    allowed = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'mkv', 'avi', 'webm'];
  }

  const filter = fileFilterByType(allowed);

  // Single/multiple dynamic usage:
  // You can still choose .single('field') / .array('field') / .fields([...]) in your route
  // Here we return a chainable middleware: first multer, then persist to S3
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: filter,
  });

  // By default, let the route decide single/array/fields.
  // But to keep backward compatibility (where you used uplaodFile(...) directly),
  // we’ll return a function that expects the route to choose method:
  upload.persist = persistAllToS3;
  return upload;
};

// Keep your setPath helper exactly as-is
const setPath = (folder) => (req, _res, next) => {
  req.uploadPath = folder; 
  next();
};

// ─── Multi-type upload helper ─────────────────────────────────────────────
// Usage:  uploadMixed([FileFilterType.IMAGE, FileFilterType.DOCUMENT]).fields([...])
//         uploadMixed([FileFilterType.IMAGE, FileFilterType.DOCUMENT, FileFilterType.VIDEO]).fields([...])
//
// Size limits:
//   • VIDEO included  → 200 MB  (videos can be large)
//   • image / doc only → 5 MB
const uploadMixed = (types = []) => {
  // Build combined extension whitelist
  const allowed = types.flatMap((t) => EXT_MAP[t] ?? []);

  if (!allowed.length) throw {statusCode:400, message:"Invalid file type"};

  const hasVideo = types.includes(FileFilterType.VIDEO);
  const maxSize  = hasVideo ? 200 * 1024 * 1024 : 5 * 1024 * 1024; // 200 MB or 5 MB

  return multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: maxSize },
    fileFilter: fileFilterByType(allowed),
  });
};

module.exports = {
  uplaodFile,       // single-type upload (backward compat)
  uploadMixed,      // multi-type upload with smart size limits
  setPath,
  persistAllToS3,
};
