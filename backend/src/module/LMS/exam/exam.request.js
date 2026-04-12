const Joi = require("joi");
const { ExamStatus, ExamType, ExamSubmissionStatus } = require("../../../config/constant.config");

// ─── Shared Base Variables ──────────────────────────────────────────────────
const uuidBase = Joi.string().uuid();
const stringMax255 = Joi.string().max(255);
const stringMax5000 = Joi.string().max(5000).allow(null, "");
const numericLimit = Joi.number().min(0).max(1000);

// ─── Create Exam (Teacher/Admin) ───────────────────────────────────────────
const examDTO = Joi.object({
  academicYearId: uuidBase.required(),
  classId: uuidBase.required(),
  sectionId: uuidBase.allow(null, "").optional(),
  subjectId: uuidBase.required(),
  chapterId: uuidBase.allow(null, "").optional(),
  
  // Handled inherently by Auth Middleware, but optional for Admin overriding
  teacherId: uuidBase.optional(), 
  
  title: stringMax255.required(),
  description: stringMax5000.optional(),
  instructions: stringMax5000.optional(),
  
  // Note: Schema uses `examCategory` but constant uses `ExamType`
  examCategory: Joi.string()
    .valid(...Object.values(ExamType))
    .required(),
    
  totalMarks: numericLimit.required(),
  passMarks: numericLimit.allow(null).optional(),

  examDate: Joi.date().iso().allow(null, "").optional(),
  startAt: Joi.date().iso().allow(null, "").optional(),
  endAt: Joi.date().iso().min(Joi.ref('startAt')).allow(null, "").optional(),

  questionText: stringMax5000.optional(),
  externalQuestionFileUrl: Joi.string().uri().allow(null, "").optional(),
  
  status: Joi.string()
    .valid(...Object.values(ExamStatus))
    .default(ExamStatus.DRAFT),
    
  isPublished: Joi.boolean().default(false),
  resultPublished: Joi.boolean().default(false),
});

// ─── Update Exam (Teacher/Admin) ───────────────────────────────────────────
const updateExamDTO = Joi.object({
  academicYearId: uuidBase.optional(),
  classId: uuidBase.optional(),
  sectionId: uuidBase.allow(null, "").optional(),
  subjectId: uuidBase.optional(),
  chapterId: uuidBase.allow(null, "").optional(),
  teacherId: uuidBase.optional(), 
  
  title: stringMax255.optional(),
  description: stringMax5000.optional(),
  instructions: stringMax5000.optional(),
  
  examCategory: Joi.string()
    .valid(...Object.values(ExamType))
    .optional(),
    
  totalMarks: numericLimit.optional(),
  passMarks: numericLimit.allow(null).optional(),

  examDate: Joi.date().iso().allow(null, "").optional(),
  startAt: Joi.date().iso().allow(null, "").optional(),
  endAt: Joi.date().iso().min(Joi.ref('startAt')).allow(null, "").optional(),

  questionText: stringMax5000.optional(),
  externalQuestionFileUrl: Joi.string().uri().allow(null, "").optional(),
  
  status: Joi.string()
    .valid(...Object.values(ExamStatus))
    .optional(),
    
  isPublished: Joi.boolean().optional(),
  resultPublished: Joi.boolean().optional(),
}).min(1);

// ─── Student Submit Exam ───────────────────────────────────────────────────
const submitExamDTO = Joi.object({
  externalAnswerFileUrl: Joi.string().uri().allow(null, "").optional(),
  // files (answerFileKeys) will be added automatically by `uploadMixed` middleware
});

// ─── Teacher Review/Grade Exam ─────────────────────────────────────────────
const reviewExamSubmissionDTO = Joi.object({
  status: Joi.string()
    .valid(ExamSubmissionStatus.REVIEWED)
    .required(),
  marksObtained: numericLimit.allow(null).optional(),
  feedback: stringMax5000.optional()
});

module.exports = { 
  examDTO, 
  updateExamDTO, 
  submitExamDTO, 
  reviewExamSubmissionDTO 
};