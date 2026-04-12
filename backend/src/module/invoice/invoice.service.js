const prisma = require("../../config/db.config");
const MailService = require("../../utils/mail.service");
const { v4: uuidv4 } = require('uuid');

class InvoiceService {
  _paginate(page, limit) {
    const safePage = Math.max(parseInt(page || 1, 10), 1);
    const safeLimit = Math.min(Math.max(parseInt(limit || 20, 10), 1), 100);
    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
  }

  async generateForStudent(schoolId, studentId, type, feeIds = []) {
    return prisma.invoice.create({
      data: {
        schoolId,
        studentId,
        type,
        feeIds,
        status: "PENDING_REVIEW"
      }
    });
  }

  async generateBulk(schoolId, classId, feeStructureIds = []) {
    // Get all students enrolled in the class
    const enrollments = await prisma.enrollment.findMany({
      where: { classId, schoolId },
      select: { studentId: true }
    });

    if (enrollments.length === 0) return { count: 0 };

    const studentIds = enrollments.map((e) => e.studentId);

    // For each student, find their StudentFee records matching the selected structures
    const studentFees = await prisma.studentFee.findMany({
      where: {
        schoolId,
        studentId: { in: studentIds },
        feeStructureId: { in: feeStructureIds }
      },
      select: { id: true, studentId: true }
    });

    // Group fee ids by studentId
    const feesByStudent = {};
    for (const sf of studentFees) {
      if (!feesByStudent[sf.studentId]) feesByStudent[sf.studentId] = [];
      feesByStudent[sf.studentId].push(sf.id);
    }

    // Create one invoice per student
    const invoices = await prisma.$transaction(
      studentIds.map((studentId) =>
        prisma.invoice.create({
          data: {
            schoolId,
            studentId,
            type: "BULK",
            feeIds: feesByStudent[studentId] ?? [],
            status: "PENDING_REVIEW"
          }
        })
      )
    );

    // Auto-approve & send every invoice asynchronously (sequentially to prevent SMTP rate-limit closures)
    const sendResults = [];
    for (const inv of invoices) {
      try {
        // Approve
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: "APPROVED", reviewedBy: "System (Bulk)", reviewedAt: new Date() }
        });

        // Fetch student + parent contact details
        const fullInvoice = await prisma.invoice.findFirst({
          where: { id: inv.id },
          include: {
            student: {
              include: {
                user: { select: { name: true, email: true } },
                parents: { include: { user: { select: { name: true, email: true, phone: true, address: true } } } }
              }
            },
            school: { select: { schoolName: true, schoolEmail: true, schoolPhone: true, address: true } }
          }
        });

          if (fullInvoice) {
          // Generate token for bulk invoice
          const paymentToken = uuidv4();
          const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

          // Fetch the fee line items for this invoice
          let fees = [];
          if (fullInvoice.feeIds && fullInvoice.feeIds.length > 0) {
            fees = await prisma.studentFee.findMany({
              where: { id: { in: fullInvoice.feeIds } },
              include: { feeStructure: { include: { feeCategory: true } } }
            });
          }

          const html = this._buildInvoiceHtml(fullInvoice.type, fullInvoice, fees, paymentToken);
          const subject = this._getEmailSubject(fullInvoice.type, fullInvoice.school?.schoolName);
          const recipientEmail =
            fullInvoice.student?.parents?.[0]?.user?.email ??
            fullInvoice.student?.user?.email;

          if (recipientEmail) {
            const pdfService = require("../../utils/pdf.service");
            const { PassThrough } = require("stream");
            const stream = new PassThrough();
            pdfService.generateInvoicePdf(fullInvoice, fees, stream);

            const attachments = [
              {
                filename: `Invoice-${inv.id.split('-')[0].toUpperCase()}.pdf`,
                content: stream
              }
            ];

            await MailService.sendMail(recipientEmail, subject, html, attachments);
          } else {
            console.warn(`[Invoice ${inv.id}] No email found for student or parent to send to.`);
          }

          // Mark as sent and update token
          await prisma.invoice.update({
            where: { id: inv.id },
            data: { status: "SENT", sentAt: new Date(), paymentToken, tokenExpiresAt }
          });
        }
        sendResults.push({ status: "fulfilled" });
      } catch (err) {
        console.error(`[Invoice ${inv.id}] Failed during approval/sending process:`, err);
        sendResults.push({ status: "rejected" });
      }
    }

    const sentCount = sendResults.filter((r) => r.status === "fulfilled").length;
    const failedCount = sendResults.filter((r) => r.status === "rejected").length;

    return { count: invoices.length, sentCount, failedCount };
  }

  async listPending(schoolId, page, limit) {
    const { page: safePage, limit: safeLimit, skip } = this._paginate(page, limit);

    const where = {
      schoolId,
      status: { in: ["PENDING_REVIEW", "APPROVED"] }
    };

    const [items, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true } }
            }
          }
        },
        orderBy: { generatedAt: "desc" },
        skip,
        take: safeLimit
      }),
      prisma.invoice.count({ where })
    ]);

    return {
      pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
      items: items.map((inv) => ({
        ...inv,
        studentName: inv.student?.user?.name ?? null
      }))
    };
  }

  async approve(invoiceId, schoolId, actorName) {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, schoolId } });
    if (!invoice) throw { status: 404, message: "Invoice not found" };
    if (invoice.status !== "PENDING_REVIEW") {
      throw { status: 400, message: "Invoice is not in PENDING_REVIEW state" };
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "APPROVED", reviewedBy: actorName, reviewedAt: new Date() }
    });
  }

  async send(invoiceId, schoolId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, schoolId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            parents: {
              include: { user: { select: { name: true, email: true, phone: true, address: true } } }
            }
          }
        },
        school: { select: { schoolName: true, schoolEmail: true, schoolPhone: true, address: true } }
      }
    });

    if (!invoice) throw { status: 404, message: "Invoice not found" };
    if (invoice.status !== "APPROVED") {
      throw { status: 400, message: "Invoice must be approved before sending" };
    }

    // Fetch fee details if feeIds are provided
    let fees = [];
    if (invoice.feeIds && invoice.feeIds.length > 0) {
      fees = await prisma.studentFee.findMany({
        where: { id: { in: invoice.feeIds } },
        include: { feeStructure: { include: { feeCategory: true } } }
      });
    }

    const paymentToken = uuidv4();
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const html = this._buildInvoiceHtml(invoice.type, invoice, fees, paymentToken);
    const subject = this._getEmailSubject(invoice.type, invoice.school?.schoolName);

    const recipientEmail =
      invoice.student?.parents?.[0]?.user?.email ??
      invoice.student?.user?.email;

    if (recipientEmail) {
      const pdfService = require("../../utils/pdf.service");
      const { PassThrough } = require("stream");
      const stream = new PassThrough();
      pdfService.generateInvoicePdf(invoice, fees, stream);

      const attachments = [
        {
          filename: `Invoice-${invoice.id.split('-')[0].toUpperCase()}.pdf`,
          content: stream
        }
      ];

      await MailService.sendMail(recipientEmail, subject, html, attachments);
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT", sentAt: new Date(), paymentToken, tokenExpiresAt }
    });
  }

  _getEmailSubject(type, schoolName) {
    const school = schoolName || "School";
    const subjects = {
      FEE_INVOICE: `${school} — Fee Invoice`,
      PAYMENT_RECEIPT: `${school} — Payment Receipt`,
      OUTSTANDING: `${school} — Outstanding Fee Notice`,
      BULK: `${school} — Fee Invoice`,
      PARTIAL_PAYMENT: `${school} — Partial Payment Receipt`
    };
    return subjects[type] || `${school} — Invoice`;
  }

  _buildInvoiceHtml(type, invoice, fees, paymentToken = null) {
    const studentName = invoice.student?.user?.name ?? "Student";
    const schoolName = invoice.school?.schoolName ?? "School";
    const generatedAt = invoice.generatedAt
      ? new Date(invoice.generatedAt).toLocaleDateString("en-NP")
      : "";

    const feeRows = fees.length
      ? fees
          .map(
            (f) =>
              `<tr>
                <td style="padding:8px;border-bottom:1px solid #eee">${f.feeStructure?.feeCategory?.name ?? "Fee"}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Rs. ${Number(f.netAmount).toLocaleString("en-NP")}</td>
              </tr>`
          )
          .join("")
      : `<tr><td colspan="2" style="padding:8px;color:#888">Fee details will be communicated separately.</td></tr>`;

    const typeLabels = {
      FEE_INVOICE: "Fee Invoice",
      PAYMENT_RECEIPT: "Payment Receipt",
      OUTSTANDING: "Outstanding Fee Notice",
      BULK: "Bulk Invoice",
      PARTIAL_PAYMENT: "Partial Payment Receipt"
    };

    return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#1d4ed8;color:#fff;padding:24px">
        <h2 style="margin:0">${schoolName}</h2>
        <p style="margin:4px 0 0;opacity:.8">${typeLabels[type] ?? "Invoice"}</p>
      </div>
      <div style="padding:24px">
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Date:</strong> ${generatedAt}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <thead>
            <tr style="background:#f3f4f6">
              <th style="padding:8px;text-align:left">Description</th>
              <th style="padding:8px;text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>${feeRows}</tbody>
        </table>
        
        ${paymentToken && (type === 'FEE_INVOICE' || type === 'BULK' || type === 'OUTSTANDING') ? `
        <div style="margin-top: 24px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/pay/invoice/${paymentToken}" style="background-color: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Pay Invoice Online
          </a>
          <p style="color: #666; font-size: 12px; margin-top: 8px;">Link valid for 24 hours.</p>
        </div>
        ` : ''}
        
        <p style="margin-top:24px;color:#555;font-size:13px">
          This is a system-generated invoice from ${schoolName}. For queries, please contact the school office.
        </p>
      </div>
    </div>`;
  }
}

module.exports = new InvoiceService();
