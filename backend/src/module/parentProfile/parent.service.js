const prisma = require("../../config/db.config")

const PARENT_LIST_SELECT = {
    id: true,
    relationType: true,
    occupation: true,
    emergencyContact: true,
    user: {
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            status: true,
            profileImage: true,
            address: true,
        }
    }
}

const PARENT_DETAIL_SELECT = {
    id: true,
    relationType: true,
    occupation: true,
    emergencyContact: true,
    user: {
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            status: true,
            profileImage: true,
            address: true,
            lastLoginAt: true,
        }
    },
    students: {
        select: {
            id: true,
            admissionNumber: true,
            rollNumber: true,
            class: true,
            section: true,
        }
    }
}

class ParentService {

     listParents = async (filter = {}, limit = 10, skip = 0) => {
        // Run count and findMany in parallel for speed
        const [count, data] = await Promise.all([
            prisma.parentProfile.count({ where: filter }),
            prisma.parentProfile.findMany({
                where: filter,
                select: PARENT_LIST_SELECT,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" }
            })
        ])
        return { data, count }
    }

    getParentById = async (id) => {
        return await prisma.parentProfile.findUnique({
            where: { id },
            select: PARENT_DETAIL_SELECT,
        })
    }
    updateParentProfile = async (parentUserData, parentProfileData) => {
        return await prisma.$transaction(async (tx) => {
            const { id: userId, ...userFields } = parentUserData
            const { id: profileId, ...profileFields } = parentProfileData

            // Run both updates in parallel inside the transaction
            const [parentUser, parentProfile] = await Promise.all([
                tx.user.update({
                    where: { id: userId },
                    data: userFields,
                    select: {
                        id: true, name: true, email: true, phone: true,
                        status: true, profileImage: true
                    }
                }),
                tx.parentProfile.update({
                    where: { id: profileId },
                    data: profileFields,
                    select: PARENT_DETAIL_SELECT
                })
            ])

            return { parentUser, parentProfile }
        })
    }

 
    deleteParentProfile = async (parent) => {
        return await prisma.$transaction(async (tx) => {
            // Must delete profile (child) before user (parent) to respect FK constraint
            const deletedParentProfile = await tx.parentProfile.delete({
                where: { id: parent.id }
            })
            const deletedParentUser = await tx.user.delete({
                where: { id: parent.user.id }
            })
            return { deletedParentUser, deletedParentProfile }
        })
    }
    
}

module.exports = new ParentService()
