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
  const rawGross = Number(data.invoiceAmount || 0);
  const rawNet = Number(data.netPayableAmount || 0);
  const invFace = rawGross > 0 ? rawGross : rawNet > 0 ? rawNet : 0;
  const netPayable = rawNet > 0 ? rawNet : invFace;
  const paid = Number(data.paid ?? data.paidAmount ?? 0);
  const due =
    data.due !== undefined && data.due !== null
      ? Number(data.due)
      : data.outstandingAmount !== undefined && data.outstandingAmount !== null
        ? Number(data.outstandingAmount)
        : Math.max(0, netPayable - paid);

  return {
    companyName: data.companyName,
    clientName: data.clientName,

    invoiceNumber: data.invoiceNumber,
    invoiceDate: data.invoiceDate,
    dueDate: data.dueDate,

    invoiceAmount: invFace,
    netPayableAmount: netPayable,

    // map from invoice summary
    paidAmount: paid,
    outstandingAmount: due,
    due,
    overdueDays: data.dueDays || data.overdueDays || 0,

    paymentAmount: Number(data.paymentAmount || 0),

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
  const paymentAmount = Number(data.paymentAmount || 0);
  const formattedAmount = paymentAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  const remainingOutstanding =
    data.netOutstanding !== undefined
      ? Number(data.netOutstanding)
      : data.restDueAmount !== undefined
        ? Number(data.restDueAmount)
        : data.remainingOutstanding !== undefined
          ? Number(data.remainingOutstanding)
          : data.totalAccountOutstanding !== undefined
            ? Number(data.totalAccountOutstanding)
            : 0;

  const totalOutstanding =
    data.totalNetPayable !== undefined
      ? Number(data.totalNetPayable)
      : data.netPayableAmount !== undefined
        ? Number(data.netPayableAmount)
        : data.totalOutstanding !== undefined
          ? Number(data.totalOutstanding)
          : remainingOutstanding + paymentAmount;

  const formattedTotalOutstanding = totalOutstanding.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  const formattedRemainingOutstanding = remainingOutstanding.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
    },
  );

  const description = isMultiInvoice
    ? `We are thankful for receiving your payment of ₹${formattedAmount}, which has been successfully settled against ${data.settledInvoices.length} invoice(s). Remaining outstanding balance: ₹${formattedRemainingOutstanding}.`
    : `We are thankful for receiving your payment of ₹${formattedAmount} against invoice ${data.invoiceNumber || ""}. Remaining outstanding balance: ₹${formattedRemainingOutstanding}.`;

  const invoiceSummary = isMultiInvoice
    ? data.settledInvoices.length === 1
      ? data.settledInvoices[0].invoiceNumber
      : `${data.settledInvoices[0]?.invoiceNumber || "Invoices"} (+${data.settledInvoices.length - 1} more)`
    : data.invoiceNumber || "";

  const variables = isMultiInvoice
    ? {
        ...buildClientVariables(data),
        invoiceNumber: invoiceSummary,
        amount: formattedAmount,
        paymentAmount,
        formattedPaymentAmount: formattedAmount,
        totalNetPayable: totalOutstanding,
        netPayableAmount: totalOutstanding,
        netOutstanding: remainingOutstanding,
        restDueAmount: remainingOutstanding,
        totalOutstanding,
        formattedTotalOutstanding,
        remainingOutstanding,
        formattedRemainingOutstanding,
        totalAccountOutstanding: remainingOutstanding,
        count: String(data.settledInvoices.length),
        paymentDate: data.paymentDate || new Date().toISOString(),
        paymentMethod: data.paymentMethod || data.method || "Bank Transfer",
        referenceNumber: data.referenceNumber || data.reference || "N/A",
        settledInvoices: data.settledInvoices,
        company: data.company,
      }
    : {
        ...buildInvoiceVariables(data),
        amount: formattedAmount,
        paymentAmount,
        formattedPaymentAmount: formattedAmount,
        totalNetPayable: totalOutstanding,
        netPayableAmount: totalOutstanding,
        netOutstanding: remainingOutstanding,
        restDueAmount: remainingOutstanding,
        totalOutstanding,
        formattedTotalOutstanding,
        remainingOutstanding,
        formattedRemainingOutstanding,
        totalAccountOutstanding: remainingOutstanding,
      };

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
    totalNetPayable:
      data.totalNetPayable ??
      data.netPayableAmount ??
      data.clientSummary?.totalNetPayable ??
      Number(data.totalOutstanding || 0),
    netPayableAmount:
      data.totalNetPayable ??
      data.netPayableAmount ??
      data.clientSummary?.totalNetPayable ??
      Number(data.totalOutstanding || 0),
    paymentsReceived:
      data.paymentsReceived ?? data.clientSummary?.paymentsReceived ?? 0,
    netOutstanding:
      data.netOutstanding ??
      data.restDueAmount ??
      data.clientSummary?.netOutstanding ??
      Number(data.totalOutstanding || 0),
    restDueAmount:
      data.netOutstanding ??
      data.restDueAmount ??
      data.clientSummary?.netOutstanding ??
      Number(data.totalOutstanding || 0),
    clientSummary: data.clientSummary || null,

    // ====================================================
    // Outstanding Invoices
    // ====================================================

    invoices: (data.invoices || []).map((invoice) => {
      const rawGross = Number(invoice.invoiceAmount || 0);
      const rawNet = Number(invoice.netPayableAmount || 0);
      const invFace = rawGross > 0 ? rawGross : rawNet > 0 ? rawNet : 0;
      const netPayable = rawNet > 0 ? rawNet : invFace;
      const paid = Number(invoice.paidAmount ?? invoice.paid ?? 0);
      const outstanding = Number(
        invoice.outstandingAmount !== undefined &&
          invoice.outstandingAmount !== null
          ? invoice.outstandingAmount
          : invoice.due !== undefined && invoice.due !== null
            ? invoice.due
            : Math.max(0, netPayable - paid),
      );

      return {
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        invoiceAmount: invFace,
        netPayableAmount: netPayable,
        paidAmount: paid,
        outstandingAmount: outstanding,
        creditDays: Number(invoice.creditDays || 0),
        agingDays: Number(invoice.agingDays || 0),
        agingStatus: invoice.agingStatus || "",
        agingColor: invoice.agingColor || "#16A34A",
      };
    }),

    // ====================================================
    // Sender Company
    // ====================================================

    senderCompany: data.senderCompany,
    senderEmail: data.senderEmail,
    senderPhone: data.senderPhone,
    senderLogo: data.senderLogo,
  };
}
