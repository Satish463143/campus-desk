const Joi = require("joi")
const { Status, RelationType } = require("../../config/constant.config")

// Shared address schemas — same structure as Student/Teacher modules
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
// Admin / principal updates a parent
// ---------------------------------------------------------------------------
const updateParentDTO = Joi.object({
    name: Joi.string().trim().required(),
    email: Joi.string().trim().email().required(),
    phone: Joi.string().trim().required(),
    password: Joi.string().min(6).optional(),
    profileImage: Joi.string().uri().optional(),
    address: addressSchema.required(),
    occupation: Joi.string().trim().optional(),
    relationType: Joi.string().valid(...Object.values(RelationType)).required(),
    emergencyContact: Joi.string().trim().optional(),
    status: Joi.string().valid(...Object.values(Status)).required(),
})

// ---------------------------------------------------------------------------
// Parent updates own profile — limited editable fields only
// ---------------------------------------------------------------------------
const updateParentSelfDTO = Joi.object({
    profileImage: Joi.string().uri().optional(),
    address: addressOptionalSchema.optional(),
    occupation: Joi.string().trim().optional(),
    emergencyContact: Joi.string().trim().optional(),
})

module.exports = { updateParentSelfDTO, updateParentDTO }
