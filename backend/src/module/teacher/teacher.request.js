const Joi = require("joi")
const { Status } = require("../../config/constant.config")

/**
 * @openapi
 * components:
 *   schemas:
 *     AddressSchema:
 *       type: object
 *       required:
 *         - province
 *         - district
 *         - fullAddress
 *       properties:
 *         country:
 *           type: string
 *           default: "Nepal"
 *           example: "Nepal"
 *         province:
 *           type: string
 *           example: "Bagmati"
 *         district:
 *           type: string
 *           example: "Kathmandu"
 *         fullAddress:
 *           type: string
 *           example: "Baneshwor, Kathmandu"
 *
 *     AddressOptionalSchema:
 *       type: object
 *       properties:
 *         country:
 *           type: string
 *           default: "Nepal"
 *           example: "Nepal"
 *         province:
 *           type: string
 *           example: "Bagmati"
 *         district:
 *           type: string
 *           example: "Kathmandu"
 *         fullAddress:
 *           type: string
 *           example: "Baneshwor, Kathmandu"
 *
 *     CreateTeacherProfileDTO:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - password
 *         - joiningDate
 *         - address
 *       properties:
 *         name:
 *           type: string
 *           example: "Sita Thapa"
 *         email:
 *           type: string
 *           format: email
 *           example: "sita@school.com"
 *         phone:
 *           type: string
 *           example: "9800000000"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *           example: "securepassword"
 *         profileImage:
 *           type: string
 *           format: uri
 *           example: "https://example.com/image.jpg"
 *         employeeId:
 *           type: string
 *           example: "EMP-101"
 *         qualification:
 *           type: string
 *           example: "M.Sc. Mathematics"
 *         experienceYears:
 *           type: integer
 *           minimum: 0
 *           example: 5
 *         joiningDate:
 *           type: string
 *           format: date
 *           example: "2023-05-15"
 *         salary:
 *           type: number
 *           minimum: 0
 *           example: 50000
 *         address:
 *           $ref: '#/components/schemas/AddressSchema'
 *         department:
 *           type: string
 *           example: "Science"
 *         designation:
 *           type: string
 *           example: "Senior Teacher"
 *
 *     UpdateTeacherProfileDTO:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - phone
 *         - status
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *           minLength: 6
 *         profileImage:
 *           type: string
 *           format: uri
 *         employeeId:
 *           type: string
 *         qualification:
 *           type: string
 *         experienceYears:
 *           type: integer
 *           minimum: 0
 *         joiningDate:
 *           type: string
 *           format: date
 *         salary:
 *           type: number
 *           minimum: 0
 *         address:
 *           $ref: '#/components/schemas/AddressOptionalSchema'
 *         department:
 *           type: string
 *         designation:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED, DELETED]
 *           example: "ACTIVE"
 *
 *     UpdateTeacherSelfProfileDTO:
 *       type: object
 *       properties:
 *         phone:
 *           type: string
 *         profileImage:
 *           type: string
 *           format: uri
 *         address:
 *           $ref: '#/components/schemas/AddressOptionalSchema'
 *         qualification:
 *           type: string
 *         experienceYears:
 *           type: integer
 *           minimum: 0
 */

const addressSchema = Joi.object({
    country: Joi.string().default("Nepal"),
    province: Joi.string().required(),
    district: Joi.string().required(),
    fullAddress: Joi.string().required(),
})

const addressOptionalSchema = Joi.object({
    country: Joi.string().default("Nepal"),
    province: Joi.string().optional(),
    district: Joi.string().optional(),
    fullAddress: Joi.string().optional(),
})

// ---------------------------------------------------------------------------
// Create teacher profile (admin / principal)
// ---------------------------------------------------------------------------
const createTeacherProfileDTO = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(6).required(),   // FIX: added .min(6) for consistency
    profileImage: Joi.string().uri().optional(),
    employeeId: Joi.string().optional(),
    qualification: Joi.string().optional(),
    experienceYears: Joi.number().integer().min(0).optional(),
    joiningDate: Joi.date().required(),
    salary: Joi.number().min(0).optional(),
    address: addressSchema.required(),
    department: Joi.string().optional(),
    designation: Joi.string().optional(),
})

// ---------------------------------------------------------------------------
// Admin / principal updates a teacher — status field was missing!
// ---------------------------------------------------------------------------
const updateTeacherProfileDTO = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(6).optional(),   // optional — only update if provided
    profileImage: Joi.string().uri().optional(),
    employeeId: Joi.string().optional(),
    qualification: Joi.string().optional(),
    experienceYears: Joi.number().integer().min(0).optional(),
    joiningDate: Joi.date().optional(),
    salary: Joi.number().min(0).optional(),
    address: addressOptionalSchema.optional(),
    department: Joi.string().optional(),
    designation: Joi.string().optional(),
    status: Joi.string().valid(...Object.values(Status)).required(), // FIX: was missing
})

// ---------------------------------------------------------------------------
// Teacher updates own profile — limited fields only
// ---------------------------------------------------------------------------
const updateTeacherSelfProfileDTO = Joi.object({
    phone: Joi.string().optional(),
    profileImage: Joi.string().uri().optional(),
    address: addressOptionalSchema.optional(),
    qualification: Joi.string().optional(),
    experienceYears: Joi.number().integer().min(0).optional(),
})

module.exports = {
    createTeacherProfileDTO,
    updateTeacherProfileDTO,
    updateTeacherSelfProfileDTO,
}