import { NOTIFICATION_TYPES, NOTIFICATION_META } from "./notification-types";

import { buildActionUrl } from "./notification-utils";

function buildBaseNotification(type, data, message, templateVariables = {}) {
  const meta = NOTIFICATION_META[type];

  if (!meta) {
    throw new Error(`Notification metadata not found: ${type}`);
  }

  return {
    type,
    priority: meta.priority,
    title: meta.title,
    message,
    icon: meta.icon,
    color: meta.color,

    actionUrl: buildActionUrl(
      meta.action,
      data.invoiceId ?? data.clientId ?? data.paymentId ?? data.followupId,
    ),

    templateVariables,
  };
}

function buildInvoiceVariables(data) {
  return {
    companyName: data.companyName,
    clientName: data.clientName,

    invoiceNumber: data.invoiceNumber,
    invoiceDate: data.invoiceDate,
    dueDate: data.dueDate,

    invoiceAmount: data.invoiceAmount,

    // map from invoice summary
    paidAmount: data.paid,
    outstandingAmount: data.due,
    overdueDays: data.dueDays,

    paymentAmount: data.paymentAmount,

    senderCompany: data.senderCompany,
    senderEmail: data.senderEmail,
    senderPhone: data.senderPhone,
    // senderWebsite: data.website,
    senderLogo: data.senderLogo,
  };
}

function buildClientVariables(data) {
  return {
    clientId: data.clientId,
    clientName: data.clientName,

    totalOutstanding: Number(data.totalOutstanding || 0),
    invoiceCount: Number(data.invoiceCount || 0),

    senderCompany: data.senderCompany,
    senderEmail: data.senderEmail,
    senderPhone: data.senderPhone,
    senderLogo: data.senderLogo,
  };
}

function buildBillSubmitted(data) {
  return buildBaseNotification(
    NOTIFICATION_TYPES.BILL_SUBMITTED,
    data,
    `Invoice ${data.invoiceNumber} has been submitted to ${data.clientName}.`,
    buildInvoiceVariables(data),
  );
}

function buildDueReminder(data) {
  return buildBaseNotification(
    NOTIFICATION_TYPES.DUE_REMINDER,
    data,
    `Payment reminder for ${data.clientName}.`,
    buildClientPaymentReminderVariables(data),
  );
}

function buildInvoiceDue(data) {
  return buildBaseNotification(
    NOTIFICATION_TYPES.INVOICE_DUE,
    data,
    `Invoice ${data.invoiceNumber} is due today.`,
    buildInvoiceVariables(data),
  );
}

function buildOverdueReminder(data) {
  return buildBaseNotification(
    NOTIFICATION_TYPES.OVERDUE_REMINDER,
    data,
    `Payment reminder for ${data.clientName}.`,
    buildClientPaymentReminderVariables(data),
  );
}

function buildPaymentReceived(data) {
  const isMultiInvoice =
    Array.isArray(data.settledInvoices) && data.settledInvoices.length > 0;
  const formattedAmount = Number(data.paymentAmount || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
    },
  );
  const description = isMultiInvoice
    ? `We have received your payment of ₹${formattedAmount}, which has been successfully settled against ${data.settledInvoices.length} invoice(s).`
    : `We have received your payment of ₹${formattedAmount} against invoice ${data.invoiceNumber || ""}.`;

  const invoiceSummary = isMultiInvoice
    ? data.settledInvoices.length === 1
      ? data.settledInvoices[0].invoiceNumber
      : `${data.settledInvoices[0]?.invoiceNumber || "Invoices"} (+${data.settledInvoices.length - 1} more)`
    : data.invoiceNumber || "";

  const variables = isMultiInvoice
    ? {
        ...buildClientVariables(data),
        invoiceNumber: invoiceSummary,
        paymentAmount: Number(data.paymentAmount || 0),
        paymentDate: data.paymentDate || new Date().toISOString(),
        paymentMethod: data.paymentMethod || data.method || "Bank Transfer",
        referenceNumber: data.referenceNumber || data.reference || "N/A",
        settledInvoices: data.settledInvoices,
        totalAccountOutstanding: data.totalAccountOutstanding,
        company: data.company,
      }
    : buildInvoiceVariables(data);

  return buildBaseNotification(
    NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    data,
    description,
    variables,
  );
}

function buildPaymentCleared(data) {
  return buildBaseNotification(
    NOTIFICATION_TYPES.PAYMENT_CLEARED,
    data,
    `Invoice ${data.invoiceNumber} has been fully paid.`,
    buildInvoiceVariables(data),
  );
}

function buildServiceSuspensionNotice(data) {
  return buildBaseNotification(
    NOTIFICATION_TYPES.SERVICE_SUSPENSION_NOTICE,
    data,
    `Your account with ${data.senderCompany} is recommended for service suspension due to continued non-payment.`,
    buildClientVariables(data),
  );
}

function buildServiceSuspensionAlert(data) {
  return buildBaseNotification(
    NOTIFICATION_TYPES.SERVICE_SUSPENSION_ALERT,
    data,
    `Client ${data.clientName} should now be blocked due to continued non-payment.`,
    buildClientVariables(data),
  );
}

export function buildNotification(type, data = {}) {
  switch (type) {
    case NOTIFICATION_TYPES.BILL_SUBMITTED:
      return buildBillSubmitted(data);

    case NOTIFICATION_TYPES.DUE_REMINDER:
      return buildDueReminder(data);

    case NOTIFICATION_TYPES.INVOICE_DUE:
      return buildInvoiceDue(data);

    case NOTIFICATION_TYPES.OVERDUE_REMINDER:
      return buildOverdueReminder(data);

    case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
      return buildPaymentReceived(data);

    case NOTIFICATION_TYPES.PAYMENT_CLEARED:
      return buildPaymentCleared(data);

    case NOTIFICATION_TYPES.SERVICE_SUSPENSION_NOTICE:
      return buildServiceSuspensionNotice(data);

    case NOTIFICATION_TYPES.SERVICE_SUSPENSION_ALERT:
      return buildServiceSuspensionAlert(data);

    default:
      throw new Error(`Unsupported notification type: ${type}`);
  }
}

/**
 * ======================================================
 * Client Payment Reminder Variables
 * ======================================================
 *
 * Converts client-level reminder data into the variables
 * required by the email template.
 */
export function buildClientPaymentReminderVariables(data) {
  return {
    // ====================================================
    // Client
    // ====================================================

    clientId: data.clientId,
    clientName: data.clientName,
    email: data.email,

    // ====================================================
    // Account Summary
    // ====================================================

    totalOutstanding: Number(data.totalOutstanding || 0),
    invoiceCount: Number(data.invoiceCount || 0),

    // ====================================================
    // Outstanding Invoices
    // ====================================================

    invoices: (data.invoices || []).map((invoice) => ({
      invoiceId: invoice.invoiceId,

      invoiceNumber: invoice.invoiceNumber,

      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,

      invoiceAmount: Number(invoice.invoiceAmount || 0),

      paidAmount: Number(invoice.paidAmount || 0),

      outstandingAmount: Number(invoice.outstandingAmount || 0),

      // ----------------------------------------------
      // Credit Terms
      // ----------------------------------------------

      creditDays: Number(invoice.creditDays || 0),

      // ----------------------------------------------
      // Aging / Status
      // ----------------------------------------------

      agingDays: Number(invoice.agingDays || 0),

      agingStatus: invoice.agingStatus || "",

      agingColor: invoice.agingColor || "#16A34A",
    })),

    // ====================================================
    // Sender Company
    // ====================================================

    senderCompany: data.senderCompany,
    senderEmail: data.senderEmail,
    senderPhone: data.senderPhone,
    senderLogo: data.senderLogo,
  };
}
