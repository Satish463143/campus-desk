const Joi = require("joi")
const { Gender } = require("../../config/constant.config")

const addressSchema = Joi.object({
    country: Joi.string().allow(null, ""),
    province: Joi.string().allow(null, ""),
    district: Joi.string().allow(null, ""),
    municipality: Joi.string().allow(null, ""),
    wardNo: Joi.string().allow(null, ""),
    tole: Joi.string().allow(null, ""),
    houseNo: Joi.string().allow(null, ""),
    postCode: Joi.string().allow(null, ""),
    fullAddress: Joi.string().allow(null, ""),
    isTemporarySame: Joi.boolean().optional(),
    tempCountry: Joi.string().allow(null, ""),
    tempProvince: Joi.string().allow(null, ""),
    tempDistrict: Joi.string().allow(null, ""),
    tempMunicipality: Joi.string().allow(null, ""),
    tempWardNo: Joi.string().allow(null, ""),
    tempTole: Joi.string().allow(null, ""),
    tempHouseNo: Joi.string().allow(null, ""),
    tempPostCode: Joi.string().allow(null, ""),
}).unknown(true)

const parentSchema = Joi.object({
    name: Joi.string().allow(null, ""),
    email: Joi.string().email({ tlds: { allow: false } }).allow(null, ""),
    phone: Joi.string().allow(null, ""),
    phoneCode: Joi.string().allow(null, ""),
    qualification: Joi.string().allow(null, ""),
    occupation: Joi.string().allow(null, ""),
    occupationOther: Joi.string().allow(null, ""),
    organisation: Joi.string().allow(null, ""),
    telRes: Joi.string().allow(null, ""),
    telOff: Joi.string().allow(null, ""),
    relation: Joi.string().allow(null, ""),
}).unknown(true)

const createPublicAdmissionDTO = Joi.object({
    firstName: Joi.string().required(),
    surname: Joi.string().required(),
    email: Joi.string().email({ tlds: { allow: false } }).optional().allow(null, ""),
    phone: Joi.string().optional().allow(null, ""),
    gender: Joi.string().valid(...Object.values(Gender)).optional().allow(null, ""),
    dateOfBirth: Joi.date().optional().allow(null, ""),
    bloodGroup: Joi.string().optional().allow(null, ""),
    className: Joi.string().optional().allow(null, ""),
    address: addressSchema.optional().allow(null),
    studentInfo: Joi.object().optional().allow(null),
    father: parentSchema.optional().allow(null),
    mother: parentSchema.optional().allow(null),
    guardian: parentSchema.optional().allow(null),
    familyInfo: Joi.object().optional().allow(null),
    background: Joi.object().optional().allow(null),
    fees: Joi.object().optional().allow(null),
    declarationSigned: Joi.boolean().optional(),
})

module.exports = { createPublicAdmissionDTO }
