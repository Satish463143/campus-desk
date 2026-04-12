const prisma = require("../../config/db.config")

class SchoolService {
    
    createSchoolAndPrincipal = async (schoolData, principalData) => {
        try {
            return await prisma.$transaction(async (tx) => {
                const school = await tx.school.create({ data: schoolData });
                principalData.schoolId = school.id;
                const principal = await tx.user.create({ data: principalData });
                return { school, principal };
            });
        } catch (exception) {
            console.log('Error in createSchoolAndPrincipal service', exception);
            throw exception;
        }
    }
    

    listSchools = async ({ search = "", limit = 10, skip = 0 }) => {
        try {
            const where = search
                ? { schoolName: { contains: search, mode: "insensitive" } }
                : {}

            const [count, data] = await Promise.all([
                prisma.school.count({ where }),
                prisma.school.findMany({
                    where,
                    select: {
                        id:           true,
                        schoolName:   true,
                        schoolEmail:  true,
                        schoolPhone:  true,
                        schoolType:   true,
                        address:      true,
                        schoolStatus: true,
                        createdAt:    true,
                        // Pull the principal inline — no extra query per school
                        users: {
                            where:  { role: "principal" },
                            select: {
                                id:           true,
                                name:         true,
                                email:        true,
                                phone:        true,
                                profileImage: true,
                                status:       true,
                            },
                            take: 1,
                        },
                    },
                    skip:    skip,
                    take:    limit,
                    orderBy: { createdAt: "desc" },
                })
            ])

            // Flatten users[0] → principal for cleaner API response
            const schools = data.map(({ users, ...school }) => ({
                ...school,
                principal: users[0] ?? null,
            }))

            return { data: schools, count }

        } catch (exception) {
            console.log('Error in listSchools service', exception);
            throw exception;
        }
    }

    getSchoolById = async (id) => {
        try {
            const school = await prisma.school.findUnique({
                where: { id }
            })
            return school
        } catch (exception) {
            console.log('Error in getSchoolById service', exception);
            throw exception
        }
    }
    updateSchoolProfile = async (id, data) => {
        try {
            const school = await prisma.school.update({
                where: { id },
                data: data
            })
            return school
        } catch (exception) {
            console.log('Error in updateSchoolProfile service', exception);
            throw exception
        }
    }
    updateSchoolStatus = async (id, data) => {
        try {
            const school = await prisma.school.update({
                where: { id },
                data: data
            })
            return school
        } catch (exception) {
            console.log('Error in updateSchoolStatus service', exception);
            throw exception
        }
    }

    deleteSchool = async (id) => {
        const school = await prisma.school.findUnique({ where: { id } });
        if (!school) {
            const err = new Error("School not found");
            err.status = 404;
            throw err;
        }

        // Cascade-delete all dependent records in FK-dependency order.
        // Leaf records must be deleted before parent records to avoid constraint errors.
        // Order derived from schema.prisma School relations.
        await prisma.$transaction([
            // LMS leaf tables
            prisma.lMSExamSubmission.deleteMany({ where: { schoolId: id } }),
            prisma.lMSAssignmentSubmission.deleteMany({ where: { schoolId: id } }),
            prisma.lMSResourceProgress.deleteMany({ where: { schoolId: id } }),
            prisma.lMSChapterProgress.deleteMany({ where: { schoolId: id } }),
            prisma.lMSDiscussion.deleteMany({ where: { schoolId: id } }),
            prisma.lMSAnnouncement.deleteMany({ where: { schoolId: id } }),
            prisma.lMSExam.deleteMany({ where: { schoolId: id } }),
            prisma.lMSLiveClass.deleteMany({ where: { schoolId: id } }),
            prisma.lMSAssignment.deleteMany({ where: { schoolId: id } }),
            prisma.lMSResource.deleteMany({ where: { schoolId: id } }),
            prisma.lMSChapter.deleteMany({ where: { schoolId: id } }),
            prisma.lMSSyllabus.deleteMany({ where: { schoolId: id } }),
            // Fee leaf tables
            prisma.feeAuditLog.deleteMany({ where: { schoolId: id } }),
            prisma.feePaymentAllocation.deleteMany({ where: { schoolId: id } }),
            prisma.feeReminder.deleteMany({ where: { schoolId: id } }),
            prisma.feePayment.deleteMany({ where: { schoolId: id } }),
            prisma.studentFee.deleteMany({ where: { schoolId: id } }),
            prisma.studentScholarship.deleteMany({ where: { schoolId: id } }),
            prisma.feeStructure.deleteMany({ where: { schoolId: id } }),
            prisma.feeCategory.deleteMany({ where: { schoolId: id } }),
            prisma.feeSetting.deleteMany({ where: { schoolId: id } }),
            // Invoice / payment gateways
            prisma.invoice.deleteMany({ where: { schoolId: id } }),
            prisma.schoolPaymentGateway.deleteMany({ where: { schoolId: id } }),
            // Attendance
            prisma.studentAttendance.deleteMany({ where: { schoolId: id } }),
            prisma.teacherAttendance.deleteMany({ where: { schoolId: id } }),
            // Progress reports
            prisma.progressReport.deleteMany({ where: { schoolId: id } }),
            // Timetable
            prisma.timetable.deleteMany({ where: { schoolId: id } }),
            // Enrollment (no direct schoolId — filter via student)
            prisma.studentEnrollment.deleteMany({
                where: { student: { schoolId: id } }
            }),
            // Section-subject-teacher mapping
            prisma.sectionSubjectTeacher.deleteMany({ where: { schoolId: id } }),
            // Sections, then class subjects, then classes
            prisma.section.deleteMany({ where: { schoolId: id } }),
            prisma.classSubject.deleteMany({
                where: { class: { schoolId: id } }
            }),
            prisma.class.deleteMany({ where: { schoolId: id } }),
            // Periods, academic years, subjects
            prisma.period.deleteMany({ where: { schoolId: id } }),
            prisma.academicYear.deleteMany({ where: { schoolId: id } }),
            prisma.subject.deleteMany({ where: { schoolId: id } }),
            // Profiles (depend on User which depends on School)
            prisma.teacherProfile.deleteMany({ where: { schoolId: id } }),
            prisma.parentProfile.deleteMany({ where: { schoolId: id } }),
            prisma.studentProfile.deleteMany({ where: { schoolId: id } }),
            // Users
            prisma.user.deleteMany({ where: { schoolId: id } }),
            // Finally the school itself
            prisma.school.delete({ where: { id } }),
        ]);

        return { id };
    }
}
module.exports = new SchoolService()
