import { db } from "@/db";
import { notificationTemplates } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export const DEFAULT_NOTIFICATION_TEMPLATES = [
  {
    companyId: null,
    type: "BILL_SUBMITTED",
    name: "Bill Submitted",
    subject: "Invoice {{invoiceNumber}} Submitted",
    body: `Please find the invoice details for your review and payment. If you require any clarification regarding the billing details, feel free to reach out to our Accounts Team.
Thank you for your continued business.`,
    isDefault: true,
    isActive: true,
  },
  {
    companyId: null,
    type: "DUE_REMINDER",
    name: "Due Reminder",
    subject: "Gentle Payment Reminder - Invoice {{invoiceNumber}}",
    body: `This is a friendly reminder that payment for the invoice below is approaching its due date. We kindly request you to arrange payment before the due date to avoid any inconvenience. Please ignore this email, if payment is already made.
Thank you for your continued business.`,
    isDefault: true,
    isActive: true,
  },
  {
    companyId: null,
    type: "INTERNAL_DUE_TODAY",
    name: "Internal Due Today",
    subject: "Action Required: Invoice {{invoiceNumber}} Due Today",
    body: `This invoice is due for payment today and requires your immediate attention.

Please follow up with the customer to confirm the payment status and record any updates in the system.`,
    isDefault: true,
    isActive: true,
  },
  {
    companyId: null,
    type: "DUE_TODAY",
    name: "Due Today",
    subject: "Payment Due Today - Invoice {{invoiceNumber}}",
    body: `This is a reminder that payment for the invoice below is due today.

Kindly arrange payment at your earliest convenience to ensure uninterrupted services and avoid the invoice becoming overdue.

If payment has already been initiated or done, please disregard this reminder. 

Thank you for your prompt attention.`,
    isDefault: true,
    isActive: true,
  },
  {
    companyId: null,
    type: "OVERDUE_REMINDER",
    name: "Overdue Reminder",
    subject: "Overdue Payment Reminder- PAFEX",
    body: `Hope this email finds you well.
This is a gentle reminder regarding your account balance with PAFEX. Our records indicate that you have one or more invoices that are currently overdue. Please arrange for the settlement of these invoices at your earliest convenience to avoid any temporary service suspension.
Thank you for your prompt attention and continued partnership.`,
    isDefault: true,
    isActive: true,
  },
  {
    companyId: null,
    type: "PAYMENT_RECEIVED",
    name: "Payment Received",
    subject: "Payment Received - PAFEX",
    body: `Thank you for your recent payment.

We have received your payment and settled it against the following invoice(s). We sincerely appreciate your prompt payment and continued trust in our services.
If you have any concerns or discrepancies regarding this settlement, please raise them with the PAFEX Accounts Team within 48 hours of receiving this notice; otherwise, this allocation will be considered final and permanently recorded against your account.
Thank you for your business and prompt cooperation.`,
    isDefault: true,
    isActive: true,
  },
  {
    companyId: null,
    type: "PAYMENT_CLEARED",
    name: "Payment Cleared",
    subject: "Invoice {{invoiceNumber}} Paid Successfully",
    body: `We are pleased to inform you that the invoice below has been fully settled.

Thank you for completing the payment.

We look forward to continuing to serve you and appreciate your valued business.`,
    isDefault: true,
    isActive: true,
  },
  {
    companyId: null,
    type: "SERVICE_SUSPENSION_NOTICE",
    name: "Service Suspension Notice",
    subject: "Service Suspension Notice",
    body: `Despite previous reminders, payment for the invoice below remains outstanding.

As per our payment policy, your account has been temporarily placed under service suspension.

Services will be restored promptly once payment has been received and verified.

If payment has already been made, please disregard this reminder.`,
    isDefault: true,
    isActive: true,
  },
  {
    companyId: null,
    type: "SERVICE_SUSPENSION_ALERT",
    name: "Service Suspension Alert",
    subject: "Immediate Action Required",
    body: `The outstanding balance on the invoice below has exceeded the permitted credit period.

Your account remains under service suspension until the outstanding amount has been cleared.

If payment has already been made, please disregard this reminder.`,
    isDefault: true,
    isActive: true,
  },
];

export async function seedNotificationTemplates() {
  for (const template of DEFAULT_NOTIFICATION_TEMPLATES) {
    const existingRows = await db
      .select()
      .from(notificationTemplates)
      .where(
        and(
          isNull(notificationTemplates.companyId),
          eq(notificationTemplates.type, template.type),
        ),
      )
      .limit(1);

    const existing = existingRows[0];

    if (!existing) {
      await db.insert(notificationTemplates).values(template);
    } else {
      // Sync/update default system template
      await db
        .update(notificationTemplates)
        .set({
          name: template.name,
          subject: template.subject,
          body: template.body,
          updatedAt: new Date(),
        })
        .where(eq(notificationTemplates.id, existing.id));
    }
  }
}
