const Joi = require("joi")

/**
 * @openapi
 * components:
 *   schemas:
 *     ClassDTO:
 *       type: object
 *       required:
 *         - academicYearId
 *         - name
 *         - numericLevel
 *       properties:
 *         academicYearId:
 *           type: string
 *           format: uuid
 *           description: ID of the academic year
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Name of the class
 *           example: "Class 10"
 *         numericLevel:
 *           type: integer
 *           description: Numeric value representing the class level
 *           example: 10
 *
 *     UpdateClassDTO:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the class
 *           example: "Class 10 A"
 *         numericLevel:
 *           type: integer
 *           description: Numeric value representing the class level
 *           example: 10
 */

const classDTO = Joi.object({
    academicYearId: Joi.string().uuid().required(),
    name:           Joi.string().trim().min(1).max(100).required(),
    numericLevel:   Joi.number().integer().min(1).required(),
})

const updateClassDTO = Joi.object({
    name:         Joi.string().trim().min(1).max(100).optional(),
    numericLevel: Joi.number().integer().min(1).optional(),
}).min(1) // at least one field must be provided

module.exports = {
    classDTO,
    updateClassDTO,
}