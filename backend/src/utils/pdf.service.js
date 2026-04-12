const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PdfService {
  /**
   * Generates an invoice PDF and pipes it to the provided writable stream (e.g., HTTP response)
   * @param {Object} invoice - The invoice data including school and student details
   * @param {Array} fees - List of student fees associated with the invoice
   * @param {WritableStream} outputStream - The stream to pipe the PDF into
   */
  generateInvoicePdf(invoice, fees, outputStream) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(outputStream);

    this.generateHeader(doc, invoice);
    this.generateTitle(doc, invoice);
    this.generateCustomerInformation(doc, invoice);
    this.generateInvoiceTable(doc, invoice, fees);
    this.generateFooter(doc, invoice);

    doc.end();
  }

  /**
   * Generates a payment receipt PDF and pipes it to the provided writable stream
   * @param {Object} payment - FeePayment details (with student and allocations)
   * @param {Object} school - School details
   * @param {WritableStream} outputStream - The stream to pipe the PDF into
   */
  generatePaymentReceiptPdf(payment, school, outputStream) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    doc.pipe(outputStream);

    // Header Fake object to reuse `generateHeader`
    const mockInvoiceForHeader = { school: school };
    this.generateHeader(doc, mockInvoiceForHeader, "PAYMENT RECEIPT");

    // Title
    doc.fillColor("#000000").fontSize(20).font("Helvetica-Bold").text("PAYMENT RECEIPT", 0, 150, { align: "center" });

    doc.moveDown();

    // Customer Info
    doc.fillColor("#333333").fontSize(10).font("Helvetica-Bold").text("RECEIPT TO:", 50, 200);

    const studentName = payment.student?.user?.name || "Student Name";
    const admissionNo = payment.student?.admissionNumber || "N/A";

    doc.font("Helvetica")
       .text(studentName, 50, 215)
       .text(`Admission No: ${admissionNo}`, 50, 230);

    const paymentDate = payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

    doc.font("Helvetica-Bold")
       .text(`Receipt No: ${payment.paymentReference}`, 50, 200, { align: "right" })
       .text(`Date: ${paymentDate}`, 50, 215, { align: "right" })
       .text(`Method: ${payment.paymentMethod.replace("_", " ").toUpperCase()}`, 50, 230, { align: "right" });

    doc.moveDown();

    // Table
    const tableTop = 280;
    doc.rect(50, tableTop, doc.page.width - 100, 24).fill("#F3F4F6");

    doc.fillColor("#6B7280").font("Helvetica-Bold").fontSize(10);
      
    // Simplified Headers
    doc.text("Description", 60, tableTop + 7, { width: 300 })
       .text("Amount Allocated", 400, tableTop + 7, { align: "right", width: 135 });

    doc.font("Helvetica").fillColor("#374151");

    let position = tableTop + 34;
    
    // Print allocations if loaded
    if (payment.allocations && payment.allocations.length > 0) {
      for (let i = 0; i < payment.allocations.length; i++) {
        const item = payment.allocations[i];
        const desc = item.studentFee?.feeStructure?.feeCategory?.name || "Fee Entry";
        const amt = Number(item.amount || 0);

        doc.text(desc, 60, position, { width: 300 })
           .text(`Rs. ${amt.toLocaleString("en-IN")}`, 400, position, { align: "right", width: 135 });

        this.generateHr(doc, position + 20);
        position += 30;
      }
    } else {
      // General item if no allocations joined
      doc.text("Fee Payment", 60, position, { width: 300 })
         .text(`Rs. ${Number(payment.totalAmount).toLocaleString("en-IN")}`, 400, position, { align: "right", width: 135 });
      this.generateHr(doc, position + 20);
      position += 30;
    }

    // Totals Section
    const subtotalPosition = position + 10;
    doc.font("Helvetica-Bold").fillColor("#111827");
      
    doc.text("TOTAL PAID", doc.page.width - 250, subtotalPosition + 10)
       .text(`Rs. ${Number(payment.totalAmount).toLocaleString("en-IN")}`, doc.page.width - 150, subtotalPosition + 10, { align: "right", width: 90 });

    doc.end();
  }

  generateHeader(doc, invoice) {
    const schoolName = invoice.school?.schoolName || "Paramount Academy";
    const address = invoice.school?.address?.fullAddress || "City, Country";
    const phone = invoice.school?.schoolPhone || "+1234567890";
    const email = invoice.school?.schoolEmail || "inquire@school.mail";
    
    // Abstract Top Banner Layout
    // Dark Blue Polygon
    doc.save()
       .moveTo(0, 0)
       .lineTo(150, 0)
       .lineTo(70, 150)
       .lineTo(0, 150)
       .fill("#0B1333");

    // Lighter Blue Polygon
    doc.save()
       .moveTo(0, 60)
       .lineTo(160, 60)
       .lineTo(90, 170)
       .lineTo(0, 170)
       .fill("#006CE6");
       
    // Secondary Blue Polygon
    doc.save()
       .moveTo(0, 120)
       .lineTo(130, 120)
       .lineTo(60, 210)
       .lineTo(0, 210)
       .fill("#2986CC");

    // Right Dark Blue Triangle
    doc.save()
       .moveTo(doc.page.width, 0)
       .lineTo(doc.page.width - 60, 0)
       .lineTo(doc.page.width, 140)
       .fill("#0B1333");

    // Logo placeholder box
    const rectX = doc.page.width - 120;
    const rectY = 40;
    doc.rect(rectX, rectY, 50, 50).stroke("#000000");
    doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold")
       .text("YOUR", rectX + 10, rectY + 15)
       .text("LOGO", rectX + 10, rectY + 28);

    // Header info line below the logo right aligned
    doc.fillColor("#666666").fontSize(8).font("Helvetica");
    const headerInfoText = `${address} | ${email} | ${phone}`;
    doc.text(headerInfoText, 0, 120, { align: "center" });

    doc.moveDown();
  }

  generateTitle(doc, invoice) {
    doc.fillColor("#111827").fontSize(20).font("Helvetica-Bold")
       .text("School Invoice", 0, 170, { align: "center" });
       
    const invoiceNo = invoice.id ? invoice.id.split("-")[0].toUpperCase() : "2050-045";
    doc.fontSize(10).font("Helvetica-Bold")
       .text(`Invoice Number: ${invoiceNo}`, 50, 200, { align: "right" });
  }

  generateCustomerInformation(doc, invoice) {
    const schoolName = invoice.school?.schoolName || "Paramount Academy";
    const address = invoice.school?.address?.fullAddress || "City, Country";
    const phone = invoice.school?.schoolPhone || "+1234567890";

    const studentName = invoice.student?.user?.name || "Student Name";
    const parentName = invoice.student?.parents?.[0]?.user?.name || "Parent Name";
    const parentEmail = invoice.student?.parents?.[0]?.user?.email || "parent@you.mail";
    const parentPhone = invoice.student?.parents?.[0]?.user?.phone || phone; // fallback
    const parentAddress = invoice.student?.parents?.[0]?.user?.address?.fullAddress || "City, Country";

    doc.fillColor("#111827").fontSize(10);
    
    let yPos = 220;
    const renderRow = (label, value) => {
        doc.font("Helvetica-Bold").text(`${label}: `, 50, yPos, { continued: true })
           .font("Helvetica").text(value);
        yPos += 15;
    };

    renderRow("School Name", schoolName);
    renderRow("School Address", address);
    renderRow("School Number", phone);
    
    yPos += 10;
    
    renderRow("Parent/Guardian Name", parentName);
    renderRow("Address", parentAddress);
    renderRow("Email", parentEmail);
    renderRow("Phone Number", parentPhone);
    
    renderRow("Student Name", studentName);

    doc.moveDown();
  }

  generateInvoiceTable(doc, invoice, fees) {
    let invoiceTableTop = 380;

    // Table Header Background
    doc.rect(50, invoiceTableTop, doc.page.width - 100, 24).fill("#F3F4F6");

    doc.fillColor("#6B7280").font("Helvetica-Bold").fontSize(10);
      
    this.generateTableRow(
      doc,
      invoiceTableTop + 7,
      "Description of Services",
      "Quantity",
      "Unit Price",
      "Subtotal"
    );

    doc.font("Helvetica").fillColor("#374151");

    let position = invoiceTableTop + 34;
    let totalOriginal = 0;
    let totalDiscount = 0;
    let totalNet = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    for (let i = 0; i < fees.length; i++) {
        // Prevent page overflow
        if (position > doc.page.height - 200) {
            doc.addPage();
            position = 50; // New page top margin
        }

      const item = fees[i];
      const desc = item.feeStructure?.feeCategory?.name || "Fee Entry";
      const original = Number(item.originalAmount || 0);
      const discount = Number(item.discountAmount || 0);
      const net = Number(item.netAmount || 0);
      const paid = Number(item.paidAmount || 0);
      const balance = Number(item.balanceAmount || 0);

      totalOriginal += original;
      totalDiscount += discount;
      totalNet += net;
      totalPaid += paid;
      totalBalance += balance;

      const unitPriceStr = `$${original.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      const subTotalStr = `$${net.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

      this.generateTableRow(
        doc,
        position,
        desc,
        "1",
        unitPriceStr,
        subTotalStr
      );

      this.generateHr(doc, position + 20);
      position += 30;
    }

    // Totals Section
    const subtotalPosition = position + 10;
    doc.font("Helvetica-Bold").fillColor("#374151");

    // Subtotal
    doc.text("Subtotal:", doc.page.width - 250, subtotalPosition)
       .font("Helvetica").text(`$${totalNet.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, doc.page.width - 150, subtotalPosition, { align: "right", width: 90 });

    // Tax (Hardcoded 0% for now since original didn't have tax logic, but matching layout)
    doc.font("Helvetica-Bold").text("Tax (0%):", doc.page.width - 250, subtotalPosition + 15)
       .font("Helvetica").text("$0.00", doc.page.width - 150, subtotalPosition + 15, { align: "right", width: 90 });

    // Total Amount Due
    doc.font("Helvetica-Bold").text("Total Amount Due:", doc.page.width - 250, subtotalPosition + 35)
       .text(`$${totalBalance.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, doc.page.width - 150, subtotalPosition + 35, { align: "right", width: 90 });
  }

  generateFooter(doc, invoice) {
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
    const email = invoice.school?.schoolEmail || "inquire@school.mail";
    
    let footerPos = doc.page.height - 180;
    
    doc.fillColor("#111827").fontSize(10);
    
    doc.font("Helvetica-Bold").text("• Payment: ", 50, footerPos, { continued: true })
       .font("Helvetica").text("You can pay through eswa and khallti from you school portal (parent dashboad)");
       
    footerPos += 30;
       
    doc.font("Helvetica-Bold").text("• Payment Due Date: ", 50, footerPos, { continued: true })
       .font("Helvetica").text(dueDate);

    footerPos += 25;

    doc.text("Should you have any questions regarding this invoice, please do not hesitate to contact me at", 50, footerPos);
    
    footerPos += 15;
    
    doc.font("Helvetica-Bold").text(email, 50, footerPos);
  }

  generateTableRow(
    doc,
    y,
    description,
    quantity,
    unitPrice,
    subtotal
  ) {
    doc.fontSize(10)
      .text(description, 60, y, { width: 250 })
      .text(quantity, 310, y, { width: 60, align: "center" })
      .text(unitPrice, 370, y, { width: 80, align: "center" })
      .text(subtotal, 450, y, { width: 95, align: "right" });
  }

  generateHr(doc, y) {
    doc.strokeColor("#E5E7EB").lineWidth(1)
      .moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  }
}

module.exports = new PdfService();
