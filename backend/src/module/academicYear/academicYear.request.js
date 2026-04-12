const Joi = require("joi")

const academicYearDTO = Joi.object({
    name:      Joi.string().trim().min(1).max(20).required(),    // e.g. "2024-2025"
    startDate: Joi.date().iso().required(),
    endDate:   Joi.date().iso().greater(Joi.ref("startDate")).required()
        .messages({ "date.greater": "endDate must be after startDate" }),
    isActive:  Joi.boolean().optional(),
})

const updateAcademicYearDTO = Joi.object({
    name:      Joi.string().trim().min(1).max(20).optional(),
    startDate: Joi.date().iso().optional(),
    endDate:   Joi.date().iso().optional(),
    isActive:  Joi.boolean().optional(),
}).min(1)

module.exports = {
    academicYearDTO,
    updateAcademicYearDTO,
}
