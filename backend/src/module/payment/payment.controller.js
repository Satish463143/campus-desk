const paymentService = require('./payment.service');

/**
 * Helper – parse pagination query params safely.
 */
function getPagination(query) {
  const limit = Math.min(parseInt(query.limit) || 10, 100);
  const page  = Math.max(parseInt(query.page)  || 1,   1);
  const skip  = (page - 1) * limit;
  return { limit, page, skip };
}

class PaymentController {

  // ─── Gateway Management ────────────────────────────────────────────────────

  createGateway = async (req, res, next) => {
    try {
      const result = await paymentService.createGateway(req.authUser.schoolId, req.body);
      res.status(201).json({ message: 'Gateway created successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  listGateways = async (req, res, next) => {
    try {
      const result = await paymentService.listGateways(req.authUser.schoolId);
      res.json({ message: 'Gateways fetched successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  getGatewayById = async (req, res, next) => {
    try {
      const result = await paymentService.getGatewayById(req.params.id, req.authUser.schoolId);
      if (!result) throw { status: 404, message: 'Gateway not found' };
      res.json({ message: 'Gateway fetched successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  updateGateway = async (req, res, next) => {
    try {
      const result = await paymentService.updateGateway(
        req.params.id, req.authUser.schoolId, req.body
      );
      res.json({ message: 'Gateway updated successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  deleteGateway = async (req, res, next) => {
    try {
      await paymentService.deleteGateway(req.params.id, req.authUser.schoolId);
      res.json({ message: 'Gateway deleted successfully', result: null, meta: null });
    } catch (err) { next(err); }
  };

  // ─── Available Methods (parent / student) ──────────────────────────────────

  getPaymentMethods = async (req, res, next) => {
    try {
      const result = await paymentService.getActivePaymentMethods(req.authUser.schoolId);
      res.json({ message: 'Payment methods fetched successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  // ─── Student Fee Summary ────────────────────────────────────────────────────

  getStudentFeeSummary = async (req, res, next) => {
    try {
      const result = await paymentService.getStudentFeeSummary(
        req.params.studentId, req.authUser.schoolId
      );
      res.json({ message: 'Student fee summary fetched successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  // ─── Online Payment ─────────────────────────────────────────────────────────

  initiatePayment = async (req, res, next) => {
    try {
      const result = await paymentService.initiateOnlinePayment(
        req.authUser.schoolId, req.authUser.id, req.body
      );
      res.status(201).json({ message: 'Payment initiated successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  verifyPayment = async (req, res, next) => {
    try {
      const result = await paymentService.verifyOnlinePayment(
        req.authUser.schoolId, req.authUser.id, req.body
      );
      res.json({ message: 'Payment verified successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  // ─── Manual / Offline Payment ───────────────────────────────────────────────

  recordManualPayment = async (req, res, next) => {
    try {
      const result = await paymentService.recordManualPayment(
        req.authUser.schoolId, req.authUser.id, req.body
      );
      res.status(201).json({ message: 'Manual payment recorded successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  listManualPayments = async (req, res, next) => {
    try {
      const { limit, page, skip } = getPagination(req.query);
      const filters = {
        studentId: req.query.studentId,
        status:    req.query.status,
        from:      req.query.from,
        to:        req.query.to,
      };
      const { data, count } = await paymentService.listManualPayments(
        req.authUser.schoolId, filters, { limit, skip }
      );
      res.json({
        message: 'Manual payments fetched successfully',
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch (err) { next(err); }
  };

  getManualPaymentById = async (req, res, next) => {
    try {
      const result = await paymentService.getPaymentById(
        req.params.paymentId, req.authUser.schoolId
      );
      if (!result) throw { status: 404, message: 'Payment not found' };
      res.json({ message: 'Payment fetched successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  // ─── Payment History & Lookup ───────────────────────────────────────────────

  getPaymentHistory = async (req, res, next) => {
    try {
      const { limit, page, skip } = getPagination(req.query);
      const filters = {
        studentId: req.query.studentId,
        from:      req.query.from,
        to:        req.query.to,
        status:    req.query.status,
      };
      const { data, count } = await paymentService.getPaymentHistory(
        req.authUser.schoolId, req.authUser.id, req.authUser.role, filters, { limit, skip }
      );
      res.json({
        message: 'Payment history fetched successfully',
        result: data,
        meta: { currentPage: page, limit, total: count },
      });
    } catch (err) { next(err); }
  };

  getPaymentById = async (req, res, next) => {
    try {
      const result = await paymentService.getPaymentById(
        req.params.paymentId, req.authUser.schoolId
      );
      if (!result) throw { status: 404, message: 'Payment not found' };
      res.json({ message: 'Payment fetched successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  getPaymentStatus = async (req, res, next) => {
    try {
      const result = await paymentService.getPaymentStatus(
        req.params.paymentId, req.authUser.schoolId
      );
      if (!result) throw { status: 404, message: 'Payment not found' };
      res.json({ message: 'Payment status fetched successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  getPaymentReceipt = async (req, res, next) => {
    try {
      const result = await paymentService.getPaymentReceipt(
        req.params.paymentId, req.authUser.schoolId
      );
      if (!result) throw { status: 404, message: 'Payment not found' };
      res.json({ message: 'Payment receipt fetched successfully', result, meta: null });
    } catch (err) { next(err); }
  };

  getPaymentAllocations = async (req, res, next) => {
    try {
      const result = await paymentService.getPaymentAllocations(
        req.params.paymentId, req.authUser.schoolId
      );
      if (!result) throw { status: 404, message: 'Payment not found' };
      res.json({ message: 'Payment allocations fetched successfully', result, meta: null });
    } catch (err) { next(err); }
  };
}

module.exports = new PaymentController();
