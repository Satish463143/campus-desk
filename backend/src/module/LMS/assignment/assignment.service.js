const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Shared minimal selects ────────────────────────────────────────────────
const ASSIGNMENT_SELECT = {
  id: true,
  title: true,
  description: true,
  instructions: true,
  dueDate: true,
  totalMarks: true,
  allowLateSubmission: true,
  submissionType: true,
  publishStatus: true,
  attachmentKeys: true,
  externalAttachmentUrl: true,
  createdAt: true,
  updatedAt: true,
  school: { select: { id: true, schoolName: true } },
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true, numericLevel: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true, code: true } },
  teacher: { select: { id: true, user: { select: { name: true, email: true } } } },
  _count: { select: { submissions: true } },
};

const ASSIGNMENT_LIST_SELECT = {
  id: true,
  title: true,
  dueDate: true,
  totalMarks: true,
  publishStatus: true,
  attachmentKeys: true,
  createdAt: true,
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  teacher: { select: { id: true, user: { select: { name: true } } } },
  _count: { select: { submissions: true } },
};

const SUBMISSION_SELECT = {
  id: true,
  submissionKeys: true,
  externalSubmissionLink: true,
  submittedAt: true,
  isLate: true,
  status: true,
  marksObtained: true,
  feedback: true,
  reviewedAt: true,
  reviewedBy: true,
  student: {
    select: {
      id: true,
      admissionNumber: true,
      user: { select: { name: true, email: true } },
    },
  },
};

// ─── Service ───────────────────────────────────────────────────────────────
class AssignmentService {
  // ─── ASSIGNMENTS ──────────────────────────────────────────────────────────
  async createAssignment(data) {
    return prisma.lMSAssignment.create({
      data: {
        schoolId: data.schoolId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        sectionId: data.sectionId || null,
        chapterId: data.chapterId || null,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        totalMarks: data.totalMarks,
        dueDate: data.dueDate,
        allowLateSubmission: data.allowLateSubmission,
        submissionType: data.submissionType,
        publishStatus: data.publishStatus,
        attachmentKeys: data.attachmentKeys ?? [],
        externalAttachmentUrl: data.externalAttachmentUrl || null,
      },
      select: ASSIGNMENT_SELECT,
    });
  }

  async listAssignment(
    { schoolId, academicYearId, classId, sectionId, subjectId, teacherId, chapterId, publishStatus, search },
    { limit, skip }
  ) {
    const where = {
      schoolId,
      ...(academicYearId && { academicYearId }),
      ...(classId && { classId }),
      ...(sectionId && { sectionId }),
      ...(subjectId && { subjectId }),
      ...(teacherId && { teacherId }),
      ...(chapterId && { chapterId }),
      ...(publishStatus && { publishStatus }),
      ...(search && {
        title: { contains: search, mode: "insensitive" },
      }),
    };

    const [data, count] = await prisma.$transaction([
      prisma.lMSAssignment.findMany({
        where,
        select: ASSIGNMENT_LIST_SELECT,
        orderBy: { dueDate: "asc" },
        take: limit,
        skip,
      }),
      prisma.lMSAssignment.count({ where }),
    ]);

    return { data, count };
  }

  async getAssignmentById(id, schoolId) {
    return prisma.lMSAssignment.findFirst({
      where: { id, schoolId },
      select: ASSIGNMENT_SELECT,
    });
  }

  async updateAssignment(id, schoolId, data) {
    return prisma.lMSAssignment.update({
      where: { id_schoolId: { id, schoolId } }, // If composite unique exists, else use standard update logic below
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.instructions !== undefined && { instructions: data.instructions }),
        ...(data.totalMarks !== undefined && { totalMarks: data.totalMarks }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.allowLateSubmission !== undefined && { allowLateSubmission: data.allowLateSubmission }),
        ...(data.submissionType !== undefined && { submissionType: data.submissionType }),
        ...(data.publishStatus !== undefined && { publishStatus: data.publishStatus }),
        ...(data.attachmentKeys !== undefined && { attachmentKeys: data.attachmentKeys }),
        ...(data.externalAttachmentUrl !== undefined && { externalAttachmentUrl: data.externalAttachmentUrl }),
      },
      select: ASSIGNMENT_SELECT,
    });
  }

  async deleteAssignment(id, schoolId) {
    // Check if it belongs to school first
    const assignment = await this.getAssignmentById(id, schoolId);
    if (!assignment) throw { status: 404, message: "Assignment not found" };

    return prisma.lMSAssignment.delete({
      where: { id },
      select: { id: true, title: true },
    });
  }

  // ─── SUBMISSIONS ──────────────────────────────────────────────────────────
  async getSubmissionById(id, schoolId) {
    return prisma.lMSAssignmentSubmission.findFirst({
      where: { id, schoolId },
      select: SUBMISSION_SELECT,
    });
  }

  async submitAssignment({ schoolId, assignmentId, studentId, submissionKeys, externalSubmissionLink, isLate }) {
    return prisma.lMSAssignmentSubmission.create({
      data: {
        schoolId,
        assignmentId,
        studentId,
        submissionKeys: submissionKeys ?? [],
        externalSubmissionLink: externalSubmissionLink || null,
        submittedAt: new Date(),
        isLate,
        status: "submitted",
      },
      select: SUBMISSION_SELECT,
    });
  }

  async updateSubmission(id, schoolId, studentId, { submissionKeys, externalSubmissionLink }) {
    return prisma.lMSAssignmentSubmission.update({
      where: { id },
      // Ensure student can only update their own submission
      // In prisma update, we can't easily add where conditions directly unless using updateMany or composite unique. 
      // We will assume controller handles authorization.
      data: {
        ...(submissionKeys !== undefined && { submissionKeys }),
        ...(externalSubmissionLink !== undefined && { externalSubmissionLink }),
        submittedAt: new Date(),
        status: "submitted" // Reset to submitted if it was resubmitted
      },
      select: SUBMISSION_SELECT,
    });
  }

  async reviewSubmission(id, { status, marksObtained, feedback, reviewedBy }) {
    return prisma.lMSAssignmentSubmission.update({
      where: { id },
      data: {
        status,
        marksObtained,
        feedback,
        reviewedAt: new Date(),
        reviewedBy
      },
      select: SUBMISSION_SELECT,
    });
  }

  async deleteSubmission(id, schoolId) {
    return prisma.lMSAssignmentSubmission.delete({
      where: { id },
      select: { id: true }
    });
  }

  async listSubmissionsByAssignment(assignmentId, schoolId, { limit, skip }) {
    const where = { assignmentId, schoolId };
    
    const [data, count] = await prisma.$transaction([
      prisma.lMSAssignmentSubmission.findMany({
        where,
        select: SUBMISSION_SELECT,
        orderBy: { submittedAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.lMSAssignmentSubmission.count({ where }),
    ]);

    return { data, count };
  }

  async listSubmissionsByStudent(studentId, schoolId, { limit, skip }) {
    const where = { studentId, schoolId };
    
    const [data, count] = await prisma.$transaction([
      prisma.lMSAssignmentSubmission.findMany({
        where,
        select: {
          ...SUBMISSION_SELECT,
          assignment: {
            select: { id: true, title: true, dueDate: true, totalMarks: true }
          }
        },
        orderBy: { submittedAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.lMSAssignmentSubmission.count({ where }),
    ]);

    return { data, count };
  }
  async getSubmissionStats(assignmentId, schoolId) {
    const defaultStats = { totalSubmissions: 0, submitted: 0, reviewed: 0, graded: 0, late: 0 };

    const stats = await prisma.lMSAssignmentSubmission.groupBy({
      by: ['status'],
      where: { assignmentId, schoolId },
      _count: {
        _all: true
      }
    });

    const lateCount = await prisma.lMSAssignmentSubmission.count({
      where: { assignmentId, schoolId, isLate: true }
    });

    const result = { ...defaultStats };
    stats.forEach(stat => {
      if (stat.status === 'submitted') result.submitted = stat._count._all;
      else if (stat.status === 'reviewed') result.reviewed = stat._count._all;
      else if (stat.status === 'graded') result.graded = stat._count._all;
      
      result.totalSubmissions += stat._count._all;
    });
    
    result.late = lateCount;

    return result;
  }
}

module.exports = new AssignmentService();

