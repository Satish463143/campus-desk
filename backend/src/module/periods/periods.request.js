const Joi = require("joi");

/**
 * Periods use a human-friendly time format:
 *   startTime: "HH:MM"  (24-hour, e.g. "08:00")
 *   durationMinutes: positive integer (e.g. 45)
 *
 * The service converts these to startTime/endTime DateTime objects for storage.
 */

const createPeriodDTO = Joi.object({
    name:            Joi.string().max(50).required(),
    periodNumber:    Joi.number().integer().min(1).required(),
    startTime:       Joi.string()
                       .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
                       .required()
                       .messages({ 'string.pattern.base': '"startTime" must be in HH:MM format (24-hour)' }),
    durationMinutes: Joi.number().integer().min(5).max(300).required()
                       .messages({ 'number.min': '"durationMinutes" must be at least 5 minutes' }),
    academicYearId:  Joi.string().uuid().required(),
    isBreak:         Joi.boolean().optional(),
    isActive:        Joi.boolean().optional(),
}).options({ stripUnknown: true });

const updatePeriodDTO = Joi.object({
    name:            Joi.string().max(50).optional(),
    periodNumber:    Joi.number().integer().min(1).optional(),
    startTime:       Joi.string()
                       .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
                       .optional()
                       .messages({ 'string.pattern.base': '"startTime" must be in HH:MM format (24-hour)' }),
    durationMinutes: Joi.number().integer().min(5).max(300).optional(),
    isBreak:         Joi.boolean().optional(),
    isActive:        Joi.boolean().optional(),
}).options({ stripUnknown: true });

module.exports = { createPeriodDTO, updatePeriodDTO };
