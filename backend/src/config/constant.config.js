const Role = {
  SUPER_ADMIN: "super_admin",
  PRINCIPAL: "principal",
  ADMIN_STAFF: "admin_staff",
  ACCOUNTANT: "accountant",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
};
const SchoolStatus = {
  NEW_REGISTRATION: "new_registration",
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  CLOSURE_REQUESTED: "closure_requested",
  CLOSED: "closed",
};
const SchoolType = {
  PUBLIC: "public",
  PRIVATE: "private",
};
const EducationLevel = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  HIGHERSECONDARY: "higher_secondary",
  COLLEGE: "college",
  UNIVERSITY: "university",
};
const Status = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};
const RelationType = {
  MOTHER: "mother",
  FATHER: "father",
  GUARDIAN: "guardian",
};
const Gender = {
    MALE:"male",
    FEMALE:"female",
    OTHER:"other"
}
const AcademicStatus={
    ACTIVE:"active",
    INACTIVE:"inactive",
    PENDING:"pending",
    GRADUATED:"graduated",
    DROPPED:"dropped",
    TRANSFERRED:"transferred",
    MIGRATION:"migration"
}
const FileFilterType = {
  IMAGE: "image",
  VIDEO: "video",
  DOCUMENT: "doc",
  AUDIO: "audio",
};
const AttendanceStatus = {
  PRESENT: "present",
  ABSENT: "absent",
  LEAVE: "leave",
  LATE: "late",
};
const DayOfWeek = {
  SUNDAY: "sunday",
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
};
const ReminderType = {
  FIRST_NOTICE: "first_notice",
  SECOND_NOTICE: "second_notice",
  FINAL_NOTICE: "final_notice",
};
const FeeStatus = {
  PENDING: "pending",
  PARTIAL: "partial",
  PAID: "paid",
  OVERDUE: "overdue",
  PARTIAL_OVERDUE: "partial_overdue",
  WAIVED: "waived",
};
const FeeFrequency = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  HALF_YEARLY: "half_yearly",
  YEARLY: "yearly",
  ONE_TIME: "one_time",
};
const DiscountType = {
  FIXED: "fixed",
  PERCENTAGE: "percentage",
};

const PaymentMethod = {
  CASH: "cash",
  FONE_PAY: "fone_pay",
  CHECK: "check",
  BANK_TRANSFER: "bank_transfer",
  ESEWA: "esewa",
  KHALTI: "khalti",
  CARD: "card",
};
const ClassMode = {
  OFFLINE: "offline",
  ONLINE: "online",
};
const LMSPublishStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
};

const LMSResourceType = {
  VIDEO: "video",
  PDF: "pdf",
  NOTE: "note",
  ATTACHMENT: "attachment",
  LINK: "link",
};

const AssignmentSubmissionType = {
  TEXT: "text",
  FILE: "file",
  TEXT_FILE: "text_file",
  LINK: "link",
};

const AssignmentStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CLOSED: "closed",
  ARCHIVED: "archived",
};

const SubmissionStatus = {
  SUBMITTED: "submitted",
  RESUBMITTED: "resubmitted",
  REVIEWED: "reviewed",
  GRADED: "graded",
  LATE: "late",
};

const LiveClassStatus = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const ExamStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CLOSED: "closed",
  EVALUATED: "evaluated",
  ARCHIVED: "archived",
};
const ExamType = {
  FORMATIVE: "formative",
  SUMMATIVE: "summative",
  TERMINAL: "terminal",
};
const ExamSubmissionStatus = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  LATE: "late",
  REVIEWED: "reviewed",
};

const DiscussionTargetType = {
  CHAPTER: "chapter",
  ASSIGNMENT: "assignment",
  LIVE_CLASS: "live_class",
  EXAM: "exam",
  GENERAL: "general",
};

const LiveClassType = {
  REGULAR: "regular",
  EXTRA: "extra",
};

module.exports = {
    Role,
    SchoolStatus,
    SchoolType,
    EducationLevel,
    Status,
    RelationType,
    Gender,
    AcademicStatus,
    FileFilterType,
    ReminderType,
    FeeStatus,
    FeeFrequency,
    PaymentMethod,
    AttendanceStatus,
    DayOfWeek,
    ClassMode,
    DiscountType,
    LMSPublishStatus,
    LMSResourceType,
    AssignmentSubmissionType,
    AssignmentStatus,
    SubmissionStatus,
    LiveClassStatus,
    ExamStatus,
    ExamType,
    ExamSubmissionStatus,
    DiscussionTargetType,
    LiveClassType
}