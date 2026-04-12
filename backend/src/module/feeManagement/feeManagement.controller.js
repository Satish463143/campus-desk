const feeManagementService = require("./feeManagement.service");
const { Role } = require("../../config/constant.config");

class FeeManagementController {
    _getSchoolId(req) {
        return req.authUser.schoolId;
    }

    createFeeCategory = async (req, res, next) => {
        try {
        const response = await feeManagementService.createFeeCategory(this._getSchoolId(req), req.body, req.authUser);
        res.json({
            meta:null,
            message: "Fee category created successfully",
            result:response
        });
        } catch (error) {
        next(error);
        }
    };

    getFeeCategories = async (req, res, next) => {
        try {
        const response = await feeManagementService.getFeeCategories(this._getSchoolId(req));
        res.json({
            meta:null,
            message: "Fee categories fetched successfully",
            result:response
        });
        } catch (error) {
        next(error);
        }
    };
    getFeeCategoryById = async (req,res,next)=>{
        try{
            const id  = req.params.id;
            const response = await feeManagementService.getFeeCategoryById(this._getSchoolId(req), id);
            res.json({
                meta:null,
                message: "Fee category fetched successfully",
                result:response
            });
        }catch(error){
            next(error)
        }
    }
    updateFeeCategory = async(req,res,next)=>{
        try{
            const id  = req.params.id;
            const response = await feeManagementService.updateFeeCategory(this._getSchoolId(req), id, req.body, req.authUser);
            res.json({
                meta:null,
                message: "Fee category updated successfully",
                result:response
            });

        }catch(error){
            next(error)
        }
    }

    deleteFeeCategory = async (req, res, next) => {
        try {
            const response = await feeManagementService.deleteFeeCategory(this._getSchoolId(req), req.params.id, req.authUser);
            res.json({ meta: null, message: "Fee category deleted successfully", result: response });
        } catch (error) {
            next(error);
        }
    };

    createFeeStructure = async (req, res, next) => {
        try {
        const response = await feeManagementService.createFeeStructure(this._getSchoolId(req), req.body, req.authUser);
        res.json({
            meta:null,
            message: "Fee structure created successfully",
            result:response
        });
        } catch (error) {
        next(error);
        }
    };

    getFeeStructures = async (req, res, next) => {
        try {
        const { classId, academicYearId } = req.query;
        const response = await feeManagementService.getFeeStructures(this._getSchoolId(req), {
            classId,
            academicYearId
        });
        res.json({
            meta:null,
            message: "Fee structures fetched successfully",
            result:response
        });
        } catch (error) {
        next(error);
        }
    };
    getFeeStructureById = async (req,res,next)=>{
        try{
            const id  = req.params.id;
            const response = await feeManagementService.getFeeStructureById(this._getSchoolId(req), id);
            res.json({
                meta:null,
                message: "Fee structure fetched successfully",
                result:response
            });
        }catch(error){
            next(error)
        }
    }
    updateFeeStructure = async(req,res,next)=>{
        try{
            const id  = req.params.id;
            const response = await feeManagementService.updateFeeStructure(this._getSchoolId(req), id, req.body, req.authUser);
            res.json({
                meta:null,
                message: "Fee structure updated successfully",
                result:response
            });

        }catch(error){
            next(error)
        }
    }

    deleteFeeStructure = async (req, res, next) => {
        try {
            const response = await feeManagementService.deleteFeeStructure(this._getSchoolId(req), req.params.id, req.authUser);
            res.json({ meta: null, message: "Fee structure deleted successfully", result: response });
        } catch (error) {
            next(error);
        }
    };

    upsertFeeSetting = async (req, res, next) => {
        try {
        const response = await feeManagementService.upsertFeeSetting(this._getSchoolId(req), req.body, req.authUser);
        res.json({
            meta:null,
            message: "Fee setting saved successfully",
            result:response
        });
        } catch (error) {
        next(error);
        }
    };

    getFeeSetting = async (req, res, next) => {
        try {
        const response = await feeManagementService.getFeeSetting(this._getSchoolId(req));
        res.json({
            meta:null,
            message: "Fee setting fetched successfully",
            result:response
        });
        } catch (error) {
        next(error);
        }
    };

    assignStudentFee = async (req, res, next) => {
        try {
        const response = await feeManagementService.assignStudentFee(this._getSchoolId(req), req.body, req.authUser);
        res.json({
            meta:null,
            message: "Student fee assigned successfully",
            result:response
        });
        } catch (error) {
        next(error);
        }
    };

    bulkAssignStudentFees = async (req, res, next) => {
        try {
        const response = await feeManagementService.bulkAssignStudentFees(this._getSchoolId(req), req.body, req.authUser);
        res.json({
            meta:null,
            message: "Bulk fee assignment completed",
            result:response
        });
        } catch (error) {
        next(error);
        }
    };

    getStudentFees = async (req, res, next) => {
        try {
        const schoolId = this._getSchoolId(req);
        const requestedStudentId = req.params.studentId;
        const authUser = req.authUser;

        let studentId = requestedStudentId;

        if (authUser.role === Role.STUDENT) {
            studentId = authUser.studentProfileId;
        }

        const response = await feeManagementService.getStudentFees(schoolId, studentId, {
            page: req.query.page,
            limit: req.query.limit,
            status: req.query.status
        }, authUser);

        res.json({
            result:response,
            message:"Student fees fetched successfully",
            meta:{
                currentPage:response.pagination?.page,
                total:response.pagination?.total,
                limit:response.pagination?.limit
            }
        });
        } catch (error) {
        next(error);
        }
    };

    getParentFees = async (req, res, next) => {
        try {
        const schoolId = this._getSchoolId(req);
        const authUser = req.authUser;
        let parentId = req.params.parentId;

        if (authUser.role === Role.PARENT) {
            parentId = authUser.parentProfileId;
        }

        const response = await feeManagementService.getParentFees(schoolId, parentId, authUser);
        res.json({
            result:response,
            message:"Parent fees fetched successfully",
            meta:null
        });
        } catch (error) {
        next(error);
        }
    };

    upsertScholarship = async (req, res, next) => {
        try {
        const response = await feeManagementService.upsertScholarship(this._getSchoolId(req), req.body, req.authUser);
        res.json({
            result:response,
            message:"Scholarship saved successfully",
            meta:null
        });
        } catch (error) {
        next(error);
        }
    };

    getActiveScholarships = async (req, res, next) => {
        try {
        const response = await feeManagementService.getActiveScholarships(this._getSchoolId(req), req.params.studentId);
        res.json({
            result: response,
            message: "Active scholarships fetched successfully",
            meta: null
        });
        } catch (error) {
        next(error);
        }
    };

    deleteScholarship = async (req, res, next) => {
        try {
        const response = await feeManagementService.deleteScholarship(this._getSchoolId(req), req.params.id, req.authUser);
        res.json({
            result: response,
            message: "Scholarship deleted successfully",
            meta: null
        });
        } catch (error) {
        next(error);
        }
    };

    recordPayment = async (req, res, next) => {
        try {
        const idempotencyKey = req.headers['idempotency-key'] || null;
        const response = await feeManagementService.recordPayment(this._getSchoolId(req), req.body, req.authUser, idempotencyKey);
        res.json({
            result:response,
            message:"Payment recorded successfully",
            meta:null
        });
        } catch (error) {
        next(error);
        }
    };

    scheduleReminder = async (req, res, next) => {
        try {
        const response = await feeManagementService.scheduleReminder(this._getSchoolId(req), req.body, req.authUser);
        res.json({
            result:response,
            message:"Reminder scheduled successfully",
            meta:null
        });
        } catch (error) {
        next(error);
        }
    };

    getPendingReminders = async (req, res, next) => {
        try {
        const response = await feeManagementService.getPendingReminders(this._getSchoolId(req), {
            page: req.query.page,
            limit: req.query.limit
        });
        res.json({
            result:response,
            message:"Pending reminders fetched successfully",
            meta:{
                currentPage:response.pagination?.page,
                total:response.pagination?.total,
                limit:response.pagination?.limit
            }
        });
        } catch (error) {
        next(error);
        }
    };

    listFeeRecords = async (req, res, next) => {
        try {
        const response = await feeManagementService.getSchoolFeeRecords(
            this._getSchoolId(req),
            req.authUser,
            { page: req.query.page, limit: req.query.limit, status: req.query.status }
        );
        res.json({
            result: response,
            message: "Fee records fetched successfully",
            meta: {
                currentPage: response.pagination.page,
                total: response.pagination.total,
                limit: response.pagination.limit
            }
        });
        } catch (error) {
        next(error);
        }
    };

    listPayments = async (req, res, next) => {
        try {
        const response = await feeManagementService.getSchoolPayments(
            this._getSchoolId(req),
            req.authUser,
            { page: req.query.page, limit: req.query.limit }
        );
        res.json({
            result: response,
            message: "Payment history fetched successfully",
            meta: {
                currentPage: response.pagination.page,
                total: response.pagination.total,
                limit: response.pagination.limit
            }
        });
        } catch (error) {
        next(error);
        }
    };

    deleteStudentFee = async (req, res, next) => {
        try {
            const response = await feeManagementService.deleteStudentFee(this._getSchoolId(req), req.params.id, req.authUser);
            res.json({ meta: null, message: "Student fee deleted successfully", result: response });
        } catch (error) {
            next(error);
        }
    };

    updateStudentFee = async (req, res, next) => {
        try {
            const response = await feeManagementService.updateStudentFee(this._getSchoolId(req), req.params.id, req.body, req.authUser);
            res.json({ meta: null, message: "Student fee updated successfully", result: response });
        } catch (error) {
            next(error);
        }
    };

    extendFee = async (req, res, next) => {
        try {
        const { id } = req.params;
        const { days } = req.body;
        const response = await feeManagementService.extendStudentFeeDueDate(
            this._getSchoolId(req),
            id,
            days
        );
        res.json({
            result: response,
            message: "Payment deadline extended successfully",
            meta: null
        });
        } catch (error) {
        next(error);
        }
    };

    getOverdueFees = async (req, res, next) => {
        try {
        const response = await feeManagementService.getOverdueFees(this._getSchoolId(req), {
            page: req.query.page,
            limit: req.query.limit
        });
        res.json({
            result:response,
            message:"Overdue fees fetched successfully",
            meta:{
                currentPage:response.pagination?.page,
                total:response.pagination?.total,
                limit:response.pagination?.limit
            }
        });
        } catch (error) {
        next(error);
        }
    };

    getFeeAuditLogs = async (req, res, next) => {
        try {
        const response = await feeManagementService.getFeeAuditLogs(
            this._getSchoolId(req),
            req.query.page,
            req.query.limit,
            req.query.studentId || null
        );
        res.json({
            result: response,
            message: "Audit logs fetched successfully",
            meta: {
                currentPage: response.pagination.page,
                total: response.pagination.total,
                limit: response.pagination.limit
            }
        });
        } catch (error) {
        next(error);
        }
    };

    getScholarshipHistory = async (req, res, next) => {
        try {
        const response = await feeManagementService.getScholarshipHistory(
            this._getSchoolId(req),
            req.params.studentId
        );
        res.json({
            result: response,
            message: "Scholarship history fetched successfully",
            meta: null
        });
        } catch (error) {
        next(error);
        }
    };
}

module.exports = new FeeManagementController();