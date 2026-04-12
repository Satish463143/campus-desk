const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Shared selects ────────────────────────────────────────────────────────
const CHAPTER_SELECT = {
  id: true,
  title: true,
  description: true,
  orderIndex: true,
  estimatedMinutes: true,
  publishStatus: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  school: { select: { id: true, schoolName: true } },
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true, numericLevel: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true, code: true } },
  syllabus: { select: { id: true, title: true } },
  _count: {
    select: {
      resources: true,
      assignments: true,
      liveClasses: true,
      exams: true,
    },
  },
};

const CHAPTER_LIST_SELECT = {
  id: true,
  title: true,
  orderIndex: true,
  estimatedMinutes: true,
  publishStatus: true,
  createdAt: true,
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  syllabus: { select: { id: true, title: true } },
  _count: {
    select: {
      resources: true,
      assignments: true,
      liveClasses: true,
      exams: true,
    },
  },
};

// ─── Service ───────────────────────────────────────────────────────────────
class ChapterService {
  /**
   * Create a new LMSChapter.
   */
  async createChapter({
    schoolId,
    academicYearId,
    classId,
    sectionId,
    subjectId,
    syllabusId,
    title,
    description,
    orderIndex,
    estimatedMinutes,
    publishStatus,
    createdBy,
  }) {
    return prisma.lMSChapter.create({
      data: {
        schoolId,
        academicYearId,
        classId,
        sectionId: sectionId || null,
        subjectId,
        syllabusId: syllabusId || null,
        title,
        description,
        orderIndex: orderIndex ?? 0,
        estimatedMinutes: estimatedMinutes || null,
        publishStatus,
        createdBy,
      },
      select: CHAPTER_SELECT,
    });
  }

  /**
   * Paginated list scoped to school with optional filters.
   */
  async listChapters(
    {
      schoolId,
      academicYearId,
      classId,
      sectionId,
      subjectId,
      syllabusId,
      publishStatus,
      search,
    },
    { limit, skip }
  ) {
    const where = {
      schoolId,
      ...(academicYearId && { academicYearId }),
      ...(classId && { classId }),
      ...(sectionId && { sectionId }),
      ...(subjectId && { subjectId }),
      ...(syllabusId && { syllabusId }),
      ...(publishStatus && { publishStatus }),
      ...(search && {
        title: { contains: search, mode: "insensitive" },
      }),
    };

    const [data, count] = await prisma.$transaction([
      prisma.lMSChapter.findMany({
        where,
        select: CHAPTER_LIST_SELECT,
        orderBy: [{ syllabusId: "asc" }, { orderIndex: "asc" }, { createdAt: "desc" }],
        take: limit,
        skip,
      }),
      prisma.lMSChapter.count({ where }),
    ]);

    return { data, count };
  }

  /**
   * Fetch full chapter by id (school-scoped).
   */
  async getChapterById(id, schoolId) {
    return prisma.lMSChapter.findFirst({
      where: { id, schoolId },
      select: CHAPTER_SELECT,
    });
  }

  /**
   * Update a chapter.
   */
  async updateChapter(
    id,
    schoolId,
    {
      academicYearId,
      classId,
      sectionId,
      subjectId,
      syllabusId,
      title,
      description,
      orderIndex,
      estimatedMinutes,
      publishStatus,
      updatedBy,
    }
  ) {
    return prisma.lMSChapter.update({
      where: { id },
      data: {
        ...(academicYearId !== undefined && { academicYearId }),
        ...(classId !== undefined && { classId }),
        ...(sectionId !== undefined && { sectionId: sectionId || null }),
        ...(subjectId !== undefined && { subjectId }),
        ...(syllabusId !== undefined && { syllabusId: syllabusId || null }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(estimatedMinutes !== undefined && { estimatedMinutes: estimatedMinutes || null }),
        ...(publishStatus !== undefined && { publishStatus }),
        updatedBy,
      },
      select: CHAPTER_SELECT,
    });
  }

  /**
   * Delete a chapter by id (school-scoped).
   */
  async deleteChapter(id, schoolId) {
    return prisma.lMSChapter.delete({
      where: { id },
      select: { id: true, title: true },
    });
  }

  // ─── Progress Tracking ──────────────────────────────────────────────────

  async getChapterProgress(chapterId, studentId) {
    return prisma.lMSChapterProgress.findUnique({
      where: {
        chapterId_studentId: { chapterId, studentId },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } }
      }
    });
  }

  async listAllChapterProgress(chapterId, schoolId, filters, pagination) {
    const { limit, skip } = pagination;
    const where = {
      chapterId,
      schoolId,
      ...(filters.studentId && { studentId: filters.studentId }),
      ...(filters.isCompleted !== undefined && { isCompleted: filters.isCompleted }),
    };

    const [data, count] = await prisma.$transaction([
      prisma.lMSChapterProgress.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, rollNumber: true } }
        },
        take: limit,
        skip,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.lMSChapterProgress.count({ where })
    ]);

    return { data, count };
  }

  async upsertChapterProgress(schoolId, chapterId, studentId, data) {
    const now = new Date();
    return prisma.lMSChapterProgress.upsert({
      where: {
        chapterId_studentId: { chapterId, studentId },
      },
      update: {
        ...(data.completionPercent !== undefined && { completionPercent: data.completionPercent }),
        ...(data.isCompleted !== undefined && { 
          isCompleted: data.isCompleted,
          completedAt: data.isCompleted ? now : null
        }),
        lastAccessedAt: now,
      },
      create: {
        schoolId,
        chapterId,
        studentId,
        completionPercent: data.completionPercent || 0,
        isCompleted: data.isCompleted || false,
        startedAt: now,
        lastAccessedAt: now,
        completedAt: data.isCompleted ? now : null,
      },
    });
  }
}

module.exports = new ChapterService();
