const router = require("express").Router();
const schoolRouter = require("../module/schoolRegister/schoolRegister.route")
const authRouter = require("../module/auth/auth.router")
const userRouter = require("../module/user/user.router")
const studentRouter = require("../module/studentProfile/student.router")
const parentRouter = require("../module/parentProfile/parent.route")
const teacherRouter = require("../module/teacher/teacher.router")
const classRouter = require("../module/class/class.route")
const sectionRouter = require("../module/section/section.router")
const academicYearRouter = require("../module/academicYear/academicYear.router")
const subjectRouter = require("../module/subject/subject.router")
const periodRouter = require("../module/periods/periods.route")
const attendanceRouter = require("../module/attendence/attendence.route")
const timeTableRouter = require("../module/timeTable/timeTable.route")
const feeManagementRouter = require("../module/feeManagement/feeManagement.router")

const bulkUploadRouter = require("../module/bulkUpload/bulkUpload.router")


const progressTrackingRouter = require("../module/LMS/progressTracking/progressTracking.router")
const announcementRouter = require("../module/LMS/announcement/announcement.router")
const discussionRouter = require("../module/LMS/discussion/discussion.router")
const assignmentRouter = require("../module/LMS/assignment/assignment.router")
const examRouter = require("../module/LMS/exam/exam.router")
const liveClassRouter = require("../module/LMS/liveClass/liveClass.router")
const chapterRouter = require("../module/LMS/chapter/chapter.router")
const resourceRouter = require("../module/LMS/resource/resource.router")
const syllabusRouter = require("../module/LMS/syllabus/syllabus.router")
const paymentRouter = require("../module/payment/payment.router")
const admissionRouter = require("../module/admission/admission.router")
const invoiceRouter = require("../module/invoice/invoice.router")
const publicPaymentRouter = require("../module/payment/publicPayment.router")
const publicAdmissionRouter = require("../module/publicAdmission/publicAdmission.router")

router.use('/school', schoolRouter)
router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/student', studentRouter)
router.use('/parent', parentRouter)
router.use('/teacher', teacherRouter)
router.use('/classes', classRouter)
router.use('/sections', sectionRouter)
router.use('/academic-years', academicYearRouter)
router.use('/subjects', subjectRouter)
router.use('/periods', periodRouter)
router.use('/attendance', attendanceRouter)
router.use('/time-table', timeTableRouter)
router.use('/fee-management', feeManagementRouter)

router.use('/bulk-upload', bulkUploadRouter)

//lms routes
router.use('/lms/progress-tracking', progressTrackingRouter)
router.use('/lms/announcement', announcementRouter)
router.use('/lms/discussion', discussionRouter)
router.use('/lms/assignment', assignmentRouter)
router.use('/lms/exam', examRouter)
router.use('/lms/live-class', liveClassRouter)
router.use('/lms/chapter', chapterRouter)
router.use('/lms/resource', resourceRouter)
router.use('/lms/syllabus', syllabusRouter)
//payment routes
router.use('/payment', paymentRouter)
router.use('/admission', admissionRouter)
router.use('/invoice', invoiceRouter)
//public payment routes
router.use('/public/pay', publicPaymentRouter)
router.use('/public-admission', publicAdmissionRouter)



module.exports = router;