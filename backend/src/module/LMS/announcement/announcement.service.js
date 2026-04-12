const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ANNOUNCEMENT_SELECT = {
  id: true,
  title: true,
  message: true,
  publishStatus: true,
  publishAt: true,
  createdAt: true,
  updatedAt: true,
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  createdBy: true,
};

class AnnouncementService {
  async createAnnouncement(schoolId, createdByUserId, data) {
    return prisma.lMSAnnouncement.create({
      data: {
        schoolId,
        academicYearId: data.academicYearId || null,
        classId: data.classId || null,
        sectionId: data.sectionId || null,
        subjectId: data.subjectId || null,
        title: data.title,
        message: data.message,
        publishStatus: data.publishStatus,
        publishAt: data.publishAt || (data.publishStatus === 'published' ? new Date() : null),
        createdBy: createdByUserId
      },
      select: ANNOUNCEMENT_SELECT
    });
  }

  async updateAnnouncement(id, schoolId, updatedByUserId, data) {
    return prisma.lMSAnnouncement.update({
      where: { id },
      data: {
        ...(data.academicYearId !== undefined && { academicYearId: data.academicYearId }),
        ...(data.classId !== undefined && { classId: data.classId }),
        ...(data.sectionId !== undefined && { sectionId: data.sectionId }),
        ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.message !== undefined && { message: data.message }),
        ...(data.publishStatus !== undefined && { 
             publishStatus: data.publishStatus,
             publishAt: data.publishStatus === 'published' ? new Date() : null
        }),
        updatedBy: updatedByUserId
      },
      select: ANNOUNCEMENT_SELECT
    });
  }

  async getAnnouncementById(id, schoolId) {
    return prisma.lMSAnnouncement.findFirst({
      where: { id, schoolId },
      select: ANNOUNCEMENT_SELECT
    });
  }

  async deleteAnnouncement(id, schoolId) {
    return prisma.lMSAnnouncement.delete({
      where: { id },
      select: { id: true }
    });
  }

  async listAnnouncements(schoolId, filters, pagination) {
     const { limit, skip } = pagination;
     const where = { 
       schoolId,
       ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
       ...(filters.classId && { classId: filters.classId }),
       ...(filters.sectionId && { sectionId: filters.sectionId }),
       ...(filters.subjectId && { subjectId: filters.subjectId }),
       ...(filters.publishStatus && { publishStatus: filters.publishStatus }),
       ...(filters.search && {
          OR: [
             { title: { contains: filters.search, mode: 'insensitive' } },
             { message: { contains: filters.search, mode: 'insensitive' } }
          ]
       })
     };

     if (filters.studentEnrollments && filters.studentEnrollments.length > 0) {
        // Build an OR condition that allows either:
        // 1. A global school announcement (all targets are null)
        // 2. An announcement targeting one of the specific enrollments the student has
        
        const enrollmentOrs = filters.studentEnrollments.map(en => ({
           academicYearId: en.academicYearId,
           OR: [
              { classId: null }, // targeted at whole year
              { 
                classId: en.classId,
                // Either targeted at whole class, or specific section
                OR: [
                   { sectionId: null },
                   { sectionId: en.sectionId }
                ]
              }
           ]
        }));
        
        where.OR = [
           { academicYearId: null, classId: null, sectionId: null, subjectId: null }, // global
           ...enrollmentOrs
        ];
     }

     const [data, count] = await prisma.$transaction([
        prisma.lMSAnnouncement.findMany({
           where,
           select: ANNOUNCEMENT_SELECT,
           orderBy: { createdAt: 'desc' },
           take: limit,
           skip
        }),
        prisma.lMSAnnouncement.count({ where })
     ]);

     return { data, count };
  }
}

module.exports = new AnnouncementService();
