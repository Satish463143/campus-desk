const { PrismaClient } = require("@prisma/client");
const PDFDocument = require("pdfkit");
const prisma = new PrismaClient();

class ProgressTrackingService {
  async #calculateStudentProgress(schoolId, academicYearId, studentId) {
    // Attendance
    const attendanceRecords = await prisma.studentAttendance.findMany({
      where: { schoolId, academicYearId, studentId }
    });
    let attended = 0;
    attendanceRecords.forEach(record => {
      if (record.status === 'present' || record.status === 'late') attended++;
    });
    const totalDays = attendanceRecords.length;
    const attendanceScore = totalDays > 0 ? (attended / totalDays) * 100 : 0;

    // Assignments
    const assignmentSubmissions = await prisma.lMSAssignmentSubmission.findMany({
      where: { schoolId, studentId, status: { in: ['reviewed', 'graded'] }, assignment: { academicYearId } },
      include: { assignment: true }
    });
    let assignEarned = 0;
    let assignMax = 0;
    assignmentSubmissions.forEach(sub => {
      if (sub.marksObtained != null && sub.assignment.totalMarks) {
        assignEarned += sub.marksObtained;
        assignMax += sub.assignment.totalMarks;
      }
    });
    const assignmentScore = assignMax > 0 ? (assignEarned / assignMax) * 100 : 0;

    // Exams
    const examSubmissions = await prisma.lMSExamSubmission.findMany({
      where: { schoolId, studentId, status: 'reviewed', exam: { academicYearId } },
      include: { exam: true }
    });
    let examEarned = 0;
    let examMax = 0;
    examSubmissions.forEach(sub => {
       if (sub.marksObtained != null && sub.exam.totalMarks) {
         examEarned += sub.marksObtained;
         examMax += sub.exam.totalMarks;
       }
    });
    const examScore = examMax > 0 ? (examEarned / examMax) * 100 : 0;

    // Overall Score
    const overallScore = (attendanceScore * 0.10) + (assignmentScore * 0.30) + (examScore * 0.60);

    // Grade
    let grade = 'D';
    if (overallScore >= 90) grade = 'A+';
    else if (overallScore >= 80) grade = 'A';
    else if (overallScore >= 70) grade = 'B+';
    else if (overallScore >= 60) grade = 'B';
    else if (overallScore >= 50) grade = 'C+';
    else if (overallScore >= 40) grade = 'C';

    return {
      attendanceScore: Number(attendanceScore.toFixed(2)),
      assignmentScore: Number(assignmentScore.toFixed(2)),
      examScore: Number(examScore.toFixed(2)),
      overallScore: Number(overallScore.toFixed(2)),
      grade,
      details: {
         totalAttendanceDays: totalDays,
         attendedDays: attended,
         assignmentsCalculated: assignmentSubmissions.length,
         examsCalculated: examSubmissions.length
      }
    };
  }

  async getDynamicStudentProgress(schoolId, academicYearId, studentId) {
    const progress = await this.#calculateStudentProgress(schoolId, academicYearId, studentId);
    
    const student = await prisma.studentProfile.findFirst({
       where: { id: studentId, schoolId },
       include: { user: { select: { name: true, email: true } } } 
    });

    return { 
      studentId, 
      studentName: student?.user?.name, 
      ...progress 
    };
  }

  async getDynamicSectionProgress(schoolId, academicYearId, sectionId) {
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { academicYearId, sectionId },
      include: { student: { include: { user: { select: { name: true } } } } }
    });

    const results = [];
    for (const en of enrollments) {
       const progress = await this.#calculateStudentProgress(schoolId, academicYearId, en.studentId);
       results.push({
          studentId: en.studentId,
          studentName: en.student.user.name,
          rollNumber: en.rollNumber,
          ...progress
       });
    }
    return results;
  }

  async generateProgressReport(schoolId, createdBy, data) {
     const { academicYearId, classId, sectionId, studentId, title, remarks } = data;
     
     const reports = [];
     let studentsToProcess = [];

     if (studentId) {
        studentsToProcess.push(studentId);
     } else {
        const enrollments = await prisma.studentEnrollment.findMany({
           where: { academicYearId, sectionId }
        });
        studentsToProcess = enrollments.map(e => e.studentId);
     }

     for (const sid of studentsToProcess) {
        const progress = await this.#calculateStudentProgress(schoolId, academicYearId, sid);

        const report = await prisma.progressReport.create({
           data: {
              schoolId,
              studentId: sid,
              academicYearId,
              classId,
              sectionId,
              title,
              attendanceScore: progress.attendanceScore,
              assignmentScore: progress.assignmentScore,
              examScore: progress.examScore,
              overallScore: progress.overallScore,
              grade: progress.grade,
              remarks: remarks || null,
              details: progress.details,
              createdBy
           }
        });
        reports.push(report);
     }
     return reports;
  }

  async listSavedReports(schoolId, filters, pagination) {
     const { limit, skip } = pagination;
     const where = { 
        schoolId, 
        ...(filters.studentId && { studentId: filters.studentId }),
        ...(filters.academicYearId && { academicYearId: filters.academicYearId }),
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.sectionId && { sectionId: filters.sectionId }),
     };

     const [data, count] = await prisma.$transaction([
       prisma.progressReport.findMany({
         where,
         include: {
            student: { include: { user: { select: { name: true, email: true } } } },
            class: { select: { name: true } },
            section: { select: { name: true } },
            academicYear: { select: { name: true } }
         },
         orderBy: { createdAt: 'desc' },
         take: limit,
         skip
       }),
       prisma.progressReport.count({ where })
     ]);

     return { data, count };
  }

  async generatePDFStream(reportId, schoolId, res) {
     const report = await prisma.progressReport.findFirst({
        where: { id: reportId, schoolId },
        include: {
            student: { include: { user: { select: { name: true, email: true } } } },
            school: true,
            class: { select: { name: true } },
            section: { select: { name: true } },
            academicYear: { select: { name: true } }
        }
     });

     if (!report) throw { status: 404, message: "Report not found" };

     const doc = new PDFDocument({ margin: 50 });
     res.setHeader('Content-Type', 'application/pdf');
     res.setHeader('Content-Disposition', `attachment; filename="progress_report_${report.student.user.name.replace(/\s+/g, '_')}.pdf"`);

     doc.pipe(res);

     // Header
     doc.fontSize(20).text(report.school.schoolName, { align: 'center' });
     doc.moveDown();
     doc.fontSize(16).text(report.title, { align: 'center', underline: true });
     doc.moveDown(2);

     // Student Info
     doc.fontSize(12).text(`Student Name: ${report.student.user.name}`);
     doc.text(`Academic Year: ${report.academicYear.name}`);
     doc.text(`Class: ${report.class.name} - ${report.section.name}`);
     doc.moveDown(2);

     // Scores
     doc.fontSize(14).text('Performance Summary', { underline: true });
     doc.moveDown();
     doc.fontSize(12);
     doc.text(`Attendance Score (10%): ${report.attendanceScore}%`);
     doc.text(`Assignment Score (30%): ${report.assignmentScore}%`);
     doc.text(`Exam Score (60%): ${report.examScore}%`);
     doc.moveDown();
     
     doc.fontSize(16).text(`Overall Score: ${report.overallScore}%`);
     doc.text(`Final Grade: ${report.grade}`);

     if (report.remarks) {
        doc.moveDown();
        doc.fontSize(12).text(`Remarks: ${report.remarks}`);
     }

     doc.moveDown(2);
     doc.fontSize(10).text(`Generated On: ${report.createdAt.toDateString()}`, { align: 'right' });

     doc.end();
  }
}

module.exports = new ProgressTrackingService();
