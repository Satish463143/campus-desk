const Joi = require("joi");
const { DiscussionTargetType } = require("../../../config/constant.config");

const createDiscussionDTO = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  message: Joi.string().min(3).required(),
  
  targetType: Joi.string().valid(...Object.values(DiscussionTargetType)).optional().default(DiscussionTargetType.GENERAL),
  targetId: Joi.string().uuid().optional().allow(null),

  academicYearId: Joi.string().uuid().optional().allow(null),
  classId: Joi.string().uuid().optional().allow(null),
  sectionId: Joi.string().uuid().optional().allow(null),
  subjectId: Joi.string().uuid().optional().allow(null),
  chapterId: Joi.string().uuid().optional().allow(null),
}).custom((value, helpers) => {
  if (value.sectionId && !value.classId) {
    return helpers.message("classId must be provided if sectionId is specified.");
  }
  return value;
});

const updateDiscussionDTO = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  message: Joi.string().min(3).optional(),
  isClosed: Joi.boolean().optional()
}).min(1);

const createReplyDTO = Joi.object({
  message: Joi.string().min(1).required()
});

const updateReplyDTO = Joi.object({
  message: Joi.string().min(1).required()
});

module.exports = {
  createDiscussionDTO,
  updateDiscussionDTO,
  createReplyDTO,
  updateReplyDTO
};
