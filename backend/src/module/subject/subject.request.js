const Joi = require("joi")

/**
 * @openapi
 * components:
 *   schemas:
 *     SubjectDTO:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the subject
 *           example: "Mathematics"
 *         code:
 *           type: string
 *           description: Subject code
 *           example: "MTH101"
 *
 *     UpdateSubjectDTO:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the subject
 *           example: "Advanced Mathematics"
 *         code:
 *           type: string
 *           description: Subject code
 *           example: "MTH102"
 *
 *     AssignSubjectToClassDTO:
 *       type: object
 *       required:
 *         - subjectId
 *         - classId
 *       properties:
 *         subjectId:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         classId:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174001"
 *
 *     AssignTeacherToSectionDTO:
 *       type: object
 *       required:
 *         - subjectId
 *         - teacherId
 *       properties:
 *         subjectId:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         teacherId:
 *           type: string
 *           format: uuid
 *           description: ID of the teacher profile (TeacherProfile ID)
 *           example: "123e4567-e89b-12d3-a456-426614174002"
 */

// Create a global Subject (school-level, not class-specific)
const subjectDTO = Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    code: Joi.string().trim().min(1).max(20).optional().allow("", null),
})

const updateSubjectDTO = Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    code: Joi.string().trim().min(1).max(20).optional().allow("", null),
}).min(1)

// Assign a subject to a class (ClassSubject)
const assignSubjectToClassDTO = Joi.object({
    subjectId: Joi.string().uuid().required(),
    classId:   Joi.string().uuid().required(),
})

// Assign a teacher to a section for a specific subject (SectionSubjectTeacher)
const assignTeacherToSectionDTO = Joi.object({
    subjectId: Joi.string().uuid().required(),
    teacherId: Joi.string().uuid().required(),   // TeacherProfile ID
})

module.exports = {
    subjectDTO,
    updateSubjectDTO,
    assignSubjectToClassDTO,
    assignTeacherToSectionDTO,
}
