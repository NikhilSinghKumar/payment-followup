import { db } from "../src/db";
import { notificationTemplates } from "../src/db/schema";

export async function seedNotificationTemplates(): Promise<void> {
  await db.insert(notificationTemplates).values([
    {
      companyId: null,
      type: "BILL_SUBMITTED",
      name: "Bill Submitted",
      subject: "Invoice {{invoiceNumber}} Submitted",
      body: `
Your invoice has been successfully submitted.

Please review the invoice summary below and arrange payment on or before the due date.

If you have any questions, please contact our accounts team.
`,
      isDefault: true,
      isActive: true,
    },
    {
      companyId: null,
      type: "DUE_REMINDER",
      name: "Due Reminder",
      subject: "Gentle Payment Reminder - Invoice {{invoiceNumber}}",
      body: `
This is a friendly reminder that payment for the invoice below is approaching its due date.

We kindly request you to arrange payment before the due date to avoid any inconvenience.

Thank you for your continued business. 

If payment has already been made, please disregard this reminder.

`,
      isDefault: true,
      isActive: true,
    },
    {
      companyId: null,
      type: "INTERNAL_DUE_TODAY",
      name: "Internal Due Today",
      subject: "Action Required: Invoice {{invoiceNumber}} Due Today",
      body: `
This invoice is due for payment today and requires your immediate attention.

Please follow up with the customer to confirm the payment status and record any updates in the system.


`,
      isDefault: true,
      isActive: true,
    },
    {
      companyId: null,
      type: "DUE_TODAY",
      name: "Due Today",
      subject: "Payment Due Today - Invoice {{invoiceNumber}}",
      body: `
This is a reminder that payment for the invoice below is due today.

Kindly arrange payment at your earliest convenience to ensure uninterrupted services and avoid the invoice becoming overdue.

If payment has already been initiated or done, please disregard this reminder. Thank you for your prompt attention.

`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "OVERDUE_REMINDER",
      name: "Overdue Reminder",
      subject: "Overdue Payment Reminder - Invoice {{invoiceNumber}}",
      body: `
This is a reminder that the invoice below is due today.

Kindly arrange payment at your earliest convenience to avoid overdue charges or further reminders.

We appreciate your prompt attention.

If payment has already been made, please disregard this reminder.

If you have any questions or require any assistance, please contact our accounts team.
`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "PAYMENT_RECEIVED",
      name: "Payment Received",
      subject: "Payment Received - Invoice {{invoiceNumber}}",
      body: `
Thank you for your payment.

We have successfully received your payment and updated our records.

We sincerely appreciate your prompt payment and continued trust in our services.

`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "PAYMENT_CLEARED",
      name: "Payment Cleared",
      subject: "Invoice {{invoiceNumber}} Paid Successfully",
      body: `
We are pleased to inform you that the invoice below has been fully settled.

Thank you for completing the payment.

We look forward to continuing to serve you and appreciate your valued business.

`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "SERVICE_SUSPENSION_NOTICE",
      name: "Service Suspension Notice",
      subject: "Service Suspension Notice",
      body: `
Despite previous reminders, payment for the invoice below remains outstanding.

As per our payment policy, your account has been temporarily placed under service suspension.

Services will be restored promptly once payment has been received and verified.

If payment has already been made, please disregard this reminder.


`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "SERVICE_SUSPENSION_ALERT",
      name: "Service Suspension Alert",
      subject: "Immediate Action Required",
      body: `
The outstanding balance on the invoice below has exceeded the permitted credit period.

Your account remains under service suspension until the outstanding amount has been cleared.

If payment has already been made, please disregard this reminder.


`,
      isDefault: true,
      isActive: true,
    },
  ]);
}
