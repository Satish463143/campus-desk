const announcementService = require("./announcement.service");
const { Role, LMSPublishStatus } = require("../../../config/constant.config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class AnnouncementController {
  
  #validate = async (id, schoolId) => {
    if (!id) throw { status: 400, message: "Announcement ID is required" };
    const announcement = await announcementService.getAnnouncementById(id, schoolId);
    if (!announcement) throw { status: 404, message: "Announcement not found" };
    return announcement;
  };

  createAnnouncement = async (req, res, next) => {
    try {
      const createdByUserId = req.authUser.id;
      const result = await announcementService.createAnnouncement(
        req.authUser.schoolId, 
        createdByUserId, 
        req.body
      );

      res.status(201).json({
        message: "Announcement created successfully",
        result,
        meta: null
      });
    } catch (error) {
      next(error);
    }
  };

  updateAnnouncement = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);
      const updatedByUserId = req.authUser.id;

      const result = await announcementService.updateAnnouncement(
        req.params.id,
        req.authUser.schoolId,
        updatedByUserId,
        req.body
      );

      res.json({
        message: "Announcement updated successfully",
        result,
        meta: null
      });
    } catch (error) {
       next(error);
    }
  };

  getAnnouncementById = async (req, res, next) => {
    try {
      const result = await this.#validate(req.params.id, req.authUser.schoolId);
      
      // If student/parent, verify they are allowed to see draft?
      // Generally, readers should only fetch PUBLISHED announcements unless they are writers.
      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isWriter && result.publishStatus !== LMSPublishStatus.PUBLISHED) {
         throw { status: 403, message: "You don't have permission to view this announcement" };
      }

      res.json({
        message: "Announcement fetched successfully",
        result,
        meta: null
      });
    } catch(error) {
       next(error);
    }
  };

  deleteAnnouncement = async (req, res, next) => {
    try {
      await this.#validate(req.params.id, req.authUser.schoolId);
      await announcementService.deleteAnnouncement(req.params.id, req.authUser.schoolId);

      res.json({
        message: "Announcement deleted successfully",
        result: null,
        meta: null
      });
    } catch(error) {
       next(error);
    }
  };

  listAnnouncements = async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;

      const filters = {
        academicYearId: req.query.academicYearId,
        classId: req.query.classId,
        sectionId: req.query.sectionId,
        subjectId: req.query.subjectId,
        publishStatus: req.query.publishStatus,
        search: req.query.search
      };

      const isWriter = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.TEACHER, Role.SUPER_ADMIN].includes(req.authUser.role);
      
      // Readers only see published
      if (!isWriter) {
         filters.publishStatus = LMSPublishStatus.PUBLISHED;
      }

      // If Student, only show global ones + ones matching their enrollments
      if (req.authUser.role === Role.STUDENT) {
         const studentId = req.authUser.studentProfile?.id;
         if (!studentId) throw { status: 403, message: "Student profile not found." };
         
         const enrollments = await prisma.studentEnrollment.findMany({
            where: { studentId },
            select: { academicYearId: true, classId: true, sectionId: true }
         });
         filters.studentEnrollments = enrollments;
      }

      const { data, count } = await announcementService.listAnnouncements(
        req.authUser.schoolId,
        filters,
        { limit, skip }
      );

      res.json({
        message: "Announcements fetched successfully",
        result: data,
        meta: { currentPage: page, limit, total: count }
      });
    } catch(error) {
       next(error);
    }
  };

  listAnnouncementsByStudent = async (req, res, next) => {
    try {
       const studentId = req.authUser.studentProfile?.id;
       if (!studentId) throw { status: 403, message: "Student profile not found." };
       req.query.studentId = studentId; // For potential internal use, but we rely on authUser directly above
       return this.listAnnouncements(req, res, next);
    } catch (error) {
       next(error);
    }
  };

  listAnnouncementsByParent = async (req, res, next) => {
    try {
       // A parent views a specific child's announcements
       const studentId = req.params.studentId;
       if (!studentId) throw { status: 400, message: "Student ID is required." };
       
       // Override the auth user's role temporarily in the request context specifically for the filter logic in listAnnouncements
       // This simulates the query as if the child was querying it.
       req.authUser.role = Role.STUDENT;
       req.authUser.studentProfile = { id: studentId };
       
       return this.listAnnouncements(req, res, next);
    } catch (error) {
       next(error);
    }
  };
}

module.exports = new AnnouncementController();
