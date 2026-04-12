const Joi = require("joi");
const { LMSPublishStatus, LMSResourceType } = require("../../../config/constant.config");

// ─── Create ────────────────────────────────────────────────────────────────
const resourceDTO = Joi.object({
  chapterId: Joi.string().uuid().allow(null, "").optional(),

  type: Joi.string()
    .valid(...Object.values(LMSResourceType))
    .required(),

  title: Joi.string().max(255).required(),
  description: Joi.string().max(2000).allow(null, "").optional(),

  // fileKeys are injected by the S3 upload middleware — not sent manually by the frontend
  fileKeys: Joi.array().items(Joi.string().uri()).max(5).optional(),

  externalUrl: Joi.string().uri().allow(null, "").optional(),

  publishStatus: Joi.string()
    .valid(...Object.values(LMSPublishStatus))
    .default(LMSPublishStatus.DRAFT),
});

// ─── Update (all fields optional) ─────────────────────────────────────────
const updateResourceDTO = Joi.object({
  chapterId: Joi.string().uuid().allow(null, "").optional(),

  type: Joi.string()
    .valid(...Object.values(LMSResourceType))
    .optional(),

  title: Joi.string().max(255).optional(),
  description: Joi.string().max(2000).allow(null, "").optional(),

  fileKeys: Joi.array().items(Joi.string().uri()).max(5).optional(),

  externalUrl: Joi.string().uri().allow(null, "").optional(),

  publishStatus: Joi.string()
    .valid(...Object.values(LMSPublishStatus))
    .optional(),
}).min(1);

module.exports = { resourceDTO, updateResourceDTO };