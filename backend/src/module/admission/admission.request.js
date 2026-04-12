const Joi = require("joi");
const { Gender, AcademicStatus } = require("../../config/constant.config");

const customAgeValidator = (obj, helpers) => {
  if (obj.dateOfAdmission && obj.dateOfBirth) {
    const admDate = new Date(obj.dateOfAdmission);
    const dob = new Date(obj.dateOfBirth);
    const ageInMs = admDate.getTime() - dob.getTime();
    const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
    if (ageInYears < 3) {
      return helpers.message("Student must be at least 3 years old on the date of admission");
    }
  }
  return obj;
};

const customEmergencyContactValidator = (obj, helpers) => {
  if (obj.familyInfo && obj.familyInfo.emergencyContact) {
    const target = obj[obj.familyInfo.emergencyContact];
    if (!target || !target.name || !target.phone) {
      return helpers.message(`Emergency contact (${obj.familyInfo.emergencyContact}) must have a name and phone number`);
    }
  }
  return obj;
};

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
}).unknown(true);

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
  parentId: Joi.string().allow(null, ""),
}).unknown(true);

const familyInfoSchema = Joi.object({
  maritalStatus: Joi.string().allow(null, ""),
  custodyHolder: Joi.string().allow(null, ""),
  emergencyContact: Joi.string().valid("father", "mother", "guardian").optional().allow(null, ""),
}).unknown(true);

const studentInfoSchema = Joi.object({
  studentId: Joi.string().allow(null, ""),
  nameAtHome: Joi.string().allow(null, ""),
  nationality: Joi.string().allow(null, ""),
  religion: Joi.string().allow(null, ""),
  timeBatch: Joi.string().allow(null, ""),
  languageAtHome: Joi.string().allow(null, ""),
  languageOther: Joi.string().allow(null, ""),
  academicStatus: Joi.string().allow(null, ""),
  inactiveDate: Joi.date().optional().allow(null, ""),
  academicYearId: Joi.string().allow(null, ""),
  documents: Joi.object().allow(null),
}).unknown(true);

const createAdmissionDTO = Joi.object({
  firstName: Joi.string().required(),
  surname: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  gender: Joi.string().valid(...Object.values(Gender)).required(),
  dateOfBirth: Joi.date().optional().allow(null, ""),
  bloodGroup: Joi.string().optional().allow(null, ""),
  admissionNumber: Joi.string().optional().allow(null, ""),
  appNo: Joi.string().optional().allow(null, ""),
  dateOfAdmission: Joi.date().optional().allow(null, ""),
  className: Joi.string().optional().allow(null, ""),
  // ✅ IMPORTANT: academicStatus determines the academic tracking status
  // Valid values: active, graduated, dropped, transferred
  // Only 'active' students will have fees and invoices auto-generated
  academicStatus: Joi.string().valid(...Object.values(AcademicStatus)).optional().allow(null, ""),
  // status mirrors academicStatus so the service can read it from either field name
  status: Joi.string().valid(...Object.values(AcademicStatus)).optional().allow(null, ""),
  studentInfo: studentInfoSchema.optional().allow(null),
  address: addressSchema.optional().allow(null),
  father: parentSchema.optional().allow(null),
  mother: parentSchema.optional().allow(null),
  guardian: parentSchema.optional().allow(null),
  familyInfo: familyInfoSchema.optional().allow(null),
  background: Joi.object().optional().allow(null),
  fees: Joi.object().optional().allow(null),
  declarationSigned: Joi.boolean().optional(),
  skipParentPhoneCheck: Joi.boolean().optional(),
}).custom(customAgeValidator).custom(customEmergencyContactValidator);

const updateAdmissionDTO = Joi.object({
  firstName: Joi.string().optional(),
  surname: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  gender: Joi.string().valid(...Object.values(Gender)).optional(),
  dateOfBirth: Joi.date().optional().allow(null, ""),
  bloodGroup: Joi.string().optional().allow(null, ""),
  admissionNumber: Joi.string().optional().allow(null, ""),
  appNo: Joi.string().optional().allow(null, ""),
  dateOfAdmission: Joi.date().optional().allow(null, ""),
  className: Joi.string().optional().allow(null, ""),
  // ✅ IMPORTANT: academicStatus represents the academic tracking status
  // Valid values: active, graduated, dropped, transferred
  // This field preserves the actual status chosen by admin
  academicStatus: Joi.string().valid(...Object.values(AcademicStatus)).optional(),
  studentInfo: studentInfoSchema.optional().allow(null),
  address: addressSchema.optional().allow(null),
  father: parentSchema.optional().allow(null),
  mother: parentSchema.optional().allow(null),
  guardian: parentSchema.optional().allow(null),
  familyInfo: Joi.object().optional().allow(null),
  background: Joi.object().optional().allow(null),
  fees: Joi.object().optional().allow(null),
  declarationSigned: Joi.boolean().optional(),
}).custom(customAgeValidator);

module.exports = { createAdmissionDTO, updateAdmissionDTO };