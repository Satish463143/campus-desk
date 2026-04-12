const Joi = require("joi");
const { LiveClassStatus, LiveClassType } = require("../../../config/constant.config");

// ─── Shared Base Variables ──────────────────────────────────────────────────
const uuidBase = Joi.string().uuid();
const stringMax255 = Joi.string().max(255);
const stringMax2000 = Joi.string().max(2000).allow(null, "");

// ─── Create Live Class ─────────────────────────────────────────────────────
const liveClassDTO = Joi.object({
  academicYearId: uuidBase.required(),
  classId: uuidBase.required(),
  sectionId: uuidBase.allow(null, "").optional(),
  subjectId: uuidBase.required(),
  chapterId: uuidBase.allow(null, "").optional(),
  periodId: uuidBase.allow(null, "").optional(),
  
  // Teacher derived from session or explictly passed by admin
  teacherId: uuidBase.optional(), 
  
  liveClassType: Joi.string()
    .valid(...Object.values(LiveClassType))
    .default(LiveClassType.REGULAR),

  title: stringMax255.required(),
  description: stringMax2000.optional(),
  joinLink: Joi.string().uri().required(),
  platform: stringMax255.allow(null, "").optional(),
  
  scheduledAt: Joi.date().iso().required(),
  endAt: Joi.date().iso().min(Joi.ref('scheduledAt')).allow(null, "").optional(),
  
  recordingLink: Joi.string().uri().allow(null, "").optional(),
  
  status: Joi.string()
    .valid(...Object.values(LiveClassStatus))
    .default(LiveClassStatus.SCHEDULED),
});

// ─── Update Live Class ─────────────────────────────────────────────────────
const updateLiveClassDTO = Joi.object({
  academicYearId: uuidBase.optional(),
  classId: uuidBase.optional(),
  sectionId: uuidBase.allow(null, "").optional(),
  subjectId: uuidBase.optional(),
  chapterId: uuidBase.allow(null, "").optional(),
  periodId: uuidBase.allow(null, "").optional(),
  teacherId: uuidBase.optional(), 

  liveClassType: Joi.string()
    .valid(...Object.values(LiveClassType))
    .optional(),

  title: stringMax255.optional(),
  description: stringMax2000.optional(),
  joinLink: Joi.string().uri().optional(),
  platform: stringMax255.allow(null, "").optional(),
  
  scheduledAt: Joi.date().iso().optional(),
  endAt: Joi.date().iso().min(Joi.ref('scheduledAt')).allow(null, "").optional(),
  
  recordingLink: Joi.string().uri().allow(null, "").optional(),
  
  status: Joi.string()
    .valid(...Object.values(LiveClassStatus))
    .optional(),
}).min(1);

module.exports = { 
  liveClassDTO, 
  updateLiveClassDTO 
};