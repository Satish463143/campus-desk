const { PrismaClient } = require('@prisma/client');
const { Decimal }       = require('@prisma/client/runtime/library');
const { v4: uuidv4 }    = require('uuid');
const esewa             = require('../../lib/esewa');
const { money, toDecimal } = require('../../utils/money');

const prisma = new PrismaClient();

// ─── Prisma enum values (snake_case) ─────────────────────────────────────────
const PaymentStatus = {
  INITIATED:            'initiated',
  PENDING:              'pending',
  SUCCESS:              'success',
  FAILED:               'failed',
  CANCELLED:            'cancelled',
  EXPIRED:              'expired',
  REQUIRES_VERIFICATION:'requires_verification',
};

const FeeStatus = {
  PENDING:         'pending',
  PARTIAL:         'partial',
  PAID:            'paid',
  OVERDUE:         'overdue',
  PARTIAL_OVERDUE: 'partial_overdue',
};

// ─── Shared select shapes ─────────────────────────────────────────────────────
const PAYMENT_SELECT = {
  id:               true,
  paymentReference: true,
  totalAmount:      true,
  paymentDate:      true,
  paymentMethod:    true,
  status:           true,
  transactionId:    true,
  gatewayReference: true,
  receiptUrl:       true,
  depositedBy:      true,
  note:             true,
  createdAt:        true,
  student: {
    select: {
      id: true,
      admissionNumber: true,
      user: { select: { name: true } },
    },
  },
  gateway: { select: { id: true, paymentMethod: true } },
};

class PaymentService {

  // ─────────────────────────────────────────────────────────────────────────────
  // Gateway Management
  // ─────────────────────────────────────────────────────────────────────────────

  async createGateway(schoolId, data) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.schoolPaymentGateway.updateMany({
          where:  { schoolId, isDefault: true },
          data:   { isDefault: false },
        });
      }
      return tx.schoolPaymentGateway.create({
        data: { schoolId, ...data },
      });
    });
  }

  async listGateways(schoolId) {
    return prisma.schoolPaymentGateway.findMany({
      where:   { schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGatewayById(id, schoolId) {
    return prisma.schoolPaymentGateway.findFirst({ where: { id, schoolId } });
  }

  async updateGateway(id, schoolId, data) {
    const existing = await prisma.schoolPaymentGateway.findFirst({ where: { id, schoolId } });
    if (!existing) throw { status: 404, message: 'Gateway not found' };

    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.schoolPaymentGateway.updateMany({
          where:  { schoolId, isDefault: true, id: { not: id } },
          data:   { isDefault: false },
        });
      }
      return tx.schoolPaymentGateway.update({ where: { id }, data });
    });
  }

  async deleteGateway(id, schoolId) {
    const existing = await prisma.schoolPaymentGateway.findFirst({ where: { id, schoolId } });
    if (!existing) throw { status: 404, message: 'Gateway not found' };
    return prisma.schoolPaymentGateway.delete({ where: { id } });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Active Payment Methods  (parent / student view – hides sensitive config)
  // ─────────────────────────────────────────────────────────────────────────────

  async getActivePaymentMethods(schoolId) {
    return prisma.schoolPaymentGateway.findMany({
      where:  { schoolId, status: 'active' },
      select: { id: true, paymentMethod: true, isDefault: true },
      orderBy: { isDefault: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Student Fee Summary
  // ─────────────────────────────────────────────────────────────────────────────

  async getStudentFeeSummary(studentId, schoolId) {
    const fees = await prisma.studentFee.findMany({
      where: { studentId, schoolId },
      select: {
        id:             true,
        periodLabel:    true,
        dueDate:        true,
        originalAmount: true,
        discountAmount: true,
        netAmount:      true,
        paidAmount:     true,
        balanceAmount:  true,
        status:         true,
        feeStructure: {
          select: {
            frequency: true,
            feeCategory: { select: { name: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Aggregate totals
    const totalDue     = fees.reduce((s, f) => s.add(f.netAmount),      new Decimal(0));
    const totalPaid    = fees.reduce((s, f) => s.add(f.paidAmount),     new Decimal(0));
    const totalBalance = fees.reduce((s, f) => s.add(f.balanceAmount),  new Decimal(0));

    return { fees, totalDue, totalPaid, totalBalance };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Online Payment – Initiation
  // ─────────────────────────────────────────────────────────────────────────────

  async initiateOnlinePayment(schoolId, userId, data) {
    const { studentId, amount, paymentMethod, gatewayId } = data;

    // Resolve "all" → sum of all pending / partial balances
    let totalAmount;
    if (amount === 'all') {
      const fees = await prisma.studentFee.findMany({
        where:  { studentId, schoolId, status: { in: [FeeStatus.PENDING, FeeStatus.PARTIAL, FeeStatus.OVERDUE] } },
        select: { balanceAmount: true },
      });
      if (!fees.length) throw { status: 400, message: 'No outstanding fees found for this student' };
      totalAmount = fees.reduce((s, f) => s.add(f.balanceAmount), new Decimal(0));
    } else {
      totalAmount = new Decimal(amount);
    }

    if (totalAmount.lte(0)) throw { status: 400, message: 'Payment amount must be greater than zero' };

    const payment = await prisma.feePayment.create({
      data: {
        schoolId,
        studentId,
        gatewayId:        gatewayId  || null,
        totalAmount,
        paymentMethod,
        status:           PaymentStatus.INITIATED,
        paymentReference: `PAY-${uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase()}`,
      },
      select: PAYMENT_SELECT,
    });

    // For eSewa: read gateway config and return signed form params so the
    // frontend can POST directly to eSewa's payment page.
    if (paymentMethod === 'esewa') {
      const gateway = await prisma.schoolPaymentGateway.findFirst({
        where: { schoolId, paymentMethod: 'esewa', status: 'active' },
      });
      if (!gateway?.config) throw { status: 400, message: 'eSewa gateway not configured for this school' };

      const esewaData = esewa.buildInitiateParams(gateway.config, {
        totalAmount:     payment.totalAmount.toString(),
        transactionUuid: payment.paymentReference,
      });
      return { payment, esewa: esewaData };
    }

    return { payment, esewa: null };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Online Payment – Verification  (idempotent – safe to call twice)
  // ─────────────────────────────────────────────────────────────────────────────

  async verifyOnlinePayment(schoolId, _userId, data) {
    const { paymentId, gatewayReference, transactionId, gatewayToken, status, encodedData } = data;

    return prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.findUnique({ where: { id: paymentId } });

      if (!payment || payment.schoolId !== schoolId) {
        throw { status: 404, message: 'Payment record not found' };
      }

      // Idempotency guard
      if (payment.status === PaymentStatus.SUCCESS) return payment;

      const isSuccess = status === 'success';

      // ── eSewa server-side verification ──────────────────────────────────────
      if (payment.paymentMethod === 'esewa' && isSuccess) {
        const gateway = await tx.schoolPaymentGateway.findFirst({
          where: { schoolId, paymentMethod: 'esewa', status: 'active' },
        });
        if (!gateway?.config) {
          throw { status: 400, message: 'eSewa gateway not configured' };
        }

        // 1. Verify HMAC signature on the callback payload (if frontend sent it)
        if (encodedData) {
          esewa.decodeAndVerifyCallback(encodedData, gateway.config.secretKey);
        }

        // 2. Server-side status check against eSewa API
        const txnUuid = transactionId || gatewayReference;
        if (!txnUuid) throw { status: 400, message: 'transactionId or gatewayReference required for eSewa verification' };

        const esewaStatus = await esewa.checkTransactionStatus(gateway.config, {
          totalAmount:     payment.totalAmount.toString(),
          transactionUuid: txnUuid,
        });

        if (esewaStatus.status !== 'COMPLETE') {
          throw {
            status: 400,
            message: `eSewa transaction not complete (status: ${esewaStatus.status ?? 'unknown'})`,
          };
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      const updated = await tx.feePayment.update({
        where: { id: paymentId },
        data: {
          status:           isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          gatewayReference: gatewayReference || null,
          transactionId:    transactionId    || null,
          gatewayToken:     gatewayToken     || null,
          paymentDate:      isSuccess ? new Date() : null,
        },
        select: PAYMENT_SELECT,
      });

      if (isSuccess) {
        await this._allocatePayment(
          { id: paymentId, studentId: payment.studentId, schoolId, totalAmount: payment.totalAmount },
          tx
        );
      }

      return updated;
    }, { timeout: 15_000 });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Manual / Offline Payment  (accountant flow)
  // ─────────────────────────────────────────────────────────────────────────────

  async recordManualPayment(schoolId, createdByUserId, data) {
    const {
      studentId, amount, paymentMethod,
      paymentDate, note, depositedBy, referenceNumber, receiptUrl,
    } = data;

    const student = await prisma.studentProfile.findFirst({ where: { id: studentId, schoolId } });
    if (!student) throw { status: 404, message: 'Student not found in this school' };

    const totalAmount = new Decimal(amount);

    return prisma.$transaction(async (tx) => {
      const payment = await tx.feePayment.create({
        data: {
          schoolId,
          studentId,
          totalAmount,
          paymentMethod,
          status:           PaymentStatus.SUCCESS,
          paymentDate:      paymentDate ? new Date(paymentDate) : new Date(),
          paymentReference: `MAN-${uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase()}`,
          note:             note             || null,
          depositedBy:      depositedBy      || null,
          transactionId:    referenceNumber  || null,
          receiptUrl:       receiptUrl       || null,
          receivedBy:       createdByUserId,
        },
        select: PAYMENT_SELECT,
      });

      await this._allocatePayment(
        { id: payment.id, studentId, schoolId, totalAmount },
        tx
      );

      return payment;
    }, { timeout: 10_000 });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // List Manual Payments  (admin side)
  // ─────────────────────────────────────────────────────────────────────────────

  async listManualPayments(schoolId, filters, pagination) {
    const { limit, skip } = pagination;

    const where = {
      schoolId,
      paymentMethod: { in: ['cash', 'check', 'bank_transfer'] },
    };

    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.status)    where.status    = filters.status;
    if (filters.from || filters.to) {
      where.paymentDate = {};
      if (filters.from) where.paymentDate.gte = new Date(filters.from);
      if (filters.to)   where.paymentDate.lte = new Date(filters.to);
    }

    const [data, count] = await prisma.$transaction([
      prisma.feePayment.findMany({
        where, select: PAYMENT_SELECT,
        orderBy: { createdAt: 'desc' },
        take: limit, skip,
      }),
      prisma.feePayment.count({ where }),
    ]);

    return { data, count };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Payment History  (role-scoped)
  // ─────────────────────────────────────────────────────────────────────────────

  async getPaymentHistory(schoolId, userId, role, filters, pagination) {
    const { limit, skip } = pagination;
    const where = { schoolId };

    // Students see only their own; parents see all their children's
    if (role === 'student') {
      const profile = await prisma.studentProfile.findFirst({
        where: { userId, schoolId }, select: { id: true },
      });
      if (!profile) throw { status: 403, message: 'Student profile not found' };
      where.studentId = profile.id;
    } else if (role === 'parent') {
      const profile = await prisma.parentProfile.findFirst({
        where:   { userId, schoolId },
        select:  { students: { select: { id: true } } },
      });
      if (!profile) throw { status: 403, message: 'Parent profile not found' };
      const ids = profile.students.map(s => s.id);
      where.studentId = { in: ids };
    }

    // Optional extra filters (from accountant/admin)
    if (filters.studentId && !where.studentId) where.studentId = filters.studentId;
    if (filters.status)                        where.status    = filters.status;
    if (filters.from || filters.to) {
      where.paymentDate = {};
      if (filters.from) where.paymentDate.gte = new Date(filters.from);
      if (filters.to)   where.paymentDate.lte = new Date(filters.to);
    }

    const [data, count] = await prisma.$transaction([
      prisma.feePayment.findMany({
        where, select: PAYMENT_SELECT,
        orderBy: { createdAt: 'desc' },
        take: limit, skip,
      }),
      prisma.feePayment.count({ where }),
    ]);

    return { data, count };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Payment Detail Lookups
  // ─────────────────────────────────────────────────────────────────────────────

  async getPaymentById(id, schoolId) {
    return prisma.feePayment.findFirst({
      where: { id, schoolId },
      select: {
        ...PAYMENT_SELECT,
        invoiceReference: true,
        receiptUrl:       true,
        verifiedBy:       true,
        verifiedAt:       true,
        gatewayToken:     true,
        updatedAt:        true,
        allocations: {
          select: {
            id:     true,
            amount: true,
            studentFee: {
              select: {
                id:            true,
                periodLabel:   true,
                dueDate:       true,
                netAmount:     true,
                paidAmount:    true,
                balanceAmount: true,
                status:        true,
                feeStructure: {
                  select: {
                    frequency:   true,
                    feeCategory: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getPaymentStatus(id, schoolId) {
    return prisma.feePayment.findFirst({
      where:  { id, schoolId },
      select: { id: true, status: true, paymentReference: true, paymentDate: true, updatedAt: true },
    });
  }

  async getPaymentReceipt(id, schoolId) {
    return prisma.feePayment.findFirst({
      where:  { id, schoolId },
      select: {
        id:               true,
        paymentReference: true,
        totalAmount:      true,
        paymentDate:      true,
        paymentMethod:    true,
        status:           true,
        receiptUrl:       true,
        depositedBy:      true,
        note:             true,
        student: { select: { id: true, admissionNumber: true, user: { select: { name: true } } } },
        allocations: {
          select: {
            amount: true,
            studentFee: {
              select: {
                periodLabel:   true,
                dueDate:       true,
                feeStructure: { select: { feeCategory: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });
  }

  async getPaymentAllocations(id, schoolId) {
    const payment = await prisma.feePayment.findFirst({
      where:  { id, schoolId },
      select: {
        id:               true,
        paymentReference: true,
        totalAmount:      true,
        allocations: {
          select: {
            id:     true,
            amount: true,
            createdAt: true,
            studentFee: {
              select: {
                id:            true,
                periodLabel:   true,
                dueDate:       true,
                netAmount:     true,
                paidAmount:    true,
                balanceAmount: true,
                status:        true,
                feeStructure: { select: { feeCategory: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });

    return payment;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private: FIFO fee allocation  (must be called inside a Prisma transaction)
  // ─────────────────────────────────────────────────────────────────────────────

  async _allocatePayment({ id: paymentId, studentId, schoolId, totalAmount }, tx) {
    const feeSetting = await tx.feeSetting.findUnique({ where: { schoolId } });
    const graceDays = feeSetting?.graceDays ?? 5;
    let remaining = toDecimal(totalAmount);

    // ── Row-level lock: SELECT ... FOR UPDATE prevents concurrent double-allocation ──
    // Each StudentFee row is locked for the duration of this transaction so no
    // other concurrent payment can read a stale balanceAmount for the same student.
    const pendingFees = await tx.$queryRaw`
      SELECT * FROM "StudentFee"
      WHERE "studentId"     = ${studentId}
        AND "schoolId"      = ${schoolId}
        AND "status"        IN ('pending', 'partial', 'overdue')
        AND "balanceAmount" > 0
      ORDER BY "dueDate" ASC
      FOR UPDATE
    `;

    for (const fee of pendingFees) {
      if (remaining.lte(0)) break;

      const feeBalance       = toDecimal(fee.balanceAmount);
      const allocationAmount = Decimal.min(remaining, feeBalance);

      // Write allocation record
      await tx.feePaymentAllocation.create({
        data: {
          schoolId,
          paymentId,
          studentFeeId: fee.id,
          amount: money(allocationAmount),
        },
      });

      const newPaidAmount    = money(toDecimal(fee.paidAmount).add(allocationAmount));
      const newBalanceAmount = money(feeBalance.sub(allocationAmount));

      let newStatus;
      if (newBalanceAmount.lte(0)) {
        newStatus = FeeStatus.PAID;
      } else if (newPaidAmount.gt(0)) {
        // Check dueDate + graceDays to correctly assign PARTIAL_OVERDUE vs PARTIAL
        const effectiveDueDate = new Date(fee.dueDate);
        effectiveDueDate.setDate(effectiveDueDate.getDate() + graceDays);
        const isOverdue = fee.dueDate && effectiveDueDate < new Date();
        newStatus = isOverdue ? FeeStatus.PARTIAL_OVERDUE : FeeStatus.PARTIAL;
      } else {
        newStatus = fee.status;
      }

      // Update student fee atomically
      await tx.studentFee.update({
        where: { id: fee.id },
        data: {
          paidAmount:    newPaidAmount,
          balanceAmount: newBalanceAmount,
          status:        newStatus,
        },
      });

      remaining = remaining.sub(allocationAmount);
    }
  }
}

module.exports = new PaymentService();
