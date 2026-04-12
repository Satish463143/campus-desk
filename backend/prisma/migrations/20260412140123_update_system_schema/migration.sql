-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('new_registration', 'active', 'inactive', 'closure_requested', 'closed', 'suspended');

-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('private', 'public');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('primary', 'secondary', 'higher_secondary', 'university', 'college');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('super_admin', 'principal', 'admin_staff', 'accountant', 'teacher', 'student', 'parent');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "AcademicStatus" AS ENUM ('active', 'pending', 'inactive', 'graduated', 'dropped', 'transferred', 'migration');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('mother', 'father', 'guardian');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'leave', 'late');

-- CreateEnum
CREATE TYPE "FeeFrequency" AS ENUM ('monthly', 'quarterly', 'half_yearly', 'yearly', 'one_time');

-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('pending', 'partial', 'paid', 'overdue', 'partial_overdue', 'waived');

-- CreateEnum
CREATE TYPE "FeeCategoryScope" AS ENUM ('school', 'class', 'optional');

-- CreateEnum
CREATE TYPE "FeeAssignmentType" AS ENUM ('compulsory', 'optional');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'fone_pay', 'check', 'bank_transfer', 'esewa', 'khalti', 'ime_pay', 'card');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('initiated', 'pending', 'success', 'failed', 'cancelled', 'expired', 'requires_verification');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('first_notice', 'second_notice', 'final_notice');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('fixed', 'percentage');

-- CreateEnum
CREATE TYPE "ClassMode" AS ENUM ('offline', 'online');

-- CreateEnum
CREATE TYPE "LMSPublishStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "LMSResourceType" AS ENUM ('video', 'pdf', 'note', 'attachment', 'link');

-- CreateEnum
CREATE TYPE "AssignmentSubmissionType" AS ENUM ('text', 'file', 'text_file', 'link');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('draft', 'published', 'closed', 'archived');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('submitted', 'resubmitted', 'reviewed', 'graded', 'late');

-- CreateEnum
CREATE TYPE "LiveClassStatus" AS ENUM ('scheduled', 'live', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "LiveClassType" AS ENUM ('regular', 'extra');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('draft', 'published', 'closed', 'evaluated', 'archived');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('formative', 'summative', 'terminal');

-- CreateEnum
CREATE TYPE "ExamSubmissionStatus" AS ENUM ('pending', 'submitted', 'late', 'reviewed');

-- CreateEnum
CREATE TYPE "DiscussionTargetType" AS ENUM ('chapter', 'assignment', 'live_class', 'exam', 'general');

-- CreateEnum
CREATE TYPE "PublicAdmissionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('fee_reminder', 'fee_paid', 'attendance', 'assignment', 'exam', 'announcement', 'admission', 'general');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'SENT', 'PAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('FEE_INVOICE', 'PAYMENT_RECEIPT', 'OUTSTANDING', 'BULK', 'PARTIAL_PAYMENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'PUBLISH', 'ARCHIVE', 'PAYMENT_INITIATE', 'PAYMENT_SUCCESS', 'PAYMENT_FAIL', 'FEE_ASSIGN', 'FEE_WAIVE', 'ENROLLMENT');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolCode" TEXT,
    "schoolType" "SchoolType" NOT NULL DEFAULT 'private',
    "educationLevel" "EducationLevel" NOT NULL DEFAULT 'primary',
    "schoolEmail" TEXT,
    "schoolPhone" TEXT,
    "alternatePhone" TEXT,
    "schoolWebsite" TEXT,
    "schoolStatus" "SchoolStatus" NOT NULL DEFAULT 'new_registration',
    "establishedYear" INTEGER,
    "panNumber" TEXT,
    "registrationNumber" TEXT,
    "address" JSONB NOT NULL,
    "logo" TEXT,
    "coverImage" TEXT,
    "branding" JSONB,
    "isProfileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'inactive',
    "profileImage" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "address" JSONB NOT NULL,
    "schoolId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "admissionNumber" TEXT,
    "rollNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "bloodGroup" TEXT,
    "academicStatus" "AcademicStatus" NOT NULL DEFAULT 'active',
    "appNo" TEXT,
    "dateOfAdmission" TIMESTAMP(3),
    "studentInfo" JSONB,
    "father" JSONB,
    "mother" JSONB,
    "guardian" JSONB,
    "familyInfo" JSONB,
    "background" JSONB,
    "fees" JSONB,
    "declarationSigned" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "rollNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "occupation" TEXT,
    "relationType" "RelationType",
    "emergencyContact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "employeeId" TEXT,
    "qualification" TEXT,
    "experienceYears" INTEGER,
    "joiningDate" TIMESTAMP(3),
    "salary" DECIMAL(12,2),
    "department" TEXT,
    "designation" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numericLevel" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,
    "classTeacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionSubjectTeacher" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionSubjectTeacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "classMode" "ClassMode" NOT NULL DEFAULT 'offline',
    "roomNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAttendance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "timetableId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherAttendance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeCategory" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "scope" "FeeCategoryScope" NOT NULL DEFAULT 'school',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "feeCategoryId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" "FeeFrequency" NOT NULL,
    "assignmentType" "FeeAssignmentType" NOT NULL DEFAULT 'compulsory',
    "allowPartialPayment" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeAutoLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "studentFeeId" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentFeeAutoLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFee" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "assignmentType" "FeeAssignmentType" NOT NULL DEFAULT 'compulsory',
    "assignedById" TEXT,
    "periodLabel" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "originalAmount" DECIMAL(12,2) NOT NULL,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balanceAmount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "FeeStatus" NOT NULL DEFAULT 'pending',
    "reminderDate" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentScholarship" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeCategoryId" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "referredBy" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentScholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "gatewayId" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'initiated',
    "paymentReference" TEXT NOT NULL,
    "invoiceReference" TEXT,
    "transactionId" TEXT,
    "gatewayReference" TEXT,
    "gatewayToken" TEXT,
    "invoiceId" TEXT,
    "receiptUrl" TEXT,
    "depositedBy" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "note" TEXT,
    "receivedBy" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePaymentAllocation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "studentFeeId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeePaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeSetting" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "graceDays" INTEGER NOT NULL DEFAULT 5,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showOverdueFeeTab" BOOLEAN NOT NULL DEFAULT true,
    "defaultDueDays" INTEGER NOT NULL DEFAULT 30,
    "scholarshipCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minPaymentAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "autoAssignFeesOnEnrollment" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeReminder" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "studentFeeId" TEXT NOT NULL,
    "reminderType" "ReminderType" NOT NULL,
    "reminderDate" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "type" "InvoiceType" NOT NULL,
    "paymentToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceFee" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "studentFeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolPaymentGateway" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolPaymentGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" "Role" NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "studentId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "meta" JSONB,
    "ipAddress" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicAdmission" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "bloodGroup" TEXT,
    "className" TEXT,
    "address" JSONB,
    "studentInfo" JSONB,
    "father" JSONB,
    "mother" JSONB,
    "guardian" JSONB,
    "familyInfo" JSONB,
    "background" JSONB,
    "fees" JSONB,
    "declarationSigned" BOOLEAN NOT NULL DEFAULT false,
    "status" "PublicAdmissionStatus" NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicAdmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSSyllabus" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "objectives" TEXT,
    "publishStatus" "LMSPublishStatus" NOT NULL DEFAULT 'draft',
    "fileKeys" TEXT[],
    "externalFileUrl" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSSyllabus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSChapter" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "subjectId" TEXT NOT NULL,
    "syllabusId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutes" INTEGER,
    "publishStatus" "LMSPublishStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "createdByName" TEXT,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSResource" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "chapterId" TEXT,
    "type" "LMSResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileKeys" TEXT[],
    "externalUrl" TEXT,
    "publishStatus" "LMSPublishStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT,
    "createdByName" TEXT,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSResourceProgress" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSResourceProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSAssignment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "attachmentKeys" TEXT[],
    "externalAttachmentUrl" TEXT,
    "totalMarks" DOUBLE PRECISION,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "allowLateSubmission" BOOLEAN NOT NULL DEFAULT false,
    "submissionType" "AssignmentSubmissionType" NOT NULL,
    "publishStatus" "AssignmentStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSAssignmentSubmission" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submissionKeys" TEXT[],
    "externalSubmissionLink" TEXT,
    "submittedAt" TIMESTAMP(3),
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'submitted',
    "marksObtained" DOUBLE PRECISION,
    "feedback" TEXT,
    "attemptNo" INTEGER NOT NULL DEFAULT 1,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSAssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSLiveClass" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "periodId" TEXT,
    "teacherId" TEXT NOT NULL,
    "timetableId" TEXT,
    "liveClassType" "LiveClassType" NOT NULL DEFAULT 'regular',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "joinLink" TEXT NOT NULL,
    "platform" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "recordingLink" TEXT,
    "status" "LiveClassStatus" NOT NULL DEFAULT 'scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSLiveClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSChapterProgress" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3),
    "completionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSChapterProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSAnnouncement" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "classId" TEXT,
    "sectionId" TEXT,
    "subjectId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "publishStatus" "LMSPublishStatus" NOT NULL DEFAULT 'draft',
    "publishAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdByName" TEXT,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSDiscussion" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "classId" TEXT,
    "sectionId" TEXT,
    "subjectId" TEXT,
    "chapterId" TEXT,
    "targetType" "DiscussionTargetType" NOT NULL DEFAULT 'general',
    "targetId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSDiscussionReply" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSDiscussionReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSExam" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT,
    "subjectId" TEXT NOT NULL,
    "chapterId" TEXT,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "examCategory" "ExamType" NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "passMarks" DOUBLE PRECISION,
    "examDate" TIMESTAMP(3),
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "questionText" TEXT,
    "questionFileKeys" TEXT[],
    "externalQuestionFileUrl" TEXT,
    "status" "ExamStatus" NOT NULL DEFAULT 'draft',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "resultPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LMSExamSubmission" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "status" "ExamSubmissionStatus" NOT NULL DEFAULT 'pending',
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "answerFileKeys" TEXT[],
    "externalAnswerFileUrl" TEXT,
    "marksObtained" DOUBLE PRECISION,
    "feedback" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LMSExamSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressReport" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "attendanceScore" DECIMAL(5,2) NOT NULL,
    "assignmentScore" DECIMAL(5,2) NOT NULL,
    "examScore" DECIMAL(5,2) NOT NULL,
    "overallScore" DECIMAL(5,2) NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,
    "details" JSONB,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeScale" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minPercent" DECIMAL(5,2) NOT NULL,
    "maxPercent" DECIMAL(5,2) NOT NULL,
    "gradePoint" DECIMAL(3,2) NOT NULL,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradeScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StudentToParent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudentToParent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolCode_key" ON "School"("schoolCode");

-- CreateIndex
CREATE UNIQUE INDEX "School_schoolEmail_key" ON "School"("schoolEmail");

-- CreateIndex
CREATE UNIQUE INDEX "School_panNumber_key" ON "School"("panNumber");

-- CreateIndex
CREATE UNIQUE INDEX "School_registrationNumber_key" ON "School"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentProfile_schoolId_idx" ON "StudentProfile"("schoolId");

-- CreateIndex
CREATE INDEX "StudentProfile_admissionNumber_idx" ON "StudentProfile"("admissionNumber");

-- CreateIndex
CREATE INDEX "StudentProfile_deletedAt_idx" ON "StudentProfile"("deletedAt");

-- CreateIndex
CREATE INDEX "StudentEnrollment_academicYearId_idx" ON "StudentEnrollment"("academicYearId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_classId_idx" ON "StudentEnrollment"("classId");

-- CreateIndex
CREATE INDEX "StudentEnrollment_sectionId_idx" ON "StudentEnrollment"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentEnrollment_studentId_academicYearId_key" ON "StudentEnrollment"("studentId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentProfile_userId_key" ON "ParentProfile"("userId");

-- CreateIndex
CREATE INDEX "ParentProfile_schoolId_idx" ON "ParentProfile"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_userId_key" ON "TeacherProfile"("userId");

-- CreateIndex
CREATE INDEX "TeacherProfile_schoolId_idx" ON "TeacherProfile"("schoolId");

-- CreateIndex
CREATE INDEX "TeacherProfile_deletedAt_idx" ON "TeacherProfile"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_schoolId_employeeId_key" ON "TeacherProfile"("schoolId", "employeeId");

-- CreateIndex
CREATE INDEX "AcademicYear_schoolId_idx" ON "AcademicYear"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_schoolId_name_key" ON "AcademicYear"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- CreateIndex
CREATE INDEX "Class_academicYearId_idx" ON "Class"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolId_academicYearId_name_key" ON "Class"("schoolId", "academicYearId", "name");

-- CreateIndex
CREATE INDEX "Section_schoolId_idx" ON "Section"("schoolId");

-- CreateIndex
CREATE INDEX "Section_academicYearId_idx" ON "Section"("academicYearId");

-- CreateIndex
CREATE INDEX "Section_classId_idx" ON "Section"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_classId_name_key" ON "Section"("classId", "name");

-- CreateIndex
CREATE INDEX "Subject_schoolId_idx" ON "Subject"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_schoolId_name_key" ON "Subject"("schoolId", "name");

-- CreateIndex
CREATE INDEX "ClassSubject_schoolId_idx" ON "ClassSubject"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubject_classId_subjectId_key" ON "ClassSubject"("classId", "subjectId");

-- CreateIndex
CREATE INDEX "SectionSubjectTeacher_schoolId_idx" ON "SectionSubjectTeacher"("schoolId");

-- CreateIndex
CREATE INDEX "SectionSubjectTeacher_sectionId_idx" ON "SectionSubjectTeacher"("sectionId");

-- CreateIndex
CREATE INDEX "SectionSubjectTeacher_teacherId_idx" ON "SectionSubjectTeacher"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionSubjectTeacher_sectionId_subjectId_teacherId_key" ON "SectionSubjectTeacher"("sectionId", "subjectId", "teacherId");

-- CreateIndex
CREATE INDEX "Period_schoolId_academicYearId_idx" ON "Period"("schoolId", "academicYearId");

-- CreateIndex
CREATE INDEX "Period_schoolId_isActive_idx" ON "Period"("schoolId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Period_schoolId_academicYearId_periodNumber_key" ON "Period"("schoolId", "academicYearId", "periodNumber");

-- CreateIndex
CREATE INDEX "Timetable_schoolId_academicYearId_idx" ON "Timetable"("schoolId", "academicYearId");

-- CreateIndex
CREATE INDEX "Timetable_classId_sectionId_idx" ON "Timetable"("classId", "sectionId");

-- CreateIndex
CREATE INDEX "Timetable_sectionId_dayOfWeek_idx" ON "Timetable"("sectionId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "Timetable_teacherId_dayOfWeek_periodId_idx" ON "Timetable"("teacherId", "dayOfWeek", "periodId");

-- CreateIndex
CREATE INDEX "Timetable_subjectId_idx" ON "Timetable"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_sectionId_dayOfWeek_periodId_key" ON "Timetable"("sectionId", "dayOfWeek", "periodId");

-- CreateIndex
CREATE INDEX "StudentAttendance_schoolId_sectionId_date_periodId_idx" ON "StudentAttendance"("schoolId", "sectionId", "date", "periodId");

-- CreateIndex
CREATE INDEX "StudentAttendance_schoolId_studentId_date_idx" ON "StudentAttendance"("schoolId", "studentId", "date");

-- CreateIndex
CREATE INDEX "StudentAttendance_schoolId_teacherId_date_periodId_idx" ON "StudentAttendance"("schoolId", "teacherId", "date", "periodId");

-- CreateIndex
CREATE INDEX "StudentAttendance_schoolId_date_idx" ON "StudentAttendance"("schoolId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAttendance_studentId_date_periodId_key" ON "StudentAttendance"("studentId", "date", "periodId");

-- CreateIndex
CREATE INDEX "TeacherAttendance_schoolId_idx" ON "TeacherAttendance"("schoolId");

-- CreateIndex
CREATE INDEX "TeacherAttendance_teacherId_date_idx" ON "TeacherAttendance"("teacherId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAttendance_teacherId_date_key" ON "TeacherAttendance"("teacherId", "date");

-- CreateIndex
CREATE INDEX "FeeCategory_schoolId_idx" ON "FeeCategory"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeCategory_schoolId_name_key" ON "FeeCategory"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FeeCategory_schoolId_code_key" ON "FeeCategory"("schoolId", "code");

-- CreateIndex
CREATE INDEX "FeeStructure_schoolId_classId_academicYearId_idx" ON "FeeStructure"("schoolId", "classId", "academicYearId");

-- CreateIndex
CREATE INDEX "FeeStructure_schoolId_assignmentType_idx" ON "FeeStructure"("schoolId", "assignmentType");

-- CreateIndex
CREATE INDEX "FeeStructure_feeCategoryId_idx" ON "FeeStructure"("feeCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeAutoLog_studentFeeId_key" ON "StudentFeeAutoLog"("studentFeeId");

-- CreateIndex
CREATE INDEX "StudentFeeAutoLog_schoolId_studentId_idx" ON "StudentFeeAutoLog"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "StudentFeeAutoLog_feeStructureId_idx" ON "StudentFeeAutoLog"("feeStructureId");

-- CreateIndex
CREATE INDEX "StudentFee_schoolId_studentId_dueDate_idx" ON "StudentFee"("schoolId", "studentId", "dueDate");

-- CreateIndex
CREATE INDEX "StudentFee_schoolId_status_dueDate_idx" ON "StudentFee"("schoolId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "StudentFee_schoolId_reminderDate_idx" ON "StudentFee"("schoolId", "reminderDate");

-- CreateIndex
CREATE INDEX "StudentFee_assignmentType_idx" ON "StudentFee"("assignmentType");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFee_studentId_feeStructureId_dueDate_key" ON "StudentFee"("studentId", "feeStructureId", "dueDate");

-- CreateIndex
CREATE INDEX "StudentScholarship_schoolId_studentId_startDate_endDate_idx" ON "StudentScholarship"("schoolId", "studentId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "StudentScholarship_feeCategoryId_idx" ON "StudentScholarship"("feeCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentScholarship_studentId_feeCategoryId_startDate_endDat_key" ON "StudentScholarship"("studentId", "feeCategoryId", "startDate", "endDate", "type");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_paymentReference_key" ON "FeePayment"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_idempotencyKey_key" ON "FeePayment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "FeePayment_schoolId_studentId_paymentDate_idx" ON "FeePayment"("schoolId", "studentId", "paymentDate");

-- CreateIndex
CREATE INDEX "FeePayment_schoolId_paymentMethod_status_idx" ON "FeePayment"("schoolId", "paymentMethod", "status");

-- CreateIndex
CREATE INDEX "FeePayment_schoolId_createdAt_idx" ON "FeePayment"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "FeePayment_transactionId_idx" ON "FeePayment"("transactionId");

-- CreateIndex
CREATE INDEX "FeePayment_gatewayReference_idx" ON "FeePayment"("gatewayReference");

-- CreateIndex
CREATE INDEX "FeePaymentAllocation_schoolId_studentFeeId_idx" ON "FeePaymentAllocation"("schoolId", "studentFeeId");

-- CreateIndex
CREATE UNIQUE INDEX "FeePaymentAllocation_paymentId_studentFeeId_key" ON "FeePaymentAllocation"("paymentId", "studentFeeId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeSetting_schoolId_key" ON "FeeSetting"("schoolId");

-- CreateIndex
CREATE INDEX "FeeReminder_schoolId_parentId_reminderDate_idx" ON "FeeReminder"("schoolId", "parentId", "reminderDate");

-- CreateIndex
CREATE INDEX "FeeReminder_studentFeeId_idx" ON "FeeReminder"("studentFeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_paymentToken_key" ON "Invoice"("paymentToken");

-- CreateIndex
CREATE INDEX "Invoice_schoolId_status_idx" ON "Invoice"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Invoice_schoolId_studentId_idx" ON "Invoice"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "Invoice_paymentToken_idx" ON "Invoice"("paymentToken");

-- CreateIndex
CREATE INDEX "InvoiceFee_schoolId_idx" ON "InvoiceFee"("schoolId");

-- CreateIndex
CREATE INDEX "InvoiceFee_studentFeeId_idx" ON "InvoiceFee"("studentFeeId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceFee_invoiceId_studentFeeId_key" ON "InvoiceFee"("invoiceId", "studentFeeId");

-- CreateIndex
CREATE INDEX "SchoolPaymentGateway_schoolId_status_idx" ON "SchoolPaymentGateway"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolPaymentGateway_schoolId_paymentMethod_key" ON "SchoolPaymentGateway"("schoolId", "paymentMethod");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_actorId_idx" ON "AuditLog"("schoolId", "actorId");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_entityType_entityId_idx" ON "AuditLog"("schoolId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_action_idx" ON "AuditLog"("schoolId", "action");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_studentId_idx" ON "AuditLog"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_createdAt_idx" ON "AuditLog"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_schoolId_userId_isRead_idx" ON "Notification"("schoolId", "userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_schoolId_type_idx" ON "Notification"("schoolId", "type");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PublicAdmission_schoolId_idx" ON "PublicAdmission"("schoolId");

-- CreateIndex
CREATE INDEX "PublicAdmission_status_idx" ON "PublicAdmission"("status");

-- CreateIndex
CREATE INDEX "LMSSyllabus_schoolId_idx" ON "LMSSyllabus"("schoolId");

-- CreateIndex
CREATE INDEX "LMSSyllabus_academicYearId_idx" ON "LMSSyllabus"("academicYearId");

-- CreateIndex
CREATE INDEX "LMSSyllabus_classId_sectionId_subjectId_idx" ON "LMSSyllabus"("classId", "sectionId", "subjectId");

-- CreateIndex
CREATE INDEX "LMSChapter_schoolId_idx" ON "LMSChapter"("schoolId");

-- CreateIndex
CREATE INDEX "LMSChapter_academicYearId_idx" ON "LMSChapter"("academicYearId");

-- CreateIndex
CREATE INDEX "LMSChapter_classId_sectionId_subjectId_idx" ON "LMSChapter"("classId", "sectionId", "subjectId");

-- CreateIndex
CREATE INDEX "LMSChapter_syllabusId_idx" ON "LMSChapter"("syllabusId");

-- CreateIndex
CREATE INDEX "LMSResource_schoolId_idx" ON "LMSResource"("schoolId");

-- CreateIndex
CREATE INDEX "LMSResource_chapterId_idx" ON "LMSResource"("chapterId");

-- CreateIndex
CREATE INDEX "LMSResourceProgress_schoolId_idx" ON "LMSResourceProgress"("schoolId");

-- CreateIndex
CREATE INDEX "LMSResourceProgress_studentId_idx" ON "LMSResourceProgress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LMSResourceProgress_resourceId_studentId_key" ON "LMSResourceProgress"("resourceId", "studentId");

-- CreateIndex
CREATE INDEX "LMSAssignment_schoolId_idx" ON "LMSAssignment"("schoolId");

-- CreateIndex
CREATE INDEX "LMSAssignment_classId_sectionId_subjectId_idx" ON "LMSAssignment"("classId", "sectionId", "subjectId");

-- CreateIndex
CREATE INDEX "LMSAssignment_teacherId_idx" ON "LMSAssignment"("teacherId");

-- CreateIndex
CREATE INDEX "LMSAssignment_chapterId_idx" ON "LMSAssignment"("chapterId");

-- CreateIndex
CREATE INDEX "LMSAssignment_dueDate_idx" ON "LMSAssignment"("dueDate");

-- CreateIndex
CREATE INDEX "LMSAssignmentSubmission_schoolId_idx" ON "LMSAssignmentSubmission"("schoolId");

-- CreateIndex
CREATE INDEX "LMSAssignmentSubmission_assignmentId_idx" ON "LMSAssignmentSubmission"("assignmentId");

-- CreateIndex
CREATE INDEX "LMSAssignmentSubmission_studentId_idx" ON "LMSAssignmentSubmission"("studentId");

-- CreateIndex
CREATE INDEX "LMSAssignmentSubmission_status_idx" ON "LMSAssignmentSubmission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LMSAssignmentSubmission_assignmentId_studentId_key" ON "LMSAssignmentSubmission"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "LMSLiveClass_schoolId_idx" ON "LMSLiveClass"("schoolId");

-- CreateIndex
CREATE INDEX "LMSLiveClass_classId_sectionId_subjectId_idx" ON "LMSLiveClass"("classId", "sectionId", "subjectId");

-- CreateIndex
CREATE INDEX "LMSLiveClass_teacherId_idx" ON "LMSLiveClass"("teacherId");

-- CreateIndex
CREATE INDEX "LMSLiveClass_chapterId_idx" ON "LMSLiveClass"("chapterId");

-- CreateIndex
CREATE INDEX "LMSLiveClass_periodId_idx" ON "LMSLiveClass"("periodId");

-- CreateIndex
CREATE INDEX "LMSLiveClass_scheduledAt_idx" ON "LMSLiveClass"("scheduledAt");

-- CreateIndex
CREATE INDEX "LMSChapterProgress_schoolId_idx" ON "LMSChapterProgress"("schoolId");

-- CreateIndex
CREATE INDEX "LMSChapterProgress_studentId_idx" ON "LMSChapterProgress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "LMSChapterProgress_chapterId_studentId_key" ON "LMSChapterProgress"("chapterId", "studentId");

-- CreateIndex
CREATE INDEX "LMSAnnouncement_schoolId_idx" ON "LMSAnnouncement"("schoolId");

-- CreateIndex
CREATE INDEX "LMSAnnouncement_classId_sectionId_subjectId_idx" ON "LMSAnnouncement"("classId", "sectionId", "subjectId");

-- CreateIndex
CREATE INDEX "LMSDiscussion_schoolId_idx" ON "LMSDiscussion"("schoolId");

-- CreateIndex
CREATE INDEX "LMSDiscussion_classId_sectionId_subjectId_idx" ON "LMSDiscussion"("classId", "sectionId", "subjectId");

-- CreateIndex
CREATE INDEX "LMSDiscussion_chapterId_idx" ON "LMSDiscussion"("chapterId");

-- CreateIndex
CREATE INDEX "LMSDiscussionReply_discussionId_idx" ON "LMSDiscussionReply"("discussionId");

-- CreateIndex
CREATE INDEX "LMSExam_schoolId_idx" ON "LMSExam"("schoolId");

-- CreateIndex
CREATE INDEX "LMSExam_academicYearId_idx" ON "LMSExam"("academicYearId");

-- CreateIndex
CREATE INDEX "LMSExam_classId_sectionId_subjectId_idx" ON "LMSExam"("classId", "sectionId", "subjectId");

-- CreateIndex
CREATE INDEX "LMSExam_chapterId_idx" ON "LMSExam"("chapterId");

-- CreateIndex
CREATE INDEX "LMSExam_teacherId_idx" ON "LMSExam"("teacherId");

-- CreateIndex
CREATE INDEX "LMSExam_examCategory_idx" ON "LMSExam"("examCategory");

-- CreateIndex
CREATE INDEX "LMSExam_status_idx" ON "LMSExam"("status");

-- CreateIndex
CREATE INDEX "LMSExam_examDate_idx" ON "LMSExam"("examDate");

-- CreateIndex
CREATE INDEX "LMSExamSubmission_schoolId_idx" ON "LMSExamSubmission"("schoolId");

-- CreateIndex
CREATE INDEX "LMSExamSubmission_examId_idx" ON "LMSExamSubmission"("examId");

-- CreateIndex
CREATE INDEX "LMSExamSubmission_studentId_idx" ON "LMSExamSubmission"("studentId");

-- CreateIndex
CREATE INDEX "LMSExamSubmission_status_idx" ON "LMSExamSubmission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LMSExamSubmission_examId_studentId_key" ON "LMSExamSubmission"("examId", "studentId");

-- CreateIndex
CREATE INDEX "ProgressReport_schoolId_studentId_academicYearId_idx" ON "ProgressReport"("schoolId", "studentId", "academicYearId");

-- CreateIndex
CREATE INDEX "GradeScale_schoolId_idx" ON "GradeScale"("schoolId");

-- CreateIndex
CREATE INDEX "GradeScale_schoolId_minPercent_maxPercent_idx" ON "GradeScale"("schoolId", "minPercent", "maxPercent");

-- CreateIndex
CREATE UNIQUE INDEX "GradeScale_schoolId_label_key" ON "GradeScale"("schoolId", "label");

-- CreateIndex
CREATE INDEX "_StudentToParent_B_index" ON "_StudentToParent"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentEnrollment" ADD CONSTRAINT "StudentEnrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "TeacherProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubjectTeacher" ADD CONSTRAINT "SectionSubjectTeacher_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubjectTeacher" ADD CONSTRAINT "SectionSubjectTeacher_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubjectTeacher" ADD CONSTRAINT "SectionSubjectTeacher_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubjectTeacher" ADD CONSTRAINT "SectionSubjectTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timetable" ADD CONSTRAINT "Timetable_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeCategory" ADD CONSTRAINT "FeeCategory_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_feeCategoryId_fkey" FOREIGN KEY ("feeCategoryId") REFERENCES "FeeCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeAutoLog" ADD CONSTRAINT "StudentFeeAutoLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeAutoLog" ADD CONSTRAINT "StudentFeeAutoLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeAutoLog" ADD CONSTRAINT "StudentFeeAutoLog_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeAutoLog" ADD CONSTRAINT "StudentFeeAutoLog_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "StudentFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFee" ADD CONSTRAINT "StudentFee_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScholarship" ADD CONSTRAINT "StudentScholarship_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScholarship" ADD CONSTRAINT "StudentScholarship_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScholarship" ADD CONSTRAINT "StudentScholarship_feeCategoryId_fkey" FOREIGN KEY ("feeCategoryId") REFERENCES "FeeCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "SchoolPaymentGateway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePaymentAllocation" ADD CONSTRAINT "FeePaymentAllocation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePaymentAllocation" ADD CONSTRAINT "FeePaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FeePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePaymentAllocation" ADD CONSTRAINT "FeePaymentAllocation_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "StudentFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeSetting" ADD CONSTRAINT "FeeSetting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReminder" ADD CONSTRAINT "FeeReminder_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReminder" ADD CONSTRAINT "FeeReminder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReminder" ADD CONSTRAINT "FeeReminder_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "StudentFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceFee" ADD CONSTRAINT "InvoiceFee_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceFee" ADD CONSTRAINT "InvoiceFee_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceFee" ADD CONSTRAINT "InvoiceFee_studentFeeId_fkey" FOREIGN KEY ("studentFeeId") REFERENCES "StudentFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolPaymentGateway" ADD CONSTRAINT "SchoolPaymentGateway_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicAdmission" ADD CONSTRAINT "PublicAdmission_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicAdmission" ADD CONSTRAINT "PublicAdmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSSyllabus" ADD CONSTRAINT "LMSSyllabus_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSSyllabus" ADD CONSTRAINT "LMSSyllabus_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSSyllabus" ADD CONSTRAINT "LMSSyllabus_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSSyllabus" ADD CONSTRAINT "LMSSyllabus_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSSyllabus" ADD CONSTRAINT "LMSSyllabus_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSChapter" ADD CONSTRAINT "LMSChapter_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSChapter" ADD CONSTRAINT "LMSChapter_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSChapter" ADD CONSTRAINT "LMSChapter_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSChapter" ADD CONSTRAINT "LMSChapter_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSChapter" ADD CONSTRAINT "LMSChapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSChapter" ADD CONSTRAINT "LMSChapter_syllabusId_fkey" FOREIGN KEY ("syllabusId") REFERENCES "LMSSyllabus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSResource" ADD CONSTRAINT "LMSResource_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSResource" ADD CONSTRAINT "LMSResource_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "LMSChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSResourceProgress" ADD CONSTRAINT "LMSResourceProgress_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSResourceProgress" ADD CONSTRAINT "LMSResourceProgress_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "LMSResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSResourceProgress" ADD CONSTRAINT "LMSResourceProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAssignment" ADD CONSTRAINT "LMSAssignment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAssignment" ADD CONSTRAINT "LMSAssignment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAssignment" ADD CONSTRAINT "LMSAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAssignment" ADD CONSTRAINT "LMSAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAssignment" ADD CONSTRAINT "LMSAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAssignment" ADD CONSTRAINT "LMSAssignment_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "LMSChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAssignment" ADD CONSTRAINT "LMSAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAssignmentSubmission" ADD CONSTRAINT "LMSAssignmentSubmission_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAssignmentSubmission" ADD CONSTRAINT "LMSAssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "LMSAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAssignmentSubmission" ADD CONSTRAINT "LMSAssignmentSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSLiveClass" ADD CONSTRAINT "LMSLiveClass_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSLiveClass" ADD CONSTRAINT "LMSLiveClass_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSLiveClass" ADD CONSTRAINT "LMSLiveClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSLiveClass" ADD CONSTRAINT "LMSLiveClass_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSLiveClass" ADD CONSTRAINT "LMSLiveClass_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSLiveClass" ADD CONSTRAINT "LMSLiveClass_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "LMSChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSLiveClass" ADD CONSTRAINT "LMSLiveClass_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSLiveClass" ADD CONSTRAINT "LMSLiveClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSLiveClass" ADD CONSTRAINT "LMSLiveClass_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSChapterProgress" ADD CONSTRAINT "LMSChapterProgress_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSChapterProgress" ADD CONSTRAINT "LMSChapterProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "LMSChapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSChapterProgress" ADD CONSTRAINT "LMSChapterProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAnnouncement" ADD CONSTRAINT "LMSAnnouncement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAnnouncement" ADD CONSTRAINT "LMSAnnouncement_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAnnouncement" ADD CONSTRAINT "LMSAnnouncement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAnnouncement" ADD CONSTRAINT "LMSAnnouncement_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSAnnouncement" ADD CONSTRAINT "LMSAnnouncement_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSDiscussion" ADD CONSTRAINT "LMSDiscussion_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSDiscussion" ADD CONSTRAINT "LMSDiscussion_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSDiscussion" ADD CONSTRAINT "LMSDiscussion_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSDiscussion" ADD CONSTRAINT "LMSDiscussion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSDiscussion" ADD CONSTRAINT "LMSDiscussion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSDiscussion" ADD CONSTRAINT "LMSDiscussion_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "LMSChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSDiscussionReply" ADD CONSTRAINT "LMSDiscussionReply_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "LMSDiscussion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSExam" ADD CONSTRAINT "LMSExam_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSExam" ADD CONSTRAINT "LMSExam_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSExam" ADD CONSTRAINT "LMSExam_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSExam" ADD CONSTRAINT "LMSExam_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSExam" ADD CONSTRAINT "LMSExam_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSExam" ADD CONSTRAINT "LMSExam_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "LMSChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSExam" ADD CONSTRAINT "LMSExam_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSExamSubmission" ADD CONSTRAINT "LMSExamSubmission_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSExamSubmission" ADD CONSTRAINT "LMSExamSubmission_examId_fkey" FOREIGN KEY ("examId") REFERENCES "LMSExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LMSExamSubmission" ADD CONSTRAINT "LMSExamSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeScale" ADD CONSTRAINT "GradeScale_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentToParent" ADD CONSTRAINT "_StudentToParent_A_fkey" FOREIGN KEY ("A") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentToParent" ADD CONSTRAINT "_StudentToParent_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
