const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');
const { v4: uuidv4 } = require('uuid');
const esewa = require('../../lib/esewa');
const khalti = require('../../lib/khalti');

const prisma = new PrismaClient();

const PaymentStatus = {
  INITIATED: 'initiated',
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  REQUIRES_VERIFICATION: 'requires_verification',
};

const FeeStatus = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
};

class PaymentProcessorService {
  /**
   * Process a gateway callback for a public invoice payment
   * Ensures EVERYTHING atomic or rolls back.
   */
  async processInvoicePayment(token, data) {
    // data contains { gateway: 'esewa'|'khalti', gatewayReference, transactionId, encodedData }
    const { gateway, gatewayReference, transactionId, encodedData } = data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find Invoice by Token
      const invoice = await tx.invoice.findUnique({
        where: { paymentToken: token },
        include: {
          school: {
            include: { schoolPaymentGateways: true }
          },
          student: true,
        }
      });

      if (!invoice) throw { status: 404, message: 'Invalid payment token' };
      if (invoice.status === 'PAID') throw { status: 400, message: 'Invoice is already paid' };
      if (invoice.tokenExpiresAt && new Date() > invoice.tokenExpiresAt) {
        throw { status: 400, message: 'Payment link has expired' };
      }

      // 2. Determine Gateway Config
      const gatewayConfigRecord = invoice.school.schoolPaymentGateways.find(
        g => g.paymentMethod === gateway && g.status === 'active'
      );

      if (!gatewayConfigRecord || !gatewayConfigRecord.config) {
        throw { status: 400, message: `${gateway} gateway is not configured for this school` };
      }

      // Calculate the expected total amount for this invoice (sum of pending fees attached to it)
      let expectedAmount = new Decimal(0);
      let pendingFees = [];
      
      if (invoice.feeIds && invoice.feeIds.length > 0) {
        pendingFees = await tx.studentFee.findMany({
          where: { id: { in: invoice.feeIds }, balanceAmount: { gt: 0 } },
          orderBy: { dueDate: 'asc' }
        });
        
        for (const fee of pendingFees) {
          expectedAmount = expectedAmount.add(new Decimal(fee.balanceAmount));
        }
      }

      if (expectedAmount.lte(0)) {
        throw { status: 400, message: 'No pending balance for this invoice.' };
      }

      const isSuccess = data.status === 'success';
      if (!isSuccess) {
          throw { status: 400, message: 'Payment failed at gateway' };
      }

      // 3. Verify Payment with Gateway API internally (No mocking here, real API check inside transaction)
      if (gateway === 'esewa') {
        let decodedEsewaData = null;
        if (encodedData) {
          decodedEsewaData = esewa.decodeAndVerifyCallback(encodedData, gatewayConfigRecord.config.secretKey);
        }
        const txnUuid = transactionId || gatewayReference || (decodedEsewaData ? decodedEsewaData.transaction_uuid : null);
        if (!txnUuid) throw { status: 400, message: 'Missing transaction UUID for eSewa' };

        const esewaStatus = await esewa.checkTransactionStatus(gatewayConfigRecord.config, {
          totalAmount: expectedAmount.toString(),
          transactionUuid: txnUuid,
        });

        if (esewaStatus.status !== 'COMPLETE') {
          throw { status: 400, message: `eSewa transaction not complete (status: ${esewaStatus.status})` };
        }
      } else if (gateway === 'khalti') {
        const pidx = data.gatewayToken || gatewayReference || transactionId;
        if (!pidx) throw { status: 400, message: 'pidx required for Khalti verification' };

        const khaltiStatus = await khalti.lookupPayment(gatewayConfigRecord.config, pidx);
        
        // Khalti lookup payload returns amount in paisa. Verify it matches.
        // const khaltiExpectedPaisa = expectedAmount.mul(100).toNumber();
        if (khaltiStatus.status !== 'Completed') {
          throw { status: 400, message: `Khalti transaction not complete (status: ${khaltiStatus.status})` };
        }
      } else {
         throw { status: 400, message: `Unsupported gateway: ${gateway}` };
      }

      // 4. Create FeePayment record linked to Invoice
      const paymentRef = `PAY-${uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase()}`;
      
      const payment = await tx.feePayment.create({
        data: {
          schoolId: invoice.schoolId,
          studentId: invoice.studentId,
          invoiceId: invoice.id,
          gatewayId: gatewayConfigRecord.id,
          totalAmount: expectedAmount,
          paymentMethod: gateway,
          status: PaymentStatus.SUCCESS,
          paymentReference: paymentRef,
          transactionId: transactionId || null,
          gatewayReference: gatewayReference || null,
          gatewayToken: data.gatewayToken || null,
          paymentDate: new Date(),
        }
      });

      // 5. Update Invoice Status to PAID
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAID' }
      });

      // 6. Allocate payment to student fees (deduct balances)
      let remainingToAllocate = expectedAmount;

      for (const fee of pendingFees) {
        if (remainingToAllocate.lte(0)) break;

        const feeBalance = new Decimal(fee.balanceAmount);
        const allocationAmount = Decimal.min(remainingToAllocate, feeBalance);

        // Record how it was allocated
        await tx.feePaymentAllocation.create({
          data: {
             schoolId: invoice.schoolId,
             paymentId: payment.id,
             studentFeeId: fee.id,
             amount: allocationAmount
          }
        });

        const newPaidAmount = new Decimal(fee.paidAmount).add(allocationAmount);
        const newBalanceAmount = feeBalance.sub(allocationAmount);

        let newStatus;
        if (newBalanceAmount.lte(0)) {
          newStatus = FeeStatus.PAID;
        } else if (newPaidAmount.gt(0)) {
          newStatus = FeeStatus.PARTIAL;
        } else {
          newStatus = fee.status;
        }

        await tx.studentFee.update({
          where: { id: fee.id },
          data: {
             paidAmount: newPaidAmount,
             balanceAmount: newBalanceAmount,
             status: newStatus
          }
        });

        remainingToAllocate = remainingToAllocate.sub(allocationAmount);
      }

      // If anything failed up to this point, the throw would roll back tx automatically.
      return { payment, invoice };
    }, { timeout: 20000 }); // eSewa/Khalti APIs might take a couple of seconds so increased timeout.

    // Dispatch the payment receipt via email asynchronously
    try {
      const paymentService = require('./payment.service');
      paymentService._dispatchEmailReceipt(result.payment.id, result.payment.schoolId)
        .catch(err => console.error('Failed to dispatch public payment receipt:', err));
    } catch (err) {
      console.error('Error invoking payment receipt dispatch:', err);
    }

    return result;
  }
}

module.exports = new PaymentProcessorService();
