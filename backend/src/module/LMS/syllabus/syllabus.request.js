const Joi = require("joi");
const { LMSPublishStatus } = require("../../../config/constant.config");

// ─── Create ────────────────────────────────────────────────────────────────
const syllabusDTO = Joi.object({
  academicYearId: Joi.string().uuid().required(),
  classId: Joi.string().uuid().required(),
  sectionId: Joi.string().uuid().allow(null, "").optional(),
  subjectId: Joi.string().uuid().required(),

  title: Joi.string().max(255).required(),
  description: Joi.string().max(2000).allow(null, "").optional(),
  objectives: Joi.string().max(2000).allow(null, "").optional(),

  publishStatus: Joi.string()
    .valid(...Object.values(LMSPublishStatus))
    .default(LMSPublishStatus.DRAFT),

  // populated by S3 upload middleware — frontend does not send this manually
  fileKeys: Joi.array().items(Joi.string().uri()).max(5).optional(),
  externalFileUrl: Joi.string().uri().allow(null, "").optional(),
});

// ─── Update (all fields optional) ─────────────────────────────────────────
const updateSyllabusDTO = Joi.object({
  academicYearId: Joi.string().uuid().optional(),
  classId: Joi.string().uuid().optional(),
  sectionId: Joi.string().uuid().allow(null, "").optional(),
  subjectId: Joi.string().uuid().optional(),

  title: Joi.string().max(255).optional(),
  description: Joi.string().max(2000).allow(null, "").optional(),
  objectives: Joi.string().max(2000).allow(null, "").optional(),

  publishStatus: Joi.string()
    .valid(...Object.values(LMSPublishStatus))
    .optional(),

  fileKeys: Joi.array().items(Joi.string().uri()).max(5).optional(),
  externalFileUrl: Joi.string().uri().allow(null, "").optional(),
}).min(1);

module.exports = { syllabusDTO, updateSyllabusDTO };