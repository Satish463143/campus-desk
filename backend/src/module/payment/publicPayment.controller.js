const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');
const paymentProcessorService = require('./paymentProcessor.service');
const { v4: uuidv4 } = require('uuid');
const esewa = require('../../lib/esewa');

const prisma = new PrismaClient();

class PublicPaymentController {
  
  // GET /invoice/:token
  getInvoiceDetails = async (req, res, next) => {
    try {
      const { token } = req.params;
      
      const invoice = await prisma.invoice.findUnique({
        where: { paymentToken: token },
        include: {
          student: {
            include: { user: { select: { name: true, email: true } } }
          },
          school: {
            select: {
               schoolName: true,
               logo: true,
               schoolPaymentGateways: {
                 where: { status: 'active', paymentMethod: { in: ['esewa', 'khalti'] } },
                 select: { id: true, paymentMethod: true }
               }
            }
          }
        }
      });

      if (!invoice) return res.status(404).json({ message: 'Invalid or missing payment token.' });
      
      if (invoice.status === 'PAID') {
         return res.status(400).json({ message: 'This invoice has already been paid.' });
      }
      
      if (invoice.tokenExpiresAt && new Date() > invoice.tokenExpiresAt) {
         return res.status(400).json({ message: 'This payment link has expired. Please request a new invoice.' });
      }

      // Calculate total pending amount for this invoice
      let totalAmount = new Decimal(0);
      let feeDetails = [];

      if (invoice.feeIds && invoice.feeIds.length > 0) {
        const pendingFees = await prisma.studentFee.findMany({
          where: { id: { in: invoice.feeIds }, balanceAmount: { gt: 0 } },
          include: { feeStructure: { include: { feeCategory: true } } },
          orderBy: { dueDate: 'asc' }
        });
        
        for (const fee of pendingFees) {
          totalAmount = totalAmount.add(new Decimal(fee.balanceAmount));
          feeDetails.push({
            id: fee.id,
            category: fee.feeStructure?.feeCategory?.name || 'Fee',
            amount: fee.balanceAmount
          });
        }
      }

      res.json({
        message: 'Invoice details fetched successfully',
        result: {
          invoiceId: invoice.id,
          type: invoice.type,
          studentName: invoice.student?.user?.name,
          schoolName: invoice.school?.schoolName,
          schoolLogo: invoice.school?.logo,
          totalAmount: totalAmount.toNumber(),
          feeDetails,
          gateways: invoice.school?.schoolPaymentGateways || []
        },
        meta: null
      });

    } catch(err) {
      next(err);
    }
  };

  // POST /invoice/:token/initiate
  initiatePayment = async (req, res, next) => {
    try {
      const { token } = req.params;
      const { gateway } = req.body; // 'esewa' or 'khalti'

      if (!['esewa', 'khalti'].includes(gateway)) {
         return res.status(400).json({ message: 'Invalid payment gateway selected' });
      }

      const invoice = await prisma.invoice.findUnique({
        where: { paymentToken: token },
        include: {
          school: {
            include: { schoolPaymentGateways: true }
          },
          student: { include: { user: true } }
        }
      });

      if (!invoice) return res.status(404).json({ message: 'Invalid payment token' });
      if (invoice.status === 'PAID') return res.status(400).json({ message: 'Invoice already paid' });
      if (invoice.tokenExpiresAt && new Date() > invoice.tokenExpiresAt) {
        return res.status(400).json({ message: 'Payment link has expired' });
      }

      // Calculate amount
      let totalAmount = new Decimal(0);
      if (invoice.feeIds && invoice.feeIds.length > 0) {
        const pendingFees = await prisma.studentFee.findMany({
          where: { id: { in: invoice.feeIds }, balanceAmount: { gt: 0 } }
        });
        for (const fee of pendingFees) totalAmount = totalAmount.add(new Decimal(fee.balanceAmount));
      }

      if (totalAmount.lte(0)) return res.status(400).json({ message: 'No pending balance for this invoice.' });

      const gatewayConfigRecord = invoice.school.schoolPaymentGateways.find(
        g => g.paymentMethod === gateway && g.status === 'active'
      );

      if (!gatewayConfigRecord || !gatewayConfigRecord.config) {
        return res.status(400).json({ message: `${gateway} is not configured for this school` });
      }

      // Inject the token into the success/return URLs so the frontend knows which invoice is being verified
      const configWithToken = { ...gatewayConfigRecord.config };
      if (configWithToken.successUrl) {
         configWithToken.successUrl = `${configWithToken.successUrl}${configWithToken.successUrl.includes('?') ? '&' : '?'}token=${token}`;
      }
      if (configWithToken.returnUrl) {
         configWithToken.returnUrl = `${configWithToken.returnUrl}${configWithToken.returnUrl.includes('?') ? '&' : '?'}token=${token}`;
      }

      // Generate a temporary transaction UUID for initiation
      // We will record the actual FeePayment ONLY on success via verify
      const transactionUuid = `INIT-${invoice.id.split('-')[0]}-${Date.now()}`;

      if (gateway === 'esewa') {
        const esewaData = esewa.buildInitiateParams(configWithToken, {
          totalAmount: totalAmount.toString(),
          transactionUuid,
        });
        return res.json({ result: { esewa: esewaData, transactionUuid } });
      } else if (gateway === 'khalti') {
        const khaltiInfo = require('../../lib/khalti');
        const khaltiData = await khaltiInfo.initiatePayment(configWithToken, {
          totalAmount: totalAmount.mul(100).toNumber().toString(),
          transactionUuid,
          studentName: invoice.student?.user?.name || "Student",
          studentEmail: invoice.student?.user?.email || "student@example.com",
        });
        return res.json({ result: { khalti: khaltiData, transactionUuid } });
      }

    } catch (err) {
      next(err);
    }
  };

  // POST /invoice/:token/verify
  verifyPayment = async (req, res, next) => {
    try {
      const { token } = req.params;
      const result = await paymentProcessorService.processInvoicePayment(token, req.body);

      // Once paid, send success
      res.json({
        message: 'Payment verified and successfully recorded.',
        result: {
           paymentId: result.payment.id,
           receiptUrl: result.payment.receiptUrl // could be generated later
        },
        meta: null
      });

    } catch (err) {
      console.error("[PublicPayment Verify Error]", err);
      // Let the error handling middleware take it or respond directly
      const status = err.status || 500;
      res.status(status).json({ message: err.message || 'Payment verification failed' });
    }
  };
}

module.exports = new PublicPaymentController();
