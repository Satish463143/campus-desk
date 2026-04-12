const Joi = require("joi");
const { AttendanceStatus } = require("../../config/constant.config");

// Only non-present statuses are stored. Present is the DEFAULT (implied if not in list).
const STATUS_VALUES_WITHOUT_PRESENT = Object.values(AttendanceStatus).filter(
  (s) => s !== AttendanceStatus.PRESENT
);

const attendanceItemSchema = Joi.object({
  studentId: Joi.string().uuid().required(),
  // Frontend sends absent/late/leave only — present is implied for everyone else
  status: Joi.string().valid(...STATUS_VALUES_WITHOUT_PRESENT).required(),
  remark: Joi.string().trim().allow("", null).optional(),
});

const markPeriodAttendanceDTO = Joi.object({
  sectionId: Joi.string().uuid().required(),
  classId: Joi.string().uuid().required(),
  academicYearId: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  periodId: Joi.string().uuid().required(),
  teacherId: Joi.string().uuid().required(),
  // Teacher GPS location (required for geo-fence check on offline classes)
  teacherLatitude: Joi.number().min(-90).max(90).optional().allow(null),
  teacherLongitude: Joi.number().min(-180).max(180).optional().allow(null),
  // Only submit students who are NOT present (absent, late, leave)
  attendance: Joi.array()
    .items(attendanceItemSchema)
    .min(0)
    .unique((a, b) => a.studentId === b.studentId)
    .required(),
}).options({ stripUnknown: true });

const updatePeriodAttendanceDTO = Joi.object({
  status: Joi.string().valid(...Object.values(AttendanceStatus)).optional(),
  remark: Joi.string().trim().allow("", null).optional(),
})
  .min(1)
  .options({ stripUnknown: true });

const markTeacherAttendanceDTO = Joi.object({
  teacherId: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  status: Joi.string().valid(...Object.values(AttendanceStatus)).required(),
  remark: Joi.string().trim().allow("", null).optional(),
  checkInTime: Joi.date().iso().optional().allow(null),
  checkOutTime: Joi.date().iso().optional().allow(null),
}).options({ stripUnknown: true });

module.exports = {
  markPeriodAttendanceDTO,
  updatePeriodAttendanceDTO,
  markTeacherAttendanceDTO,
};