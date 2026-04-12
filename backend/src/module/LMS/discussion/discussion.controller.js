const discussionService = require("./discussion.service");
const { Role } = require("../../../config/constant.config");

class DiscussionController {
  
  #validateDiscussion = async (id, schoolId) => {
    if (!id) throw { status: 400, message: "Discussion ID is required" };
    const discussion = await discussionService.getDiscussionById(id, schoolId);
    if (!discussion) throw { status: 404, message: "Discussion not found" };
    return discussion;
  };

  #validateReply = async (id) => {
    const reply = await discussionService.getReplyById(id);
    if (!reply) throw { status: 404, message: "Reply not found" };
    return reply;
  };

  createDiscussion = async (req, res, next) => {
    try {
      const createdByUserId = req.authUser.id;
      const result = await discussionService.createDiscussion(
        req.authUser.schoolId,
        createdByUserId,
        req.body
      );

      res.status(201).json({
        message: "Discussion thread created successfully",
        result,
        meta: null
      });
    } catch (error) {
      next(error);
    }
  };

  updateDiscussion = async (req, res, next) => {
    try {
      const discussion = await this.#validateDiscussion(req.params.id, req.authUser.schoolId);
      
      // Only creator or admin/teacher can update?
      // Usually, Student can only update their OWN. Staff can update any for moderation.
      const isStaff = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.SUPER_ADMIN, Role.TEACHER].includes(req.authUser.role);
      if (!isStaff && discussion.createdByUserId !== req.authUser.id) {
        throw { status: 403, message: "You are not authorized to update this discussion" };
      }

      const result = await discussionService.updateDiscussion(req.params.id, req.authUser.schoolId, req.body);

      res.json({
        message: "Discussion updated successfully",
        result,
        meta: null
      });
    } catch (error) {
      next(error);
    }
  };

  getDiscussionById = async (req, res, next) => {
    try {
      const result = await this.#validateDiscussion(req.params.id, req.authUser.schoolId);
      res.json({
        message: "Discussion fetched successfully",
        result,
        meta: null
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDiscussion = async (req, res, next) => {
    try {
      const discussion = await this.#validateDiscussion(req.params.id, req.authUser.schoolId);
      
      const isStaff = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.SUPER_ADMIN, Role.TEACHER].includes(req.authUser.role);
      if (!isStaff && discussion.createdByUserId !== req.authUser.id) {
        throw { status: 403, message: "You are not authorized to delete this discussion" };
      }

      await discussionService.deleteDiscussion(req.params.id, req.authUser.schoolId);

      res.json({
        message: "Discussion deleted successfully",
        result: null,
        meta: null
      });
    } catch (error) {
      next(error);
    }
  };

  listDiscussions = async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const skip = (page - 1) * limit;

      const filters = {
        targetType: req.query.targetType,
        targetId: req.query.targetId,
        academicYearId: req.query.academicYearId,
        classId: req.query.classId,
        sectionId: req.query.sectionId,
        subjectId: req.query.subjectId,
        chapterId: req.query.chapterId,
        isClosed: req.query.isClosed === 'true' ? true : req.query.isClosed === 'false' ? false : undefined,
        search: req.query.search
      };

      const { data, count } = await discussionService.listDiscussions(
        req.authUser.schoolId,
        filters,
        { limit, skip }
      );

      res.json({
        message: "Discussions fetched successfully",
        result: data,
        meta: { currentPage: page, limit, total: count }
      });
    } catch (error) {
      next(error);
    }
  };

  // ─── Reply Controllers ───

  createReply = async (req, res, next) => {
    try {
      const discussion = await this.#validateDiscussion(req.params.id, req.authUser.schoolId);
      
      if (discussion.isClosed) {
        throw { status: 400, message: "Cannot reply to a closed discussion" };
      }

      const result = await discussionService.createReply(
        req.params.id,
        req.authUser.id,
        req.body
      );

      res.status(201).json({
        message: "Reply added successfully",
        result,
        meta: null
      });
    } catch (error) {
      next(error);
    }
  };

  updateReply = async (req, res, next) => {
    try {
      const reply = await this.#validateReply(req.params.replyId);
      
      const isStaff = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.SUPER_ADMIN].includes(req.authUser.role);
      if (!isStaff && reply.createdByUserId !== req.authUser.id) {
        throw { status: 403, message: "You are not authorized to update this reply" };
      }

      const result = await discussionService.updateReply(req.params.replyId, req.authUser.id, req.body);

      res.json({
        message: "Reply updated successfully",
        result,
        meta: null
      });
    } catch (error) {
      next(error);
    }
  };

  deleteReply = async (req, res, next) => {
    try {
      const reply = await this.#validateReply(req.params.replyId);
      
      const isStaff = [Role.ADMIN_STAFF, Role.PRINCIPAL, Role.SUPER_ADMIN, Role.TEACHER].includes(req.authUser.role);
      if (!isStaff && reply.createdByUserId !== req.authUser.id) {
        throw { status: 403, message: "You are not authorized to delete this reply" };
      }

      await discussionService.deleteReply(req.params.replyId);

      res.json({
        message: "Reply deleted successfully",
        result: null,
        meta: null
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new DiscussionController();
