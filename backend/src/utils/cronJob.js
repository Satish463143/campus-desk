const cron = require('node-cron');
const prisma = require('../config/db.config');
const MailService = require('./mail.service');
const smsService = require('./smsService');
const { FeeStatus } = require('../config/constant.config');

// ──────────────────────────────────────────────────────────────────────────────
// Helper: build a simple HTML reminder email
// ──────────────────────────────────────────────────────────────────────────────
function buildReminderHtml(fee, timing) {
    const studentName = fee.student?.user?.name ?? 'Student';
    const categoryName = fee.feeStructure?.feeCategory?.name ?? 'Fee';
    const schoolName = fee.school?.schoolName ?? 'School';
    const dueDate = fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-NP') : '';
    const balance = Number(fee.balanceAmount || 0).toLocaleString('en-NP', { minimumFractionDigits: 2 });

    return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#1d4ed8;color:#fff;padding:24px">
        <h2 style="margin:0">${schoolName}</h2>
        <p style="margin:4px 0 0;opacity:.8">Fee Payment Reminder</p>
      </div>
      <div style="padding:24px">
        <p>Dear Parent/Guardian,</p>
        <p>This is a reminder that the <strong>${categoryName}</strong> fee for <strong>${studentName}</strong> is due <strong>${timing}</strong> (${dueDate}).</p>
        <p><strong>Outstanding Amount: Rs. ${balance}</strong></p>
        <p>Please make the payment at the earliest convenience to avoid any inconvenience.</p>
        <p style="color:#555;font-size:13px">This is a system-generated reminder from ${schoolName}.</p>
      </div>
    </div>`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: check for dedup (has an auto reminder of same type already been sent?)
// ──────────────────────────────────────────────────────────────────────────────
async function hasSentAutoReminder(studentFeeId, reminderType) {
    const existing = await prisma.feeReminder.findFirst({
        where: {
            studentFeeId,
            reminderType,
            isAutomatic: true,
            sentAt: { not: null }
        }
    });
    return !!existing;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: send reminder to all parents of a student fee
// ──────────────────────────────────────────────────────────────────────────────
async function sendAutoReminder(fee, reminderType, timing) {
    const parents = fee.student?.parents ?? [];
    for (const parent of parents) {
        // Skip if already sent for this student fee + type
        if (await hasSentAutoReminder(fee.id, reminderType)) continue;

        // Create reminder record and mark as sent atomically
        await prisma.feeReminder.create({
            data: {
                schoolId: fee.schoolId,
                parentId: parent.id,
                studentFeeId: fee.id,
                reminderType,
                reminderDate: new Date(),
                isAutomatic: true,
                sentAt: new Date()
            }
        });

        const email = parent.user?.email;
        const phone = parent.user?.phone;
        const studentName = fee.student?.user?.name ?? 'Student';
        const categoryName = fee.feeStructure?.feeCategory?.name ?? 'Fee';

        if (email) {
            await MailService.sendMail(
                email,
                `Fee Reminder — ${categoryName} due ${timing}`,
                buildReminderHtml(fee, timing)
            );
        }

        if (phone) {
            const msg = `Reminder: ${categoryName} fee (Rs. ${Number(fee.balanceAmount || 0).toLocaleString('en-NP')}) for ${studentName} is due ${timing}. Please pay to avoid late fees.`;
            await smsService.sendSMS(phone, msg);
        }

        console.log(`[Auto Reminder] Sent ${reminderType} | Student: ${studentName} | Parent: ${email || phone}`);
    }
}

const initCronJobs = () => {
    // ──────────────────────────────────────────────────────────────────────────
    // Existing cron: process manually scheduled reminders (unchanged)
    // ──────────────────────────────────────────────────────────────────────────
    cron.schedule('0 8 * * *', async () => {
        console.log('Running Fee Reminder Cron Job...');
        try {
            const today = new Date();

            const pendingReminders = await prisma.feeReminder.findMany({
                where: {
                    sentAt: null,
                    isAutomatic: false,
                    reminderDate: { lte: today },
                    studentFee: {
                        status: { not: FeeStatus.PAID }
                    }
                },
                include: {
                    studentFee: {
                        include: {
                            student: { include: { user: true } },
                            feeStructure: { include: { feeCategory: true } },
                            payments: true
                        }
                    },
                    parent: { include: { user: true } },
                    school: true
                }
            });

            if (pendingReminders.length === 0) {
                console.log('No pending fee reminders to send today.');
                return;
            }

            console.log(`Found ${pendingReminders.length} pending reminders to process.`);

            for (const reminder of pendingReminders) {
                const parentEmail = reminder.parent.user.email;
                const parentPhone = reminder.parent.user.phone;
                const studentName = reminder.studentFee.student.user.name;
                const feeCategory = reminder.studentFee.feeStructure.feeCategory.name;

                const totalPaid = reminder.studentFee.payments.reduce((sum, p) => sum + p.amount, 0);
                const remainingDue = reminder.studentFee.amount - totalPaid;

                // ------------------------------------------------------------------
                // MOCK SEND NOTIFICATION:
                // Replace this with your actual Email/SMS service logic
                // e.g., emailService.sendFeeReminder(parentEmail, studentName, remainingDue);
                // e.g., smsService.send(parentPhone, `Reminder: Fee pending for ${studentName}`);
                // ------------------------------------------------------------------

                console.log(`[Notification Ready] Type: ${reminder.reminderType} | To: ${parentEmail || parentPhone} | Student: ${studentName} | Category: ${feeCategory} | Due: ${remainingDue}`);

                await prisma.feeReminder.update({
                    where: { id: reminder.id },
                    data: { sentAt: new Date() }
                });
            }

            console.log('Fee Reminder Cron Job completed successfully.');

        } catch (error) {
            console.error('Error executing Fee Reminder Cron Job:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kathmandu"
    });

    // ──────────────────────────────────────────────────────────────────────────
    // NEW cron: automatic rule-based reminders
    //   Rule 1: 3 days before due → first_notice
    //   Rule 2: 1 day after due   → second_notice
    // ──────────────────────────────────────────────────────────────────────────
    cron.schedule('0 8 * * *', async () => {
        console.log('Running Auto Fee Reminder Cron Job...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // --- RULE 1: Due in exactly 3 days (first_notice) ---
            const in3Days = new Date(today);
            in3Days.setDate(in3Days.getDate() + 3);
            const in3DaysEnd = new Date(in3Days);
            in3DaysEnd.setHours(23, 59, 59, 999);

            const dueSoonFees = await prisma.studentFee.findMany({
                where: {
                    dueDate: { gte: in3Days, lte: in3DaysEnd },
                    status: { not: FeeStatus.PAID },
                    balanceAmount: { gt: 0 }
                },
                include: {
                    student: {
                        include: {
                            user: true,
                            parents: { include: { user: true } }
                        }
                    },
                    feeStructure: { include: { feeCategory: true } },
                    school: { select: { schoolName: true, feeSetting: { select: { reminderEnabled: true } } } }
                }
            });

            for (const fee of dueSoonFees) {
                if (!fee.school?.feeSetting?.reminderEnabled) continue;
                await sendAutoReminder(fee, 'first_notice', 'in 3 days');
            }

            console.log(`[Auto Reminder] first_notice processed for ${dueSoonFees.length} fees.`);

            // --- RULE 2: Grace period expired (second_notice) ---
            // Fetch all distinct graceDays settings and send overdue reminders
            // for fees whose due date was exactly graceDays ago (grace period just expired)
            const allSettings = await prisma.feeSetting.findMany({
                select: { schoolId: true, graceDays: true, reminderEnabled: true }
            });
            const settingsMap = new Map(allSettings.map(s => [s.schoolId, s]));

            // Collect unique graceDays values to query efficiently
            const uniqueGraceDays = [...new Set(allSettings.map(s => s.graceDays))];
            // Also include default (5) for schools without a FeeSetting record
            if (!uniqueGraceDays.includes(5)) uniqueGraceDays.push(5);

            let overdueTotal = 0;
            for (const gd of uniqueGraceDays) {
                const graceExpiredDate = new Date(today);
                graceExpiredDate.setDate(graceExpiredDate.getDate() - gd);
                const graceExpiredEnd = new Date(graceExpiredDate);
                graceExpiredEnd.setHours(23, 59, 59, 999);

                // Find schools that use this graceDays value
                const schoolIdsForGd = allSettings
                    .filter(s => s.graceDays === gd)
                    .map(s => s.schoolId);

                const overdueFees = await prisma.studentFee.findMany({
                    where: {
                        dueDate: { gte: graceExpiredDate, lte: graceExpiredEnd },
                        status: { not: FeeStatus.PAID },
                        balanceAmount: { gt: 0 },
                        ...(schoolIdsForGd.length > 0 && { schoolId: { in: schoolIdsForGd } })
                    },
                    include: {
                        student: {
                            include: {
                                user: true,
                                parents: { include: { user: true } }
                            }
                        },
                        feeStructure: { include: { feeCategory: true } },
                        school: { select: { schoolName: true, feeSetting: { select: { reminderEnabled: true } } } }
                    }
                });

                for (const fee of overdueFees) {
                    if (!fee.school?.feeSetting?.reminderEnabled) continue;
                    await sendAutoReminder(fee, 'second_notice', `${gd} days ago (overdue, after grace period)`);
                }
                overdueTotal += overdueFees.length;
            }

            console.log(`[Auto Reminder] second_notice processed for ${overdueTotal} fees.`);
            console.log('Auto Fee Reminder Cron Job completed.');

        } catch (error) {
            console.error('Error executing Auto Fee Reminder Cron Job:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kathmandu"
    });
};

module.exports = initCronJobs;
