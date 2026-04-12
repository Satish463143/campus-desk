const prisma = require("../../config/db.config")
const bcrypt = require("bcryptjs")
const { Role, Status, AcademicStatus, FeeStatus } = require("../../config/constant.config")

class PublicAdmissionService {

    // Submit a new public admission (no auth)
    submit = async (data, schoolId) => {
        const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { id: true } })
        if (!school) throw { status: 404, message: "School not found" }

        return await prisma.publicAdmission.create({
            data: {
                schoolId,
                firstName: data.firstName,
                surname: data.surname,
                email: data.email || null,
                phone: data.phone || null,
                gender: data.gender || null,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                bloodGroup: data.bloodGroup || null,
                className: data.className || null,
                address: data.address || null,
                studentInfo: data.studentInfo || null,
                father: data.father || null,
                mother: data.mother || null,
                guardian: data.guardian || null,
                familyInfo: data.familyInfo || null,
                background: data.background || null,
                fees: data.fees || null,
                declarationSigned: data.declarationSigned ?? false,
                status: "pending",
            }
        })
    }

    // Get public school info (name, logo, classes) — no auth
    getSchoolInfo = async (schoolId) => {
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: {
                id: true,
                schoolName: true,
                logo: true,
                educationLevel: true,
                classes: { select: { id: true, name: true }, orderBy: { name: "asc" } }
            }
        })
        if (!school) throw { status: 404, message: "School not found" }
        return school
    }

    // Search parent by exact 10-digit phone (public — no auth, privacy-safe)
    searchParent = async (schoolId, phone) => {
        if (!phone || phone.replace(/\D/g, "").length < 10) {
            throw { status: 400, message: "Please enter a full 10-digit phone number to search" }
        }
        const cleanPhone = phone.replace(/\D/g, "")
        // Search user table — match phone ending with the 10 digits (handles country code prefix)
        const users = await prisma.user.findMany({
            where: {
                schoolId,
                role: "parent",
                status: "active",
                phone: { endsWith: cleanPhone }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                parentProfile: {
                    select: {
                        id: true,
                        relationType: true,
                        occupation: true,
                        students: {
                            select: { father: true, mother: true, guardian: true },
                            take: 1,
                            orderBy: { createdAt: "desc" }
                        }
                    }
                }
            }
        })
        return users
    }

    // List public admissions for a school (protected)
    list = async (schoolId, status) => {
        const where = { schoolId }
        if (status && status !== "all") where.status = status
        return await prisma.publicAdmission.findMany({
            where,
            orderBy: { submittedAt: "desc" },
            include: {
                reviewedBy: { select: { id: true, name: true } }
            }
        })
    }

    // Approve — convert public admission into a real student
    approve = async (id, schoolId, reviewerId) => {
        const pub = await prisma.publicAdmission.findFirst({ where: { id, schoolId } })
        if (!pub) throw { status: 404, message: "Public admission not found" }
        if (pub.status !== "pending") throw { status: 400, message: "This admission has already been reviewed" }

        return await prisma.$transaction(async (tx) => {
            // ─── Auto-generate Admission Number ───────────────────────────────
            const currentYear = new Date().getFullYear()
            const admPrefix = `AD_${currentYear}_`
            const latest = await tx.studentProfile.findFirst({
                where: { schoolId, admissionNumber: { startsWith: admPrefix } },
                orderBy: { admissionNumber: "desc" },
                select: { admissionNumber: true }
            })
            let nextSeq = 1
            if (latest?.admissionNumber) {
                const parts = latest.admissionNumber.split("_")
                if (parts.length === 3) nextSeq = parseInt(parts[2], 10) + 1
            }
            const admissionNumber = `${admPrefix}${String(nextSeq).padStart(4, "0")}`

            // ─── Auto-generate Student ID ──────────────────────────────────────
            const randomAlpha = () => Math.random().toString(36).substring(2, 6).toUpperCase()
            const generatedStudentId = `STU_${currentYear}_${String(nextSeq).padStart(4, "0")}_${randomAlpha()}`

            const fullName = `${pub.firstName} ${pub.surname}`.trim()
            const father   = pub.father   || {}
            const mother   = pub.mother   || {}
            const guardian = pub.guardian || {}
            const primaryParent = father.name ? father : (mother.name ? mother : guardian)
            const relationType  = father.name ? "father" : (mother.name ? "mother" : "guardian")

            const addressData = pub.address || { country: "Nepal", province: "", district: "", fullAddress: "" }
            const studentPhone = pub.phone || ""
            const parentPhone  = primaryParent.phone || pub.phone || ""

            const [hashedStudentPw, hashedParentPw] = await Promise.all([
                bcrypt.hash(studentPhone || "PA@2082", 10),
                bcrypt.hash(parentPhone  || "PA@2082", 10),
            ])

            // ─── Check email uniqueness ────────────────────────────────────────
            if (pub.email) {
                const existing = await tx.user.findFirst({ where: { schoolId, email: pub.email, role: Role.STUDENT } })
                if (existing) throw { status: 409, message: `A student with email "${pub.email}" already exists` }
            }

            // ─── Create Student User ───────────────────────────────────────────
            const studentUser = await tx.user.create({
                data: {
                    name: fullName,
                    email: pub.email || `student_${Date.now()}@noreply.local`,
                    phone: studentPhone,
                    password: hashedStudentPw,
                    schoolId,
                    role: Role.STUDENT,
                    status: Status.ACTIVE,
                    address: addressData,
                }
            })

            // ─── Create or reuse Parent User ───────────────────────────────────
            let parentUser
            const parentEmail = primaryParent.email || `parent_${studentUser.id}_${Date.now()}@noreply.local`
            if (primaryParent.email) {
                const existing = await tx.user.findFirst({ where: { schoolId, email: primaryParent.email, role: Role.PARENT } })
                if (existing) parentUser = existing
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
                    }
                })
            }

            // ─── Create Student Profile ────────────────────────────────────────
            const existingParentCount = await tx.parentProfile.count({ where: { schoolId } })
            const generatedParentId = `PAR_${currentYear}_${String(existingParentCount + 1).padStart(4, "0")}_${randomAlpha()}`

            const studentProfile = await tx.studentProfile.create({
                data: {
                    userId: studentUser.id,
                    schoolId,
                    class: pub.className || "",
                    admissionNumber,
                    dateOfBirth:     pub.dateOfBirth || null,
                    gender:          pub.gender || null,
                    bloodGroup:      pub.bloodGroup || null,
                    academicStatus:  AcademicStatus.ACTIVE,
                    studentInfo:     { ...(pub.studentInfo || {}), studentId: generatedStudentId },
                    father:  pub.father  ? { ...pub.father,  ...(relationType === "father"  ? { parentId: generatedParentId } : {}) } : null,
                    mother:  pub.mother  ? { ...pub.mother,  ...(relationType === "mother"  ? { parentId: generatedParentId } : {}) } : null,
                    guardian:pub.guardian? { ...pub.guardian,...(relationType === "guardian" ? { parentId: generatedParentId } : {}) } : null,
                    familyInfo:    pub.familyInfo    || null,
                    background:    pub.background    || null,
                    fees:          pub.fees          || null,
                    declarationSigned: pub.declarationSigned ?? false,
                }
            })

            // ─── Create Parent Profile ─────────────────────────────────────────
            const existingParentProfile = await tx.parentProfile.findUnique({ where: { userId: parentUser.id } })
            if (existingParentProfile) {
                await tx.parentProfile.update({
                    where: { id: existingParentProfile.id },
                    data: { students: { connect: { id: studentProfile.id } } }
                })
            } else {
                await tx.parentProfile.create({
                    data: {
                        userId: parentUser.id,
                        schoolId,
                        relationType: relationType,
                        students: { connect: { id: studentProfile.id } }
                    }
                })
            }

            // ─── Mark public admission as approved ────────────────────────────
            await tx.publicAdmission.update({
                where: { id },
                data: {
                    status: "approved",
                    reviewedAt: new Date(),
                    reviewedById: reviewerId,
                }
            })

            // ─── Fee Assignment (same pattern as direct admission) ───────────
            const academicYear = await tx.academicYear.findFirst({
                where: { schoolId, isActive: true },
            })
            if (academicYear) {
                const feeNames = ["Admission Fee", "Tuition Fee"]
                if (pub.fees?.additionalServices && Array.isArray(pub.fees.additionalServices)) {
                    feeNames.push(...pub.fees.additionalServices)
                }

                const cls = await tx.class.findFirst({
                    where: { schoolId, academicYearId: academicYear.id, name: pub.className || "" },
                })

                if (cls) {
                    const feeStructures = await tx.feeStructure.findMany({
                        where: {
                            schoolId,
                            academicYearId: academicYear.id,
                            classId: cls.id,
                            isActive: true,
                            feeCategory: { name: { in: feeNames } },
                        },
                        include: { feeCategory: true },
                    })

                    const feeSetting = await tx.feeSetting.findFirst({ where: { schoolId } })
                    const dueDays = feeSetting?.defaultDueDays ?? 30
                    const dueDate = new Date()
                    dueDate.setDate(dueDate.getDate() + dueDays)

                    for (const fs of feeStructures) {
                        await tx.studentFee.create({
                            data: {
                                schoolId,
                                academicYearId: academicYear.id,
                                studentId: studentProfile.id,
                                feeStructureId: fs.id,
                                originalAmount: fs.amount,
                                discountAmount: 0,
                                netAmount: fs.amount,
                                paidAmount: 0,
                                balanceAmount: fs.amount,
                                dueDate,
                                status: FeeStatus.PENDING,
                            },
                        })
                    }
                }
            }

            return { studentUser, studentProfile }
        })
    }

    // Reject a public admission
    reject = async (id, schoolId, reviewerId, reviewNote) => {
        const pub = await prisma.publicAdmission.findFirst({ where: { id, schoolId } })
        if (!pub) throw { status: 404, message: "Public admission not found" }
        if (pub.status !== "pending") throw { status: 400, message: "This admission has already been reviewed" }

        return await prisma.publicAdmission.update({
            where: { id },
            data: {
                status: "rejected",
                reviewedAt: new Date(),
                reviewedById: reviewerId,
                reviewNote: reviewNote || null,
            }
        })
    }
}

module.exports = new PublicAdmissionService()
