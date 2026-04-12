const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DISCUSSION_SELECT = {
  id: true,
  title: true,
  message: true,
  targetType: true,
  targetId: true,
  isClosed: true,
  createdAt: true,
  updatedAt: true,
  createdByUserId: true,
  school: { select: { id: true, name: true } },
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  chapter: { select: { id: true, name: true } },
  _count: {
    select: { replies: true }
  }
};

const REPLY_SELECT = {
  id: true,
  discussionId: true,
  createdByUserId: true,
  message: true,
  createdAt: true,
  updatedAt: true
};

class DiscussionService {
  async createDiscussion(schoolId, createdByUserId, data) {
    return prisma.lMSDiscussion.create({
      data: {
        schoolId,
        createdByUserId,
        title: data.title,
        message: data.message,
        targetType: data.targetType,
        targetId: data.targetId || null,
        academicYearId: data.academicYearId || null,
        classId: data.classId || null,
        sectionId: data.sectionId || null,
        subjectId: data.subjectId || null,
        chapterId: data.chapterId || null,
      },
      select: DISCUSSION_SELECT
    });
  }

  async updateDiscussion(id, schoolId, data) {
    return prisma.lMSDiscussion.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.message !== undefined && { message: data.message }),
        ...(data.isClosed !== undefined && { isClosed: data.isClosed }),
      },
      select: DISCUSSION_SELECT
    });
  }

  async getDiscussionById(id, schoolId) {
    return prisma.lMSDiscussion.findFirst({
      where: { id, schoolId },
      include: {
        school: { select: { id: true, name: true } },
        academicYear: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          select: REPLY_SELECT
        }
      }
    });
  }

  async deleteDiscussion(id, schoolId) {
    // Transaction to delete replies first or rely on onDelete: Cascade if configured in DB
    // Prisma doesn't always handle cascade in client-side unless specified.
    return prisma.$transaction(async (tx) => {
        await tx.lMSDiscussionReply.deleteMany({ where: { discussionId: id } });
        return tx.lMSDiscussion.delete({
            where: { id },
            select: { id: true }
        });
    });
  }

  async listDiscussions(schoolId, filters, pagination) {
    const { limit, skip } = pagination;
    const where = {
      schoolId,
      ...(filters.targetType && { targetType: filters.targetType }),
      ...(filters.targetId && { targetId: filters.targetId }),
      ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
      ...(filters.classId && { classId: filters.classId }),
      ...(filters.sectionId && { sectionId: filters.sectionId }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(filters.chapterId && { chapterId: filters.chapterId }),
      ...(filters.isClosed !== undefined && { isClosed: filters.isClosed }),
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { message: { contains: filters.search, mode: 'insensitive' } }
        ]
      })
    };

    const [data, count] = await prisma.$transaction([
      prisma.lMSDiscussion.findMany({
        where,
        select: DISCUSSION_SELECT,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.lMSDiscussion.count({ where })
    ]);

    return { data, count };
  }

  // ─── Replies ───

  async createReply(discussionId, createdByUserId, data) {
    return prisma.lMSDiscussionReply.create({
      data: {
        discussionId,
        createdByUserId,
        message: data.message
      },
      select: REPLY_SELECT
    });
  }

  async updateReply(id, createdByUserId, data) {
    return prisma.lMSDiscussionReply.update({
      where: { id },
      data: {
        message: data.message
      },
      select: REPLY_SELECT
    });
  }

  async deleteReply(id) {
    return prisma.lMSDiscussionReply.delete({
      where: { id },
      select: { id: true }
    });
  }

  async getReplyById(id) {
    return prisma.lMSDiscussionReply.findUnique({
        where: { id },
        select: REPLY_SELECT
    });
  }
}

module.exports = new DiscussionService();
