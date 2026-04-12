const invoiceService = require("./invoice.service");

class InvoiceController {
    _getSchoolId(req) {
        return req.authUser.schoolId;
    }

    listPending = async (req, res, next) => {
        try {
            const response = await invoiceService.listPending(
                this._getSchoolId(req),
                req.query.page,
                req.query.limit
            );
            res.json({
                result: response,
                message: "Invoices fetched successfully",
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

    approve = async (req, res, next) => {
        try {
            const response = await invoiceService.approve(
                req.params.id,
                this._getSchoolId(req),
                req.authUser.name
            );
            res.json({
                result: response,
                message: "Invoice approved successfully",
                meta: null
            });
        } catch (error) {
            next(error);
        }
    };

    send = async (req, res, next) => {
        try {
            const response = await invoiceService.send(
                req.params.id,
                this._getSchoolId(req)
            );
            res.json({
                result: response,
                message: "Invoice sent successfully",
                meta: null
            });
        } catch (error) {
            next(error);
        }
    };

    generateForStudent = async (req, res, next) => {
        try {
            const { studentId, feeIds = [], type = "FEE_INVOICE" } = req.body;
            if (!studentId) return res.status(400).json({ message: "studentId is required" });
            const response = await invoiceService.generateForStudent(
                this._getSchoolId(req),
                studentId,
                type,
                feeIds
            );
            res.json({ result: response, message: "Invoice generated successfully", meta: null });
        } catch (error) {
            next(error);
        }
    };

    generateBulk = async (req, res, next) => {
        try {
            const { classId, feeStructureIds = [] } = req.body;
            if (!classId) return res.status(400).json({ message: "classId is required" });
            if (!feeStructureIds.length) return res.status(400).json({ message: "Select at least one fee structure" });
            const response = await invoiceService.generateBulk(
                this._getSchoolId(req),
                classId,
                feeStructureIds
            );
            res.json({ result: response, message: `${response.count} invoice(s) generated`, meta: null });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new InvoiceController();
