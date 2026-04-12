const Joi = require("joi");
const { LMSPublishStatus } = require("../../../config/constant.config");

// ─── Create ────────────────────────────────────────────────────────────────
const chapterDTO = Joi.object({
  academicYearId: Joi.string().uuid().required(),
  classId: Joi.string().uuid().required(),
  sectionId: Joi.string().uuid().allow(null, "").optional(),
  subjectId: Joi.string().uuid().required(),
  syllabusId: Joi.string().uuid().allow(null, "").optional(),

  title: Joi.string().max(255).required(),
  description: Joi.string().max(2000).allow(null, "").optional(),

  orderIndex: Joi.number().integer().min(0).default(0),
  estimatedMinutes: Joi.number().integer().min(1).allow(null).optional(),

  publishStatus: Joi.string()
    .valid(...Object.values(LMSPublishStatus))
    .default(LMSPublishStatus.DRAFT),
});

// ─── Update (all fields optional) ─────────────────────────────────────────
const updateChapterDTO = Joi.object({
  academicYearId: Joi.string().uuid().optional(),
  classId: Joi.string().uuid().optional(),
  sectionId: Joi.string().uuid().allow(null, "").optional(),
  subjectId: Joi.string().uuid().optional(),
  syllabusId: Joi.string().uuid().allow(null, "").optional(),

  title: Joi.string().max(255).optional(),
  description: Joi.string().max(2000).allow(null, "").optional(),

  orderIndex: Joi.number().integer().min(0).optional(),
  estimatedMinutes: Joi.number().integer().min(1).allow(null).optional(),

  publishStatus: Joi.string()
    .valid(...Object.values(LMSPublishStatus))
    .optional(),
}).min(1);

const createChapterProgressDTO = Joi.object({
  studentId: Joi.string().uuid().optional(), // Required for teachers
  completionPercent: Joi.number().min(0).max(100).optional().default(0),
  isCompleted: Joi.boolean().optional().default(false),
});

const updateChapterProgressDTO = Joi.object({
  completionPercent: Joi.number().min(0).max(100).optional(),
  isCompleted: Joi.boolean().optional(),
}).min(1);

module.exports = { chapterDTO, updateChapterDTO, createChapterProgressDTO, updateChapterProgressDTO };