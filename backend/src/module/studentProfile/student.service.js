const prisma = require("../../config/db.config")

// Shared select shape — reused across queries to avoid over-fetching
const STUDENT_LIST_SELECT = {
    id: true,
    class: true,
    section: true,
    admissionNumber: true,
    academicStatus: true,
    gender: true,
    studentInfo: true,
    enrollments: {
        select: {
            classId: true,
            class: { select: { id: true, name: true } },
            academicYearId: true,
        },
        take: 1,
        orderBy: { createdAt: "desc" }
    },
    user: {
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            status: true,
            profileImage: true,
        }
    }
}

const STUDENT_DETAIL_SELECT = {
    id: true,
    class: true,
    section: true,
    admissionNumber: true,
    dateOfBirth: true,
    gender: true,
    bloodGroup: true,
    academicStatus: true,
    appNo: true,
    dateOfAdmission: true,
    studentInfo: true,
    father: true,
    mother: true,
    guardian: true,
    familyInfo: true,
    background: true,
    fees: true,

    createdAt: true,
    updatedAt: true,
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            status: true,
            profileImage: true,
            lastLoginAt: true,
        }
    },
    parents: {
        select: {
            id: true,
            relationType: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                }
            }
        }
    }
}

class StudentService {

    createStudentAndParent = async (studentUserData, studentProfileData, parentUserData, parentProfileData) => {
        return await prisma.$transaction(async (tx) => {

            // 1. Create student user
            const studentUser = await tx.user.create({ data: studentUserData })

            // 2. Resolve parent user — either existing or new
            let parentUser
            if (parentProfileData.existingParentId) {
                // Link to existing parent; just fetch to return it
                parentUser = await tx.user.findUniqueOrThrow({
                    where: { id: parentProfileData.existingParentId }
                })
            } else {
                parentUser = await tx.user.create({ data: parentUserData })
            }

            // 3. Create student profile (linked to student user and school)
            const studentProfile = await tx.studentProfile.create({
                data: {
                    userId: studentUser.id,
                    schoolId: studentProfileData.schoolId,
                    class: studentProfileData.class,
                    section: studentProfileData.section ?? null,
                    admissionNumber: studentProfileData.admissionNumber ?? null,
                    rollNumber: studentProfileData.rollNumber ?? null,
                    dateOfBirth: studentProfileData.dateOfBirth ?? null,
                    gender: studentProfileData.gender ?? null,
                    bloodGroup: studentProfileData.bloodGroup ?? null,
                    academicStatus: studentProfileData.academicStatus,
                }
            })

            // 4. Create or fetch parent profile, then link student to parent
            let parentProfile
            if (parentProfileData.existingParentId) {
                parentProfile = await tx.parentProfile.findUniqueOrThrow({
                    where: { userId: parentProfileData.existingParentId }
                })
                // Link existing parent to new student (many-to-many)
                await tx.parentProfile.update({
                    where: { id: parentProfile.id },
                    data: { students: { connect: { id: studentProfile.id } } }
                })
            } else {
                parentProfile = await tx.parentProfile.create({
                    data: {
                        userId: parentUser.id,
                        schoolId: parentProfileData.schoolId,
                        relationType: parentProfileData.relationType ?? null,
                        students: { connect: { id: studentProfile.id } }  // link via many-to-many
                    }
                })
            }
            return { studentUser, studentProfile, parentUser, parentProfile }
        })
    }

    listStudents = async (filter = {}, limit = 10, skip = 0) => {
        // Run count and findMany in parallel for speed
        const [count, data] = await Promise.all([
            prisma.studentProfile.count({ where: filter }),
            prisma.studentProfile.findMany({
                where: filter,
                select: STUDENT_LIST_SELECT,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" }
            })
        ])
        return { data, count }
    }

    getStudentById = async (id) => {
        return await prisma.studentProfile.findUnique({
            where: { id },
            select: STUDENT_DETAIL_SELECT,
        })
    }

    updateStudentProfile = async (student, data) => {
        return await prisma.$transaction(async (tx) => {
            const bcrypt = require("bcryptjs")
            const password = data.password ? await bcrypt.hash(data.password, 10) : undefined
            const fullName = data.firstName && data.surname ? `${data.firstName} ${data.surname}`.trim() : student.user?.name

            const [studentUser, studentProfile] = await Promise.all([
                tx.user.update({
                    where: { id: student.user.id },
                    data: {
                        ...(fullName && { name: fullName }),
                        ...(data.email !== undefined && { email: data.email }),
                        ...(data.phone !== undefined && { phone: data.phone }),
                        ...(password && { password }),
                        ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
                        ...(data.status !== undefined && ["active", "inactive"].includes(data.status) && { status: data.status }),
                        ...(data.address !== undefined && { address: data.address }),
                    },
                    select: {
                        id: true, name: true, email: true, phone: true,
                        status: true, profileImage: true
                    }
                }),
                tx.studentProfile.update({
                    where: { id: student.id },
                    data: {
                        ...(data.class !== undefined ? { class: data.class } : (data.className !== undefined ? { class: data.className } : {})),
                        ...(data.section !== undefined && { section: data.section }),
                        ...(data.admissionNumber !== undefined && { admissionNumber: data.admissionNumber }),
                        ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }),
                        ...(data.gender !== undefined && { gender: data.gender }),
                        ...(data.bloodGroup !== undefined && { bloodGroup: data.bloodGroup }),
                        ...(data.academicStatus !== undefined && { academicStatus: data.academicStatus }),
                        ...(data.appNo !== undefined && { appNo: data.appNo }),
                        ...(data.dateOfAdmission !== undefined && { dateOfAdmission: data.dateOfAdmission ? new Date(data.dateOfAdmission) : null }),
                        ...(data.studentInfo !== undefined && { studentInfo: data.studentInfo }),
                        ...(data.father !== undefined && { father: data.father }),
                        ...(data.mother !== undefined && { mother: data.mother }),
                        ...(data.guardian !== undefined && { guardian: data.guardian }),
                        ...(data.familyInfo !== undefined && { familyInfo: data.familyInfo }),
                        ...(data.background !== undefined && { background: data.background }),
                        ...(data.fees !== undefined && { fees: data.fees }),
                        ...(data.declarationSigned !== undefined && { declarationSigned: data.declarationSigned }),
                    },
                    select: STUDENT_LIST_SELECT
                })
            ])

            return { studentUser, studentProfile }
        })
    }


    deleteStudentProfile = async (student) => {
        return await prisma.$transaction(async (tx) => {
            // 1. Find all parents linked to this student BEFORE deletion,
            //    including how many students each parent currently has.
            //    Parents with a count of 1 are exclusively linked to this student
            //    and will become orphans after deletion.
            const linkedParents = await tx.parentProfile.findMany({
                where: { students: { some: { id: student.id } } },
                include: {
                    _count: { select: { students: true } },
                    user: { select: { id: true } }
                }
            })

            // 2. Delete the student profile first (child) to respect FK constraints.
            //    The DB-level ON DELETE CASCADE on _StudentToParent automatically
            //    removes the join table rows linking this student to their parents.
            const deletedStudentProfile = await tx.studentProfile.delete({
                where: { id: student.id }
            })

            // 3. Delete the student's User record
            const deletedStudentUser = await tx.user.delete({
                where: { id: student.user.id }
            })

            // 4. Clean up orphaned parents: any parent whose sole linked student
            //    was this one (count === 1) now has no students — delete them.
            //    Parents shared with other students are left untouched.
            const soloParents = linkedParents.filter(p => p._count.students === 1)
            for (const parent of soloParents) {
                await tx.parentProfile.delete({ where: { id: parent.id } })
                await tx.user.delete({ where: { id: parent.user.id } })
            }

            return {
                deletedStudentUser,
                deletedStudentProfile,
                deletedOrphanParents: soloParents.length
            }
        })
    }
}

module.exports = new StudentService()