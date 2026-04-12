const Joi = require("joi");
const { SchoolStatus, SchoolType,EducationLevel } = require("../../config/constant.config");

const schoolRegisterDTO = Joi.object({
    schoolName: Joi.string().required().trim(),
    password: Joi.string().min(6).required(),
    principal: Joi.object({
        name: Joi.string().required().trim(),
        email:Joi.string().email().required().lowercase().trim(),
        phone:Joi.string().required(),
    }).required(),
    address: Joi.object({
        country: Joi.string().default("Nepal"),
        province: Joi.string().required(),
        district: Joi.string().required(),
        fullAddress: Joi.string().required(),
    }).required(),
})

const updateSchoolProfileDTO = Joi.object({
    //required field
    schoolName: Joi.string().required().trim(),
    schoolEmail: Joi.string().lowercase().trim().optional(),
    schoolPhone: Joi.string().optional(),
    address: Joi.object({
        country: Joi.string().default("Nepal"),
        province: Joi.string().optional(),
        district: Joi.string().optional(),
        fullAddress: Joi.string().optional(),
    }).optional(),

    //optionla filed
    // schoolCode: Joi.string().optional(),
    alternatePhone: Joi.string().optional(),
    schoolWebsite: Joi.string().optional(),
    logo: Joi.string().optional(),
    coverImage: Joi.string().optional(),
    branding: Joi.object({
        motto: Joi.string(),
        description: Joi.string(),
    }).optional(),
    establishedYear: Joi.number().optional(),
    longitude: Joi.number().optional(),
    latitude: Joi.number().optional(),
    allowedRadius: Joi.number().optional(),
    panNumber: Joi.string().optional(),
    registrationNumber: Joi.string().optional(),
    schoolStatus: Joi.string().valid(SchoolStatus.ACTIVE, SchoolStatus.INACTIVE, SchoolStatus.CLOSURE_REQUESTED).optional(),
    schoolType: Joi.string().valid(...Object.values(SchoolType)).optional(),
    educationLevel: Joi.string().valid(...Object.values(EducationLevel)).optional(),
})

const updateSchoolStatusDTO = Joi.object({
    schoolStatus: Joi.string().valid(SchoolStatus.ACTIVE, SchoolStatus.INACTIVE, SchoolStatus.SUSPENDED, SchoolStatus.CLOSED).required(),
})

module.exports = {
    schoolRegisterDTO,
    updateSchoolProfileDTO,
    updateSchoolStatusDTO
}