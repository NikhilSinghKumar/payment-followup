import { db } from "../src/db";
import { notificationTemplates } from "../src/db/schema";

export async function seedNotificationTemplates(): Promise<void> {
  console.log("🌱 Seeding Notification Templates...");

  await db.insert(notificationTemplates).values([
    {
      companyId: null,
      type: "BILL_SUBMITTED",
      name: "Bill Submitted",
      subject: "Invoice {{invoiceNumber}} Submitted",
      body: `
Dear {{companyName}},

We hope you are doing well.

Please find below the details of the invoice recently issued by {{senderCompany}}.

----------------------------------------
Invoice Summary
----------------------------------------
Invoice Number      : {{invoiceNumber}}
Invoice Date        : {{invoiceDate}}
Due Date            : {{dueDate}}
Invoice Amount      : ₹{{invoiceAmount}}
----------------------------------------

Kindly process the payment on or before the due date to avoid any late payment reminders.

Should you have any questions regarding this invoice, please feel free to contact us.

Thank you for your continued business and support.

Warm Regards,

{{senderCompany}}
Email: {{senderEmail}}
Phone: {{senderPhone}}
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
Dear {{companyName}},

We hope this message finds you well.

This is a gentle reminder that payment for the following invoice is approaching its due date.

----------------------------------------
Invoice Summary
----------------------------------------
Invoice Number      : {{invoiceNumber}}
Invoice Date        : {{invoiceDate}}
Due Date            : {{dueDate}}
Invoice Amount      : ₹{{invoiceAmount}}
Paid Amount         : ₹{{paidAmount}}
Outstanding Amount  : ₹{{outstandingAmount}}
----------------------------------------

We kindly request you to arrange payment on or before the due date.

If payment has already been initiated, please ignore this reminder.

Thank you for your cooperation.

Regards,

{{senderCompany}}
Email: {{senderEmail}}
Phone: {{senderPhone}}
`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "OVERDUE_REMINDER",
      name: "Overdue Reminder",
      subject: "Gentle reminder about Overdue Invoice {{invoiceNumber}}",
      body: `
Dear {{companyName}},

Our records indicate that the following invoice remains unpaid.

----------------------------------------
Invoice Summary
----------------------------------------
Invoice Number      : {{invoiceNumber}}
Invoice Date        : {{invoiceDate}}
Due Date            : {{dueDate}}
Invoice Amount      : ₹{{invoiceAmount}}
Paid Amount         : ₹{{paidAmount}}
Outstanding Amount  : ₹{{outstandingAmount}}
----------------------------------------

We kindly request you to arrange payment at the earliest convenience.

If payment has already been made, please share the payment details so that we may update our records.

We appreciate your immediate attention to this matter.

Regards,

{{senderCompany}}
Email: {{senderEmail}}
Phone: {{senderPhone}}
`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "PAYMENT_RECEIVED",
      name: "Payment Received",
      subject: "Payment Received for Invoice {{invoiceNumber}}",
      body: `
Dear {{companyName}},

Thank you for your payment.

We have successfully received your payment against the following invoice.

----------------------------------------
Invoice Summary
----------------------------------------
Invoice Number      : {{invoiceNumber}}
Invoice Date        : {{invoiceDate}}
Due Date            : {{dueDate}}
Invoice Amount      : ₹{{invoiceAmount}}
Paid Amount         : ₹{{paidAmount}}
Outstanding Amount  : ₹{{outstandingAmount}}
----------------------------------------

Your payment has been recorded in our system.

We sincerely appreciate your timely payment and continued business with us.

Warm Regards,

{{senderCompany}}
Email: {{senderEmail}}
Phone: {{senderPhone}}
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
Dear {{companyName}},

We are pleased to inform you that full payment has been received for the invoice below.

----------------------------------------
Invoice Summary
----------------------------------------
Invoice Number      : {{invoiceNumber}}
Invoice Date        : {{invoiceDate}}
Due Date            : {{dueDate}}
Invoice Amount      : ₹{{invoiceAmount}}
Paid Amount         : ₹{{paidAmount}}
Outstanding Amount  : ₹{{outstandingAmount}}
----------------------------------------

There is no outstanding balance pending against this invoice.

Thank you for your continued trust and partnership with us.

We look forward to serving you again.

Warm Regards,

{{senderCompany}}
Email: {{senderEmail}}
Phone: {{senderPhone}}
`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "SERVICE_SUSPENSION_NOTICE",
      name: "Service Suspension Notice",
      subject: "Final Payment Reminder",
      body: `
Dear {{companyName}},

Despite our previous payment reminders, the following invoice remains unpaid.

Invoice Number      : {{invoiceNumber}}
Invoice Date        : {{invoiceDate}}
Due Date            : {{dueDate}}
Paid Amount         : ₹{{paidAmount}}
Outstanding Amount  : ₹{{outstandingAmount}}
Days Overdue        : {{overdueDays}}

This serves as our final payment reminder.

We kindly request that the outstanding amount be cleared immediately to avoid temporary suspension of logistics services associated with your account.

If payment has already been initiated, please share the transaction details for verification.

We appreciate your immediate cooperation.

Regards,

{{senderCompany}}
Email: {{senderEmail}}
Phone: {{senderPhone}}
`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "SERVICE_SUSPENSION_ALERT",
      name: "Service Suspension Alert",
      subject: "Services Suspended",
      body: `
Dear {{companyName}},

We regret to inform you that your account has been placed under temporary service suspension due to prolonged non-payment of the invoice listed below.

Invoice Number      : {{invoiceNumber}}
Invoice Date        : {{invoiceDate}}
Due Date            : {{dueDate}}
Paid Amount         : ₹{{paidAmount}}
Outstanding Amount  : ₹{{outstandingAmount}}
Days Overdue        : {{overdueDays}}

Services will remain suspended until the outstanding dues are cleared and payment confirmation is received.

Once payment has been verified, services will be restored as per our standard process.

Should you require any clarification or wish to discuss your account, please contact our accounts team.

Thank you for your understanding.

Regards,

{{senderCompany}}
Email: {{senderEmail}}
Phone: {{senderPhone}}
`,
      isDefault: true,
      isActive: true,
    },
  ]);

  console.log("✅ Notification Templates Seeded");
}
