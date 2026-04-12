const Joi = require("joi");
const {
  FeeFrequency,
  PaymentMethod,
  ReminderType,
  DiscountType
} = require("../../config/constant.config");

const uuid = Joi.string().uuid();

const FEE_CATEGORY_SCOPES = ["school", "class", "optional"];

const createFeeCategoryDTO = Joi.object({
  name: Joi.string().trim().max(50).required(),
  code: Joi.string().trim().uppercase().max(20).required(),
  scope: Joi.string().valid(...FEE_CATEGORY_SCOPES).default("school"),
  description: Joi.string().trim().max(255).allow("", null).optional()
}).options({ stripUnknown: true });

const updateFeeCategoryDTO = Joi.object({
  name: Joi.string().trim().max(50).optional(),
  code: Joi.string().trim().uppercase().max(20).optional(),
  scope: Joi.string().valid(...FEE_CATEGORY_SCOPES).optional(),
  description: Joi.string().trim().max(255).allow("", null).optional()
}).options({ stripUnknown: true });

const createFeeStructureDTO = Joi.object({
  classId: uuid.required(),
  academicYearId: uuid.required(),
  feeCategoryId: uuid.required(),
  amount: Joi.number().positive().required(),
  frequency: Joi.string().valid(...Object.values(FeeFrequency)).required(),
  allowPartialPayment: Joi.boolean().optional(),
  isOptional: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
}).options({ stripUnknown: true });

const updateFeeStructureDTO = Joi.object({
  classId: uuid.allow(null).optional(),
  academicYearId: uuid.allow(null).optional(),
  feeCategoryId: uuid.allow(null).optional(),
  amount: Joi.number().positive().optional(),
  frequency: Joi.string().valid(...Object.values(FeeFrequency)).optional(),
  allowPartialPayment: Joi.boolean().optional(),
  isOptional: Joi.boolean().optional(),
  isActive: Joi.boolean().optional()
}).options({ stripUnknown: true });

const assignStudentFeeDTO = Joi.object({
  studentId: uuid.required(),
  feeStructureId: uuid.required(),
  dueDate: Joi.date().iso().required(),
  amount: Joi.number().positive().optional(),
  periodLabel: Joi.string().trim().max(100).allow("", null).optional(),
  periodStart: Joi.date().iso().allow(null).optional(),
  periodEnd: Joi.date().iso().allow(null).optional()
}).options({ stripUnknown: true });

const upsertScholarshipDTO = Joi.object({
  studentId: uuid.required(),
  feeCategoryId: uuid.allow(null).optional(),
  type: Joi.string().valid(...Object.values(DiscountType)).required(),
  value: Joi.number().positive().required(),
  reason: Joi.string().trim().max(255).allow("", null).optional(),
  referredBy: Joi.string().trim().max(150).allow("", null).optional(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  isActive: Joi.boolean().optional()
}).options({ stripUnknown: true });

const recordPaymentDTO = Joi.object({
  studentId: uuid.required(),
  totalAmount: Joi.number().positive().required(),
  paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).required(),
  transactionId: Joi.string().trim().max(100).allow("", null).optional(),
  receivedBy: Joi.string().trim().max(100).allow("", null).optional(),
  note: Joi.string().trim().max(255).allow("", null).optional(),
  allocations: Joi.array().items(
    Joi.object({
      studentFeeId: uuid.required(),
      amount: Joi.number().positive().required()
    })
  ).optional()
}).options({ stripUnknown: true });

const scheduleReminderDTO = Joi.object({
  studentFeeId: uuid.required(),
  reminderDate: Joi.date().iso().required(),
  reminderType: Joi.string().valid(...Object.values(ReminderType)).required()
}).options({ stripUnknown: true });

const feeSettingDTO = Joi.object({
  graceDays: Joi.number().integer().min(0).max(90).required(),
  reminderEnabled: Joi.boolean().required(),
  showOverdueFeeTab: Joi.boolean().optional(),
  defaultDueDays: Joi.number().integer().min(1).max(365).optional(),
  scholarshipCategories: Joi.array().items(Joi.string().trim().max(100)).optional(),
  minPaymentAmount: Joi.number().min(0).optional()
}).options({ stripUnknown: true });

const extendFeeDTO = Joi.object({
  days: Joi.number().integer().min(1).max(90).required()
}).options({ stripUnknown: true });

const updateStudentFeeDTO = Joi.object({
  dueDate: Joi.date().iso().optional(),
  amount: Joi.number().positive().optional(),
  periodLabel: Joi.string().trim().max(100).allow("", null).optional(),
  periodStart: Joi.date().iso().allow(null).optional(),
  periodEnd: Joi.date().iso().allow(null).optional()
}).options({ stripUnknown: true });

const bulkAssignStudentFeeDTO = Joi.object({
  classId: uuid.required(),
  feeStructureIds: Joi.array().items(uuid).min(1).required(),
  dueDate: Joi.date().iso().required(),
  periodLabel: Joi.string().trim().max(100).allow("", null).optional()
}).options({ stripUnknown: true });

module.exports = {
  createFeeCategoryDTO,
  updateFeeCategoryDTO,
  updateFeeStructureDTO,
  createFeeStructureDTO,
  assignStudentFeeDTO,
  bulkAssignStudentFeeDTO,
  upsertScholarshipDTO,
  recordPaymentDTO,
  scheduleReminderDTO,
  feeSettingDTO,
  extendFeeDTO,
  updateStudentFeeDTO
};