const { PrismaClient } = require("@prisma/client");
const { ExamSubmissionStatus } = require("../../../config/constant.config");
const prisma = new PrismaClient();

// ─── Minimal Selects ───────────────────────────────────────────────────────
const EXAM_SELECT = {
  id: true,
  title: true,
  description: true,
  instructions: true,
  examCategory: true,
  totalMarks: true,
  passMarks: true,
  examDate: true,
  startAt: true,
  endAt: true,
  questionText: true,
  questionFileKeys: true,
  externalQuestionFileUrl: true,
  status: true,
  isPublished: true,
  resultPublished: true,
  createdAt: true,
  updatedAt: true,
  school: { select: { id: true, schoolName: true } },
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true, numericLevel: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true, code: true } },
  chapter: { select: { id: true, name: true } },
  teacher: { select: { id: true, user: { select: { name: true, email: true } } } },
};

const EXAM_LIST_SELECT = {
  id: true,
  title: true,
  examCategory: true,
  totalMarks: true,
  passMarks: true,
  examDate: true,
  startAt: true,
  endAt: true,
  status: true,
  isPublished: true,
  resultPublished: true,
  academicYear: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  teacher: { select: { id: true, user: { select: { name: true } } } },
};

const EXAM_SUBMISSION_SELECT = {
  id: true,
  examId: true,
  studentId: true,
  submittedAt: true,
  status: true,
  isLate: true,
  answerFileKeys: true,
  externalAnswerFileUrl: true,
  marksObtained: true,
  feedback: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      rollNumber: true,
      user: { select: { name: true, email: true } }
    }
  }
};


class ExamService {
  // ─── Exam CRUD ───────────────────────────────────────────────────────────
  async createExam(data) {
    return prisma.lMSExam.create({
      data: {
        schoolId: data.schoolId,
        academicYearId: data.academicYearId,
        classId: data.classId,
        sectionId: data.sectionId || null,
        subjectId: data.subjectId,
        chapterId: data.chapterId || null,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        examCategory: data.examCategory,
        totalMarks: data.totalMarks,
        passMarks: data.passMarks || null,
        examDate: data.examDate || null,
        startAt: data.startAt || null,
        endAt: data.endAt || null,
        questionText: data.questionText || null,
        questionFileKeys: data.questionFileKeys || [],
        externalQuestionFileUrl: data.externalQuestionFileUrl || null,
        status: data.status,
        isPublished: data.isPublished,
        resultPublished: data.resultPublished,
      },
      select: EXAM_SELECT,
    });
  }

  async listExams(
    { schoolId, academicYearId, classId, sectionId, subjectId, teacherId, chapterId, status, examCategory, isPublished, search, fromDate, toDate },
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
      ...(status && { status }),
      ...(examCategory && { examCategory }),
      ...(isPublished !== undefined && { isPublished }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      // Date range filtering on examDate
      ...((fromDate || toDate) && {
        examDate: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate })
        }
      })
    };

    const [data, count] = await prisma.$transaction([
      prisma.lMSExam.findMany({
        where,
        select: {
          ...EXAM_LIST_SELECT,
          _count: { select: { submissions: true } }
        },
        orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip,
      }),
      prisma.lMSExam.count({ where }),
    ]);

    return { data, count };
  }

  async getExamById(id, schoolId) {
    return prisma.lMSExam.findFirst({
      where: { id, schoolId },
      select: EXAM_SELECT,
    });
  }

  async updateExam(id, schoolId, data) {
    return prisma.lMSExam.update({
      where: { id },
      data: {
        ...(data.academicYearId !== undefined && { academicYearId: data.academicYearId }),
        ...(data.classId !== undefined && { classId: data.classId }),
        ...(data.sectionId !== undefined && { sectionId: data.sectionId || null }),
        ...(data.subjectId !== undefined && { subjectId: data.subjectId }),
        ...(data.chapterId !== undefined && { chapterId: data.chapterId || null }),
        ...(data.teacherId !== undefined && { teacherId: data.teacherId }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.instructions !== undefined && { instructions: data.instructions }),
        ...(data.examCategory !== undefined && { examCategory: data.examCategory }),
        ...(data.totalMarks !== undefined && { totalMarks: data.totalMarks }),
        ...(data.passMarks !== undefined && { passMarks: data.passMarks || null }),
        ...(data.examDate !== undefined && { examDate: data.examDate || null }),
        ...(data.startAt !== undefined && { startAt: data.startAt || null }),
        ...(data.endAt !== undefined && { endAt: data.endAt || null }),
        ...(data.questionText !== undefined && { questionText: data.questionText || null }),
        ...(data.questionFileKeys !== undefined && { questionFileKeys: data.questionFileKeys }),
        ...(data.externalQuestionFileUrl !== undefined && { externalQuestionFileUrl: data.externalQuestionFileUrl || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
        ...(data.resultPublished !== undefined && { resultPublished: data.resultPublished }),
      },
      select: EXAM_SELECT,
    });
  }

  async deleteExam(id, schoolId) {
    const exam = await this.getExamById(id, schoolId);
    if (!exam) throw { status: 404, message: "Exam not found" };

    return prisma.lMSExam.delete({
      where: { id },
      select: { id: true, title: true, questionFileKeys: true },
    });
  }

  // ─── Exam Submissions ────────────────────────────────────────────────────
  async submitExam(data) {
    return prisma.lMSExamSubmission.upsert({
      where: {
        examId_studentId: { examId: data.examId, studentId: data.studentId }
      },
      create: {
        schoolId: data.schoolId,
        examId: data.examId,
        studentId: data.studentId,
        submittedAt: data.submittedAt,
        status: data.status,
        isLate: data.isLate,
        answerFileKeys: data.answerFileKeys || [],
        externalAnswerFileUrl: data.externalAnswerFileUrl || null,
      },
      update: {
        submittedAt: data.submittedAt,
        status: data.status,
        isLate: data.isLate,
        ...(data.answerFileKeys !== undefined && { answerFileKeys: data.answerFileKeys }),
        ...(data.externalAnswerFileUrl !== undefined && { externalAnswerFileUrl: data.externalAnswerFileUrl || null }),
      },
      select: EXAM_SUBMISSION_SELECT,
    });
  }

  async listExamSubmissions(examId, schoolId, { limit, skip }) {
    const where = { examId, schoolId };
    const [data, count] = await prisma.$transaction([
      prisma.lMSExamSubmission.findMany({
        where,
        select: EXAM_SUBMISSION_SELECT,
        orderBy: { submittedAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.lMSExamSubmission.count({ where })
    ]);
    return { data, count };
  }
  
  async getExamSubmissionByStudent(examId, studentId, schoolId) {
    return prisma.lMSExamSubmission.findUnique({
      where: { examId_studentId: { examId, studentId } },
      select: EXAM_SUBMISSION_SELECT,
    });
  }
  
  async getExamSubmissionById(id, examId, schoolId) {
    return prisma.lMSExamSubmission.findFirst({
      where: { id, examId, schoolId },
      select: EXAM_SUBMISSION_SELECT,
    });
  }

  async reviewExamSubmission(id, examId, schoolId, teacherId, data) {
    return prisma.lMSExamSubmission.update({
      where: { id },
      data: {
        status: data.status,
        marksObtained: data.marksObtained !== undefined ? data.marksObtained : null,
        feedback: data.feedback !== undefined ? data.feedback : null,
        reviewedAt: new Date(),
        reviewedBy: teacherId,
      },
      select: EXAM_SUBMISSION_SELECT,
    });
  }

  // ─── Submission Stats ──────────────────────────────────────────────────
  async getExamSubmissionStats(examId, schoolId) {
    const defaultStats = { totalSubmissions: 0, pending: 0, submitted: 0, late: 0, reviewed: 0 };

    const stats = await prisma.lMSExamSubmission.groupBy({
      by: ['status'],
      where: { examId, schoolId },
      _count: { _all: true }
    });
    
    const lateCount = await prisma.lMSExamSubmission.count({
      where: { examId, schoolId, isLate: true }
    });

    const result = { ...defaultStats, late: lateCount };
    
    stats.forEach(stat => {
      if (stat.status === ExamSubmissionStatus.PENDING) result.pending = stat._count._all;
      else if (stat.status === ExamSubmissionStatus.SUBMITTED) result.submitted = stat._count._all;
      else if (stat.status === ExamSubmissionStatus.LATE) result.late = stat._count._all;
      else if (stat.status === ExamSubmissionStatus.REVIEWED) result.reviewed = stat._count._all;
      
      result.totalSubmissions += stat._count._all;
    });

    return result;
  }
}

module.exports = new ExamService();