const Joi = require("joi");
const { LMSPublishStatus } = require("../../../config/constant.config");

const createAnnouncementDTO = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  message: Joi.string().min(3).required(),
  
  publishStatus: Joi.string().valid(...Object.values(LMSPublishStatus)).optional().default(LMSPublishStatus.DRAFT),
  publishAt: Joi.date().iso().optional(),

  academicYearId: Joi.string().uuid().optional(),
  classId: Joi.string().uuid().optional(),
  sectionId: Joi.string().uuid().optional(),
  subjectId: Joi.string().uuid().optional()
}).custom((value, helpers) => {
  if (value.sectionId && !value.classId) {
    return helpers.message("classId must be provided if sectionId is specified.");
  }
  if (value.subjectId && !value.classId) {
    return helpers.message("classId must be provided if subjectId is specified.");
  }
  return value;
});

const updateAnnouncementDTO = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  message: Joi.string().min(3).optional(),
  
  publishStatus: Joi.string().valid(...Object.values(LMSPublishStatus)).optional(),
  publishAt: Joi.date().iso().optional(),

  academicYearId: Joi.string().uuid().optional().allow(null),
  classId: Joi.string().uuid().optional().allow(null),
  sectionId: Joi.string().uuid().optional().allow(null),
  subjectId: Joi.string().uuid().optional().allow(null)
}).custom((value, helpers) => {
  if (value.sectionId && !value.classId) {
    return helpers.message("classId must be provided if sectionId is specified.");
  }
  if (value.subjectId && !value.classId) {
     return helpers.message("classId must be provided if subjectId is specified.");
  }
  return value;
}).min(1);


module.exports = {
  createAnnouncementDTO,
  updateAnnouncementDTO
};
