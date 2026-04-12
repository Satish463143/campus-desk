const Joi = require("joi");
const { AssignmentStatus, AssignmentSubmissionType, SubmissionStatus } = require("../../../config/constant.config");

// ─── Shared Base Variables ──────────────────────────────────────────────────
const uuidBase = Joi.string().uuid();
const stringMax255 = Joi.string().max(255);
const stringMax2000 = Joi.string().max(2000).allow(null, "");
const numericLimit = Joi.number().min(0);

// ─── Create Assignment ─────────────────────────────────────────────────────
const assignmentDTO = Joi.object({
  academicYearId: uuidBase.required(),
  classId: uuidBase.required(),
  sectionId: uuidBase.allow(null, "").optional(),
  chapterId: uuidBase.allow(null, "").optional(),
  subjectId: uuidBase.required(),
  
  // Teacher is derived from auth/session but can be explicit for admin
  teacherId: uuidBase.optional(), 

  title: stringMax255.required(),
  description: stringMax2000.optional(),
  instructions: stringMax2000.optional(),
  totalMarks: numericLimit.allow(null).optional(),
  dueDate: Joi.date().iso().required(),
  allowLateSubmission: Joi.boolean().default(false),
  
  submissionType: Joi.string()
    .valid(...Object.values(AssignmentSubmissionType))
    .required(),

  publishStatus: Joi.string()
    .valid(...Object.values(AssignmentStatus))
    .default(AssignmentStatus.DRAFT),

  // populated by S3 upload middleware
  attachmentKeys: Joi.array().items(Joi.string().uri()).max(5).optional(),
  externalAttachmentUrl: Joi.string().uri().allow(null, "").optional(),
});

// ─── Update Assignment ─────────────────────────────────────────────────────
const updateAssignmentDTO = Joi.object({
  title: stringMax255.optional(),
  description: stringMax2000.optional(),
  instructions: stringMax2000.optional(),
  totalMarks: numericLimit.allow(null).optional(),
  dueDate: Joi.date().iso().optional(),
  allowLateSubmission: Joi.boolean().optional(),
  
  submissionType: Joi.string()
    .valid(...Object.values(AssignmentSubmissionType))
    .optional(),

  publishStatus: Joi.string()
    .valid(...Object.values(AssignmentStatus))
    .optional(),

  attachmentKeys: Joi.array().items(Joi.string().uri()).max(5).optional(),
  externalAttachmentUrl: Joi.string().uri().allow(null, "").optional(),
}).min(1);

// ─── Student Submission Request ────────────────────────────────────────────
const submitAssignmentDTO = Joi.object({
  // populated by S3 upload middleware if file is uploaded
  submissionKeys: Joi.array().items(Joi.string().uri()).max(5).optional(),
  externalSubmissionLink: Joi.string().uri().allow(null, "").optional(),
}).min(1);

// ─── Teacher Review/Grade Request ──────────────────────────────────────────
const reviewSubmissionDTO = Joi.object({
  status: Joi.string()
    .valid(SubmissionStatus.REVIEWED, SubmissionStatus.GRADED)
    .required(),
  marksObtained: numericLimit.allow(null).optional(),
  feedback: stringMax2000.optional()
});

module.exports = { 
  assignmentDTO, 
  updateAssignmentDTO,
  submitAssignmentDTO,
  reviewSubmissionDTO
};