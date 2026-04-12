const Joi = require("joi");
const { DayOfWeek, ClassMode, Status } = require("../../config/constant.config");

const createTimetableDTO = Joi.object({
    classId: Joi.string().uuid().required(),
    sectionId: Joi.string().uuid().required(),
    periodId: Joi.string().uuid().required(),
    subjectId: Joi.string().uuid().required(),
    teacherId: Joi.string().uuid().required(),
    dayOfWeek: Joi.string().valid(...Object.values(DayOfWeek)).required(),
    roomNumber: Joi.string().max(50).optional(),
    classMode: Joi.string().valid(...Object.values(ClassMode)).required(),
    isActive: Joi.string().valid(...Object.values(Status)).optional()
}).options({ stripUnknown: true });

const bulkCreateTimetableDTO = Joi.array().items(createTimetableDTO).min(1).required();

const updateTimetableDTO = Joi.object({
    classId: Joi.string().uuid().optional(),
    sectionId: Joi.string().uuid().optional(),
    periodId: Joi.string().uuid().optional(),
    subjectId: Joi.string().uuid().optional(),
    teacherId: Joi.string().uuid().optional(),
    dayOfWeek: Joi.string().valid(...Object.values(DayOfWeek)).optional(),
    roomNumber: Joi.string().max(50).optional(),
    classMode: Joi.string().valid(...Object.values(ClassMode)).optional(),
    isActive: Joi.string().valid(...Object.values(Status)).optional()
}).options({ stripUnknown: true });

module.exports = {
    createTimetableDTO,
    bulkCreateTimetableDTO,
    updateTimetableDTO
};
