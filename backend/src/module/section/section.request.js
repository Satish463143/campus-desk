const Joi = require("joi")

/**
 * @openapi
 * components:
 *   schemas:
 *     SectionDTO:
 *       type: object
 *       required:
 *         - classId
 *         - name
 *       properties:
 *         classId:
 *           type: string
 *           format: uuid
 *           description: ID of the class this section belongs to
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         name:
 *           type: string
 *           description: Name of the section
 *           example: "A"
 *         capacity:
 *           type: integer
 *           description: Maximum student capacity for the section
 *           example: 40
 *           minimum: 1
 *         classTeacherId:
 *           type: string
 *           format: uuid
 *           description: ID of the teacher assigned as class teacher
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *
 *     UpdateSectionDTO:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the section
 *           example: "B"
 *         capacity:
 *           type: integer
 *           description: Maximum student capacity for the section
 *           example: 35
 *           minimum: 1
 *         classTeacherId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: ID of the teacher assigned as class teacher (null to remove)
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 */

const sectionDTO = Joi.object({
    classId:        Joi.string().uuid().required(),
    name:           Joi.string().trim().min(1).max(10).required(),
    capacity:       Joi.number().integer().min(1).optional(),
    classTeacherId: Joi.string().uuid().optional(),
})

const updateSectionDTO = Joi.object({
    name:           Joi.string().trim().min(1).max(10).optional(),
    capacity:       Joi.number().integer().min(1).optional(),
    classTeacherId: Joi.string().uuid().optional().allow(null),
}).min(1)


module.exports = {
    sectionDTO,
    updateSectionDTO,
}
