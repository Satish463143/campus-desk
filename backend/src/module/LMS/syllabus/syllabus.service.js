const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Shared minimal selects ────────────────────────────────────────────────
const SYLLABUS_SELECT = {
  id: true,
  title: true,
  description: true,
  objectives: true,
  publishStatus: true,
  fileKeys: true,
  externalFileUrl: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  school: { select: { id: true, schoolName: true } },
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true, numericLevel: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true, code: true } },
  _count: { select: { chapters: true } },
};

const SYLLABUS_LIST_SELECT = {
  id: true,
  title: true,
  publishStatus: true,
  fileKeys: true,
  externalFileUrl: true,
  createdAt: true,
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  _count: { select: { chapters: true } },
};

// ─── Service ───────────────────────────────────────────────────────────────
class SyllabusService {
  /**
   * Create a new LMSSyllabus.
   */
  async createSyllabus({
    schoolId,
    academicYearId,
    classId,
    sectionId,
    subjectId,
    title,
    description,
    objectives,
    publishStatus,
    fileKeys,
    externalFileUrl,
    createdBy,
  }) {
    return prisma.lMSSyllabus.create({
      data: {
        schoolId,
        academicYearId,
        classId,
        sectionId: sectionId || null,
        subjectId,
        title,
        description,
        objectives,
        publishStatus,
        fileKeys: fileKeys ?? [],
        externalFileUrl: externalFileUrl || null,
        createdBy,
      },
      select: SYLLABUS_SELECT,
    });
  }

  /**
   * Paginated list scoped to school with optional filters.
   */
  async listSyllabus(
    { schoolId, academicYearId, classId, sectionId, subjectId, publishStatus, search },
    { limit, skip }
  ) {
    const where = {
      schoolId,
      ...(academicYearId && { academicYearId }),
      ...(classId && { classId }),
      ...(sectionId && { sectionId }),
      ...(subjectId && { subjectId }),
      ...(publishStatus && { publishStatus }),
      ...(search && {
        title: { contains: search, mode: "insensitive" },
      }),
    };

    const [data, count] = await prisma.$transaction([
      prisma.lMSSyllabus.findMany({
        where,
        select: SYLLABUS_LIST_SELECT,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.lMSSyllabus.count({ where }),
    ]);

    return { data, count };
  }

  /**
   * Fetch full syllabus by id (school-scoped).
   */
  async getSyllabusById(id, schoolId) {
    return prisma.lMSSyllabus.findFirst({
      where: { id, schoolId },
      select: SYLLABUS_SELECT,
    });
  }

  /**
   * Update a syllabus.
   */
  async updateSyllabus(
    id,
    schoolId,
    {
      academicYearId,
      classId,
      sectionId,
      subjectId,
      title,
      description,
      objectives,
      publishStatus,
      fileKeys,
      externalFileUrl,
      updatedBy,
    }
  ) {
    return prisma.lMSSyllabus.update({
      where: { id },
      data: {
        ...(academicYearId !== undefined && { academicYearId }),
        ...(classId !== undefined && { classId }),
        ...(sectionId !== undefined && { sectionId: sectionId || null }),
        ...(subjectId !== undefined && { subjectId }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(objectives !== undefined && { objectives }),
        ...(publishStatus !== undefined && { publishStatus }),
        ...(fileKeys !== undefined && { fileKeys: Array.isArray(fileKeys) ? fileKeys : [fileKeys] }),
        ...(externalFileUrl !== undefined && { externalFileUrl: externalFileUrl || null }),
        updatedBy,
      },
      select: SYLLABUS_SELECT,
    });
  }

  /**
   * Delete a syllabus by id (school-scoped).
   */
  async deleteSyllabus(id, schoolId) {
    return prisma.lMSSyllabus.delete({
      where: { id },
      select: { id: true, title: true },
    });
  }
}

module.exports = new SyllabusService();
