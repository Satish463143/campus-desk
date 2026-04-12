const Joi = require("joi")
const { Gender, AcademicStatus, RelationType, Status } = require("../../config/constant.config")

// ---------------------------------------------------------------------------
// Simple address schema (used by createStudentDTO and self-update)
// ---------------------------------------------------------------------------
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
// Extended address schema — used by updateStudentDTO (admission-form payload)
// Includes all municipality, ward, tole, houseNo, postCode and temp* fields
// ---------------------------------------------------------------------------
const addressExtendedSchema = Joi.object({
    country: Joi.string().allow(null, "").optional(),
    province: Joi.string().allow(null, "").optional(),
    district: Joi.string().allow(null, "").optional(),
    fullAddress: Joi.string().allow(null, "").optional(),
    municipality: Joi.string().allow(null, "").optional(),
    wardNo: Joi.string().allow(null, "").optional(),
    tole: Joi.string().allow(null, "").optional(),
    houseNo: Joi.string().allow(null, "").optional(),
    postCode: Joi.string().allow(null, "").optional(),
    isTemporarySame: Joi.boolean().optional(),
    tempCountry: Joi.string().allow(null, "").optional(),
    tempProvince: Joi.string().allow(null, "").optional(),
    tempDistrict: Joi.string().allow(null, "").optional(),
    tempMunicipality: Joi.string().allow(null, "").optional(),
    tempWardNo: Joi.string().allow(null, "").optional(),
    tempTole: Joi.string().allow(null, "").optional(),
    tempHouseNo: Joi.string().allow(null, "").optional(),
    tempPostCode: Joi.string().allow(null, "").optional(),
}).unknown(true)

// ---------------------------------------------------------------------------
// Parent sub-schema for updateStudentDTO
// ---------------------------------------------------------------------------
const parentUpdateSchema = Joi.object({
    name: Joi.string().allow(null, "").optional(),
    email: Joi.string().email({ tlds: { allow: false } }).allow(null, "").optional(),
    phone: Joi.string().allow(null, "").optional(),
    phoneCode: Joi.string().allow(null, "").optional(),
    qualification: Joi.string().allow(null, "").optional(),
    occupation: Joi.string().allow(null, "").optional(),
    occupationOther: Joi.string().allow(null, "").optional(),
    organisation: Joi.string().allow(null, "").optional(),
    telRes: Joi.string().allow(null, "").optional(),
    telOff: Joi.string().allow(null, "").optional(),
    relation: Joi.string().allow(null, "").optional(),
    parentId: Joi.string().allow(null, "").optional(),
}).unknown(true)

// ---------------------------------------------------------------------------
// studentInfo sub-schema for updateStudentDTO
// ---------------------------------------------------------------------------
const studentInfoUpdateSchema = Joi.object({
    studentId: Joi.string().allow(null, "").optional(),
    nameAtHome: Joi.string().allow(null, "").optional(),
    nationality: Joi.string().allow(null, "").optional(),
    religion: Joi.string().allow(null, "").optional(),
    timeBatch: Joi.string().allow(null, "").optional(),
    languageAtHome: Joi.string().allow(null, "").optional(),
    languageOther: Joi.string().allow(null, "").optional(),
    academicStatus: Joi.string().allow(null, "").optional(),
    inactiveDate: Joi.date().optional().allow(null, ""),
    academicYearId: Joi.string().allow(null, "").optional(),
    documents: Joi.object().optional().allow(null),
}).unknown(true)

// ---------------------------------------------------------------------------
// Create: student + parent
// ---------------------------------------------------------------------------
const createStudentDTO = Joi.object({
    student: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        phone: Joi.string().required(),
        class: Joi.string().required(),
        section: Joi.string().optional(),
        admissionNumber: Joi.string().optional(),
        dateOfBirth: Joi.date().optional(),
        gender: Joi.string().valid(...Object.values(Gender)).required(),
        bloodGroup: Joi.string().optional(),
        academicStatus: Joi.string().valid(...Object.values(AcademicStatus)).required(),
        address: addressSchema.required(),
        profileImage: Joi.string().uri().optional(),
    }).required(),

    parent: Joi.object({
        existingParentId: Joi.string().uuid().optional(),
        name: Joi.string().when("existingParentId", {
            is: Joi.exist(),
            then: Joi.optional(),
            otherwise: Joi.required(),
        }),
        email: Joi.string().email().when("existingParentId", {
            is: Joi.exist(),
            then: Joi.optional(),
            otherwise: Joi.required(),
        }),
        password: Joi.string().min(6).when("existingParentId", {
            is: Joi.exist(),
            then: Joi.optional(),
            otherwise: Joi.required(),
        }),
        phone: Joi.string().when("existingParentId", {
            is: Joi.exist(),
            then: Joi.optional(),
            otherwise: Joi.required(),
        }),
        relationType: Joi.string().valid(...Object.values(RelationType)).required(),
        address: addressOptionalSchema.optional(),
    }).required(),
})

// ---------------------------------------------------------------------------
// Update: admin / principal updates any student via the admission form
// Accepts all admission-style fields (firstName/surname, className, studentInfo,
// father, mother, guardian, familyInfo, background, fees, declarationSigned)
// as well as the original simple fields for backwards compatibility.
// ---------------------------------------------------------------------------
const updateStudentDTO = Joi.object({
    // ── Simple / original fields ──────────────────────────────────────────
    name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    phone: Joi.string().optional(),
    class: Joi.string().optional(),
    section: Joi.string().optional(),
    admissionNumber: Joi.string().allow(null, "").optional(),
    appNo: Joi.string().allow(null, "").optional(),
    dateOfBirth: Joi.date().optional().allow(null, ""),
    dateOfAdmission: Joi.date().optional().allow(null, ""),
    gender: Joi.string().valid(...Object.values(Gender)).optional(),
    bloodGroup: Joi.string().allow(null, "").optional(),
    academicStatus: Joi.string().valid(...Object.values(AcademicStatus)).optional(),
    profileImage: Joi.string().uri().optional(),
    // status accepts both account Status AND AcademicStatus values
    status: Joi.string()
        .valid(...Object.values(Status), ...Object.values(AcademicStatus))
        .optional(),

    // ── Admission-form fields ─────────────────────────────────────────────
    firstName: Joi.string().optional(),
    surname: Joi.string().optional(),
    className: Joi.string().allow(null, "").optional(),

    // Extended address with all municipality/tole/temp* fields
    address: addressExtendedSchema.optional(),

    // Student info JSON block
    studentInfo: studentInfoUpdateSchema.optional().allow(null),

    // Parent JSON blocks
    father: parentUpdateSchema.optional().allow(null),
    mother: parentUpdateSchema.optional().allow(null),
    guardian: parentUpdateSchema.optional().allow(null),

    // Family info
    familyInfo: Joi.object({
        maritalStatus: Joi.string().allow(null, "").optional(),
        custodyHolder: Joi.string().allow(null, "").optional(),
        emergencyContact: Joi.string()
            .valid("father", "mother", "guardian")
            .optional(),
    }).unknown(true).optional().allow(null),

    // Background / medical
    background: Joi.object().optional().allow(null),

    // Fees
    fees: Joi.object().optional().allow(null),

    // Declaration
    declarationSigned: Joi.boolean().optional(),

    // Existing parent link
    skipParentPhoneCheck: Joi.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Self-update: student updates only their own editable fields
// ---------------------------------------------------------------------------
const updateStudentSelfDTO = Joi.object({
    email: Joi.string().email().required(),
    bloodGroup: Joi.string().optional(),
    address: addressSchema.required(),
    profileImage: Joi.string().uri().optional(),
})

module.exports = { createStudentDTO, updateStudentDTO, updateStudentSelfDTO }