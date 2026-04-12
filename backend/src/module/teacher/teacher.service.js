const prisma = require("../../config/db.config")

// Shared select shape — reused across queries to avoid over-fetching
const TEACHER_LIST_SELECT = {
    id: true,
    employeeId: true,
    department: true,
    designation: true,
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

const TEACHER_DETAIL_SELECT = {
    id: true,
    employeeId: true,
    salary: true,
    department: true,
    qualification: true,
    designation: true,
    experienceYears: true,
    joiningDate: true,
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
    }
}

class TeacherService {

    /**
     * FIX: Was named createTeacher but controller called createTeacherAndParent.
     * Renamed to createTeacher and corrected to pass ALL profile fields to Prisma.
     */
    createTeacher = async (teacherUserData, teacherProfileData) => {
        return await prisma.$transaction(async (tx) => {

            // 1. Create teacher user
            const teacherUser = await tx.user.create({ data: teacherUserData })

            // 2. Create teacher profile with ALL fields — previously only userId + schoolId were being saved
            const teacherProfile = await tx.teacherProfile.create({
                data: {
                    userId: teacherUser.id,
                    schoolId: teacherProfileData.schoolId,
                    employeeId: teacherProfileData.employeeId ?? null,
                    qualification: teacherProfileData.qualification ?? null,
                    experienceYears: teacherProfileData.experienceYears ?? null,
                    joiningDate: teacherProfileData.joiningDate ?? null,
                    salary: teacherProfileData.salary ?? null,
                    department: teacherProfileData.department ?? null,
                    designation: teacherProfileData.designation ?? null,
                },
                select: TEACHER_DETAIL_SELECT
            })

            return { teacherUser, teacherProfile }
        })
    }

    listTeachers = async (filter = {}, limit = 10, skip = 0) => {
        // Run count and findMany in parallel for speed
        const [count, data] = await Promise.all([
            prisma.teacherProfile.count({ where: filter }),
            prisma.teacherProfile.findMany({
                where: filter,
                select: TEACHER_LIST_SELECT,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" }
            })
        ])
        return { data, count }
    }

    getTeacherById = async (id) => {
        return await prisma.teacherProfile.findUnique({
            where: { id },
            select: TEACHER_DETAIL_SELECT,
        })
    }

    updateTeacherProfile = async (teacherUserData, teacherProfileData) => {
        return await prisma.$transaction(async (tx) => {
            const { id: userId, ...userFields } = teacherUserData
            const { id: profileId, ...profileFields } = teacherProfileData

            // Run both updates in parallel inside the transaction
            const [teacherUser, teacherProfile] = await Promise.all([
                tx.user.update({
                    where: { id: userId },
                    data: userFields,
                    select: {
                        id: true, name: true, email: true, phone: true,
                        status: true, profileImage: true
                    }
                }),
                tx.teacherProfile.update({
                    where: { id: profileId },
                    data: profileFields,
                    select: TEACHER_DETAIL_SELECT
                })
            ])

            return { teacherUser, teacherProfile }
        })
    }

       deleteTeacherProfile = async (teacher) => {
        return await prisma.$transaction(async (tx) => {
            // Must delete profile (child) before user (parent) to respect FK constraint
            const deletedTeacherProfile = await tx.teacherProfile.delete({
                where: { id: teacher.id }
            })
            const deletedTeacherUser = await tx.user.delete({
                where: { id: teacher.user.id }
            })
            return { deletedTeacherUser, deletedTeacherProfile }
        })
    }
}

module.exports = new TeacherService()