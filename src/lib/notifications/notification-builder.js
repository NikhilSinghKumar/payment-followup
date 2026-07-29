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
    `Invoice ${data.invoiceNumber} is due on ${data.dueDate}.`,
    buildInvoiceVariables(data),
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
    `Invoice ${data.invoiceNumber} is overdue by ${data.overdueDays} day(s).`,
    buildInvoiceVariables(data),
  );
}

function buildPaymentReceived(data) {
  return buildBaseNotification(
    NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    data,
    `Payment of ₹${data.paymentAmount} received against invoice ${data.invoiceNumber}.`,
    buildInvoiceVariables(data),
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
    `Client ${data.clientName} is recommended for service suspension.`,
    buildInvoiceVariables(data),
  );
}

function buildServiceSuspensionAlert(data) {
  return buildBaseNotification(
    NOTIFICATION_TYPES.SERVICE_SUSPENSION_ALERT,
    data,
    `Client ${data.clientName} should now be blocked due to continued non-payment.`,
    buildInvoiceVariables(data),
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
