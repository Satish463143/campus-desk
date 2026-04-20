const prisma = require("../../config/db.config");
const bcrypt = require("bcryptjs");
const {
  Role,
  Status,
  FeeStatus,
  AcademicStatus,
} = require("../../config/constant.config");

// ─── resolvePeriod ────────────────────────────────────────────────────────────
// Given a FeeFrequency and a base due date, returns the period window and the
// actual due date to store on StudentFee.
//
//  one_time    → no period window, due date = baseDueDate
//  monthly     → current calendar month, due = baseDueDate
//  quarterly   → current quarter (Jan-Mar / Apr-Jun / Jul-Sep / Oct-Dec)
//  half_yearly → current half  (Jan-Jun / Jul-Dec)
//  yearly      → current academic year window (Jan 1 – Dec 31)
function resolvePeriod(frequency, baseDueDate) {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = now.getMonth(); // 0-indexed

  let periodLabel = null;
  let periodStart = null;
  let periodEnd   = null;
  let dueDate     = new Date(baseDueDate);

  switch (frequency) {
    case "monthly": {
      periodStart = new Date(y, m, 1);
      periodEnd   = new Date(y, m + 1, 0); // last day of month
      periodLabel = `${now.toLocaleString("default", { month: "long" })} ${y}`;
      break;
    }
    case "quarterly": {
      const q         = Math.floor(m / 3);          // 0,1,2,3
      const qStartM   = q * 3;
      periodStart     = new Date(y, qStartM, 1);
      periodEnd       = new Date(y, qStartM + 3, 0);
      periodLabel     = `Q${q + 1} ${y}`;
      dueDate         = new Date(y, qStartM + 3, 0); // end of quarter
      break;
    }
    case "half_yearly": {
      if (m < 6) {
        periodStart = new Date(y, 0, 1);
        periodEnd   = new Date(y, 5, 30);
        periodLabel = `H1 ${y}`;
        dueDate     = new Date(y, 5, 30);
      } else {
        periodStart = new Date(y, 6, 1);
        periodEnd   = new Date(y, 11, 31);
        periodLabel = `H2 ${y}`;
        dueDate     = new Date(y, 11, 31);
      }
      break;
    }
    case "yearly": {
      periodStart = new Date(y, 0, 1);
      periodEnd   = new Date(y, 11, 31);
      periodLabel = `${y}`;
      dueDate     = new Date(y, 11, 31);
      break;
    }
    case "one_time":
    default: {
      // No period window — due date stays as baseDueDate
      break;
    }
  }

  return { periodLabel, periodStart, periodEnd, dueDate };
}

class AdmissionService {
  create = async (data, schoolId) => {
    return await prisma.$transaction(async (tx) => {
      const currentYear = new Date().getFullYear();

      // ─── 1. Auto-generate Admission Number (AD_YYYY_NNNN) ────────────────────
      const admPrefix = `AD_${currentYear}_`;
      const latestProfile = await tx.studentProfile.findFirst({
        where: { schoolId, admissionNumber: { startsWith: admPrefix } },
        orderBy: { admissionNumber: "desc" },
        select: { admissionNumber: true },
      });
      let nextAdmSeq = 1;
      if (latestProfile?.admissionNumber) {
        const parts = latestProfile.admissionNumber.split("_");
        if (parts.length === 3) nextAdmSeq = parseInt(parts[2], 10) + 1;
      }
      const admissionNumber = `${admPrefix}${String(nextAdmSeq).padStart(4, "0")}`;

      // ─── 2. Auto-generate Student ID (STU_YYYY_NNNN) ─────────────────────────
      // NOTE: `studentId` is not a top-level column on StudentProfile in the current
      // Prisma schema (it only exists inside the `studentInfo` JSON blob).
      // We derive the sequence from the admissionNumber counter so the numbering
      // stays in sync without requiring a schema migration.
      // TO ADD studentId AS A REAL COLUMN: add `studentId String? @unique` to
      // StudentProfile in schema.prisma, then run `npx prisma migrate dev`.
      // Random 4-char alphanumeric suffix makes IDs non-guessable — permanent once assigned
      const randomAlpha = () =>
        Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedStudentId = `STU_${currentYear}_${String(nextAdmSeq).padStart(4, "0")}_${randomAlpha()}`;

      // ─── 3. Auto-generate Parent ID (PAR_YYYY_NNNN) ──────────────────────────
      // NOTE: `parentId` is not a top-level column on ParentProfile in the current
      // Prisma schema. We count existing parent profiles for this school and use
      // that as the sequence base — simple, collision-safe within a transaction.
      // TO ADD parentId AS A REAL COLUMN: add `parentId String? @unique` to
      // ParentProfile in schema.prisma, then run `npx prisma migrate dev`.
      const existingParentCount = await tx.parentProfile.count({
        where: { schoolId },
      });
      const generatedParentId = `PAR_${currentYear}_${String(existingParentCount + 1).padStart(4, "0")}_${randomAlpha()}`;

      // ─── Parent / student derivations ─────────────────────────────────────────
      const father = data.father || {};
      const mother = data.mother || {};
      const guardian = data.guardian || {};

      const primaryParent = father.name
        ? father
        : mother.name
          ? mother
          : guardian;
      const relationType = father.name
        ? "father"
        : mother.name
          ? "mother"
          : "guardian";

      const fullName = `${data.firstName} ${data.surname}`.trim();

      // ─── Duplicate guards ─────────────────────────────────────────────────
      // Check student email uniqueness within this school
      const existingStudentByEmail = await tx.user.findFirst({
        where: { schoolId, email: data.email, role: Role.STUDENT },
      });
      if (existingStudentByEmail) {
        throw {
          status: 409,
          message: `A student with email "${data.email}" already exists in this school. Please use a different email address.`,
        };
      }

      // Check student phone uniqueness within this school
      if (data.phone) {
        const existingStudentByPhone = await tx.user.findFirst({
          where: { schoolId, phone: data.phone, role: Role.STUDENT },
        });
        if (existingStudentByPhone) {
          throw {
            status: 409,
            message: `A student with phone "${data.phone}" already exists in this school. Please use a different phone number.`,
          };
        }
      }

      // Parent phone duplicate check intentionally skipped —
      // multiple students can share the same parent account.

      const [hashedStudentPw, hashedParentPw] = await Promise.all([
        bcrypt.hash(data.phone || "PA@2082", 10),
        bcrypt.hash(primaryParent.phone || data.phone || "PA@2082", 10),
      ]);

      const addressData = data.address || {
        country: "Nepal",
        province: "",
        district: "",
        fullAddress: "",
      };

      const studentPhone = data.phone || "";
      const parentPhone = primaryParent.phone || data.phone || "";

      // ─── Determine User Status & Academic Status ──────────────────────────────
      // userStatus   → controls login access (active / inactive) — always ACTIVE on creation
      // academicStatus → tracks the student's academic lifecycle:
      //                  admitted | pending | graduated | dropped | transferred | migration
      //                  NOTE: 'active' and 'inactive' have been removed from AcademicStatus
      //                  because user account status (UserStatus) already handles that concern.
      const userStatus = Status.ACTIVE; // Always ACTIVE on creation — account access is separate from academic status
      const academicStatus = data.academicStatus ?? AcademicStatus.ADMITTED; // Default to ADMITTED when not explicitly provided

      // ─── Create User records ──────────────────────────────────────────────────
      const studentUser = await tx.user.create({
        data: {
          name: fullName,
          email: data.email,
          phone: studentPhone,
          password: hashedStudentPw,
          schoolId,
          role: Role.STUDENT,
          status: userStatus, // ✅ Use provided status, not hardcoded ACTIVE
          address: addressData,
        },
      });

      // ─── Create or reuse Parent User ──────────────────────────────────────────
      // If a real parent email is provided and already exists in this school,
      // reuse that account instead of crashing on a unique-constraint violation.
      let parentUser;
      const parentEmail =
        primaryParent.email ||
        `parent_${studentUser.id}_${Date.now()}@noreply.local`;
      if (primaryParent.email) {
        const existingParent = await tx.user.findFirst({
          where: { schoolId, email: primaryParent.email, role: Role.PARENT },
        });
        if (existingParent) {
          parentUser = existingParent;
        }
      }
      if (!parentUser) {
        parentUser = await tx.user.create({
          data: {
            name: primaryParent.name || fullName,
            email: parentEmail,
            phone: parentPhone,
            password: hashedParentPw,
            schoolId,
            role: Role.PARENT,
            status: Status.ACTIVE,
            address: addressData,
          },
        });
      }

      // ─── Create StudentProfile ────────────────────────────────────────────────
      // `studentId` is stored inside `studentInfo` JSON because it is not yet a
      // top-level column in the schema. Once you run the migration below, you can
      // move it to a direct field and query it normally.
      //
      // Migration snippet (schema.prisma ➜ StudentProfile model):
      //   studentId   String?  @unique
      // Then: npx prisma migrate dev --name add_student_id_column
      const studentProfile = await tx.studentProfile.create({
        data: {
          userId: studentUser.id,
          schoolId,
          class: data.className || "",
          admissionNumber,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender,
          bloodGroup: data.bloodGroup || null,
          academicStatus: academicStatus, // ✅ Use provided academicStatus
          appNo: data.appNo || null,
          dateOfAdmission: data.dateOfAdmission
            ? new Date(data.dateOfAdmission)
            : new Date(),
          // Store generated studentId inside studentInfo JSON
          studentInfo: {
            ...(data.studentInfo || {}),
            studentId: generatedStudentId, // ← persisted here until schema migration
          },
          profileImage: data.profileImage ?? null,   // S3 URL from multipart upload
          documents:    data.documents    ?? [],      // [{ url, key, originalName, mimeType }]
          father: data.father
            ? {
                ...data.father,
                occupationOther: data.father.occupationOther || null,
                // Store generated parentId on whichever parent is primary
                ...(relationType === "father"
                  ? { parentId: generatedParentId }
                  : {}),
              }
            : null,
          mother: data.mother
            ? {
                ...data.mother,
                occupationOther: data.mother.occupationOther || null,
                ...(relationType === "mother"
                  ? { parentId: generatedParentId }
                  : {}),
              }
            : null,
          guardian: data.guardian
            ? {
                ...data.guardian,
                occupationOther: data.guardian.occupationOther || null,
                ...(relationType === "guardian"
                  ? { parentId: generatedParentId }
                  : { parentId: data.guardian.parentId || null }),
              }
            : null,
          familyInfo: data.familyInfo || null,
          background: data.background || null,
          fees: data.fees || null,
          declarationSigned: data.declarationSigned || false,
        },
      });

      // ─── Create or reuse ParentProfile ───────────────────────────────────────
      // If the parent user already existed, just connect the new student to their
      // existing profile — no updates to any existing data whatsoever.
      const existingParentProfile = await tx.parentProfile.findFirst({
        where: { userId: parentUser.id, schoolId },
      });
      if (existingParentProfile) {
        await tx.parentProfile.update({
          where: { id: existingParentProfile.id },
          data: { students: { connect: { id: studentProfile.id } } },
        });
      } else {
        await tx.parentProfile.create({
          data: {
            userId: parentUser.id,
            schoolId,
            relationType,
            students: { connect: { id: studentProfile.id } },
          },
        });
      }

      // ─── Fee Management Integration ───────────────────────────────────────────
      // Only auto-assign fees when academicStatus is ADMITTED.
      // pending / dropped / transferred / graduated / migration → no auto-assignment.
      //
      // How it works (mirrors real-world school flow):
      //   1. School admin creates FeeCategories (Admission Fee, Tuition Fee, Exam Fee, etc.)
      //   2. Admin sets up FeeStructures per class+academicYear with assignmentType:
      //        compulsory → auto-assigned to every student on enrollment   ← we pick these
      //        optional   → accountant manually assigns per student        ← skipped here
      //   3. On admission, we fetch ALL active compulsory FeeStructures for the class
      //      and create a StudentFee + StudentFeeAutoLog for each one.
      if (academicStatus === AcademicStatus.ADMITTED) {
        const academicYear = await tx.academicYear.findFirst({
          where: { schoolId, isActive: true },
        });

        if (academicYear) {
          const cls = await tx.class.findFirst({
            where: {
              schoolId,
              academicYearId: academicYear.id,
              name: data.className || "",
            },
          });

          if (cls) {
            // Fetch ALL active compulsory fee structures for this class — no hardcoded names
            const compulsoryFeeStructures = await tx.feeStructure.findMany({
              where: {
                schoolId,
                academicYearId: academicYear.id,
                classId: cls.id,
                isActive: true,
                assignmentType: "compulsory", // ← the only filter that matters
              },
              include: { feeCategory: true },
            });

            if (compulsoryFeeStructures.length > 0) {
              const feeSetting = await tx.feeSetting.findFirst({
                where: { schoolId },
              });
              const dueDays = feeSetting?.defaultDueDays ?? 30;
              const baseDueDate = new Date();
              baseDueDate.setDate(baseDueDate.getDate() + dueDays);

              for (const fs of compulsoryFeeStructures) {
                // one_time fees use the base due date
                // monthly/quarterly/half_yearly/yearly get their own period window
                const { periodLabel, periodStart, periodEnd, dueDate } =
                  resolvePeriod(fs.frequency, baseDueDate);

                const studentFee = await tx.studentFee.create({
                  data: {
                    schoolId,
                    academicYearId: academicYear.id,
                    studentId:      studentProfile.id,
                    feeStructureId: fs.id,
                    assignmentType: "compulsory",  // snapshot
                    assignedById:   null,           // null = system, not a staff member
                    periodLabel,
                    periodStart,
                    periodEnd,
                    originalAmount: fs.amount,
                    discountAmount: 0,
                    netAmount:      fs.amount,
                    paidAmount:     0,
                    balanceAmount:  fs.amount,
                    dueDate,
                    status: FeeStatus.PENDING,
                  },
                });

                // Audit trail — required by StudentFeeAutoLog model
                await tx.studentFeeAutoLog.create({
                  data: {
                    schoolId,
                    studentId:      studentProfile.id,
                    feeStructureId: fs.id,
                    studentFeeId:   studentFee.id,
                    triggeredBy:    "system_enrollment",
                    note: `Auto-assigned "${fs.feeCategory.name}" on admission (${admissionNumber})`,
                  },
                });
              }
            }
          }
        }
      }

      // ─── Auto-generate Invoice (best-effort) ──────────────────────────────────
      // Only generate for ADMITTED students — the StudentFees were just created above,
      // so the invoice service can pick them up immediately.
      try {
        const invoiceService = require("../invoice/invoice.service");
        if (academicStatus === AcademicStatus.ADMITTED) {
          await invoiceService.generateForStudent(
            schoolId,
            studentProfile.id,
            "FEE_INVOICE",
            [],
          );
        }
      } catch (_err) {
        console.error(
          "[Invoice] Failed to auto-generate invoice on admission create:",
          _err?.message,
        );
      }

      return {
        studentId: generatedStudentId,
        parentId: generatedParentId,
        admissionNumber,
        academicStatus,
        userStatus,
      };
    });
  };
}

module.exports = new AdmissionService();
