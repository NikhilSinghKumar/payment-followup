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

Your invoice {{invoiceNumber}} has been submitted successfully.

Invoice Amount: ₹{{invoiceAmount}}

Thank you for your business.

Regards,
{{senderCompany}}
`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "DUE_REMINDER",
      name: "Due Reminder",
      subject: "Payment Reminder - Invoice {{invoiceNumber}}",
      body: `
Dear {{companyName}},

This is a reminder that Invoice {{invoiceNumber}} is due on {{dueDate}}.

Outstanding Amount: ₹{{outstandingAmount}}

Regards,
{{senderCompany}}
`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "INTERNAL_DUE_TODAY",
      name: "Invoice Due Today",
      subject: "Invoice {{invoiceNumber}} is Due Today",
      body: `
Dear {{companyName}},

Invoice {{invoiceNumber}} is due today.

Outstanding Amount: ₹{{outstandingAmount}}

Please arrange payment today.

Regards,
{{senderCompany}}
`,
      isDefault: true,
      isActive: true,
    },

    {
      companyId: null,
      type: "OVERDUE_REMINDER",
      name: "Overdue Reminder",
      subject: "Overdue Invoice {{invoiceNumber}}",
      body: `
Dear {{companyName}},

Invoice {{invoiceNumber}} is overdue by {{overdueDays}} day(s).

Outstanding Amount: ₹{{outstandingAmount}}

Kindly clear the outstanding payment.

Regards,
{{senderCompany}}
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

We have received your payment of ₹{{paymentAmount}}.

Invoice: {{invoiceNumber}}

Thank you.

Regards,
{{senderCompany}}
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

Invoice {{invoiceNumber}} has been fully paid.

Thank you for your payment.

Regards,
{{senderCompany}}
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

Despite repeated reminders, Invoice {{invoiceNumber}} remains unpaid.

Please clear the outstanding dues to avoid suspension of services.

Regards,
{{senderCompany}}
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

Your services have been suspended due to prolonged non-payment.

Please contact us after clearing your dues.

Regards,
{{senderCompany}}
`,
      isDefault: true,
      isActive: true,
    },
  ]);

  console.log("✅ Notification Templates Seeded");
}
