const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Shared selects ────────────────────────────────────────────────────────
const RESOURCE_SELECT = {
  id: true,
  type: true,
  title: true,
  description: true,
  fileKeys: true,
  externalUrl: true,
  publishStatus: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  school: { select: { id: true, schoolName: true } },
  chapter: { select: { id: true, title: true } },
};

const RESOURCE_LIST_SELECT = {
  id: true,
  type: true,
  title: true,
  fileKeys: true,
  externalUrl: true,
  publishStatus: true,
  createdAt: true,
  chapter: { select: { id: true, title: true } },
};

// ─── Service ───────────────────────────────────────────────────────────────
class ResourceService {
  /**
   * Create a new LMSResource.
   */
  async createResource({
    schoolId,
    chapterId,
    type,
    title,
    description,
    fileKeys,
    externalUrl,
    publishStatus,
    createdBy,
  }) {
    return prisma.lMSResource.create({
      data: {
        schoolId,
        chapterId: chapterId || null,
        type,
        title,
        description,
        fileKeys: fileKeys ?? [],
        externalUrl: externalUrl || null,
        publishStatus,
        createdBy,
      },
      select: RESOURCE_SELECT,
    });
  }

  /**
   * Paginated list scoped to school with optional filters.
   */
  async listResources(
    { schoolId, chapterId, type, publishStatus, search },
    { limit, skip }
  ) {
    const where = {
      schoolId,
      ...(chapterId && { chapterId }),
      ...(type && { type }),
      ...(publishStatus && { publishStatus }),
      ...(search && { title: { contains: search, mode: "insensitive" } }),
    };

    const [data, count] = await prisma.$transaction([
      prisma.lMSResource.findMany({
        where,
        select: RESOURCE_LIST_SELECT,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.lMSResource.count({ where }),
    ]);

    return { data, count };
  }

  /**
   * Fetch full resource by id (school-scoped).
   */
  async getResourceById(id, schoolId) {
    return prisma.lMSResource.findFirst({
      where: { id, schoolId },
      select: RESOURCE_SELECT,
    });
  }

  /**
   * Update a resource.
   */
  async updateResource(
    id,
    schoolId,
    {
      chapterId,
      type,
      title,
      description,
      fileKeys,
      externalUrl,
      publishStatus,
      updatedBy,
    }
  ) {
    return prisma.lMSResource.update({
      where: { id },
      data: {
        ...(chapterId !== undefined && { chapterId: chapterId || null }),
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(fileKeys !== undefined && {
          fileKeys: Array.isArray(fileKeys) ? fileKeys : [fileKeys],
        }),
        ...(externalUrl !== undefined && { externalUrl: externalUrl || null }),
        ...(publishStatus !== undefined && { publishStatus }),
        updatedBy,
      },
      select: RESOURCE_SELECT,
    });
  }

  /**
   * Delete a resource.
   */
  async deleteResource(id) {
    return prisma.lMSResource.delete({
      where: { id },
      select: { id: true, title: true, type: true },
    });
  }
}

module.exports = new ResourceService();
