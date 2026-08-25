import {
  getInvoiceNotificationData,
  getClientPaymentReceivedData,
} from "./notification-data";
import {
  processNotification,
  notifyClientPaymentReceived,
} from "./notification-services";

import {
  NOTIFICATION_TYPES,
  TEMPLATE_TYPES,
} from "@/lib/notifications/notification-types";

// ======================================================
// Invoice Events
// ======================================================

export async function processInvoiceEvents(invoiceId) {
  const data = await getInvoiceNotificationData(invoiceId);

  if (!data) return;

  await processNotification(
    NOTIFICATION_TYPES.BILL_SUBMITTED,
    TEMPLATE_TYPES.BILL_SUBMITTED,
    data,
  );
}

// ======================================================
// Payment Events (Single Invoice or Client Batch)
// ======================================================

export async function processPaymentEvents(invoiceId, paymentId) {
  const data = await getInvoiceNotificationData(invoiceId, paymentId);

  if (!data) return;

  // Use client-wise settlement notification structure
  const clientData = await getClientPaymentReceivedData({
    clientId: data.clientId,
    companyId: data.companyId,
    paymentId,
    paymentDetails: {
      amount: data.paymentAmount,
      paymentDate: data.paymentDate,
    },
    settledInvoices: [
      {
        invoiceId: data.invoiceId,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        invoiceAmount: data.invoiceAmount,
        settledAmount: data.paymentAmount,
        remainingBalance: data.outstandingAmount,
      },
    ],
  });

  if (clientData && clientData.email) {
    await notifyClientPaymentReceived(clientData);
  } else {
    // Fallback if client data could not be aggregated
    if (data.outstandingAmount <= 0) {
      await processNotification(
        NOTIFICATION_TYPES.PAYMENT_CLEARED,
        TEMPLATE_TYPES.PAYMENT_CLEARED,
        data,
      );
    } else if (data.paymentAmount > 0) {
      await processNotification(
        NOTIFICATION_TYPES.PAYMENT_RECEIVED,
        TEMPLATE_TYPES.PAYMENT_RECEIVED,
        data,
      );
    }
  }
}

/**
 * Direct client-wise multi-invoice payment settlement notification
 */
export async function processClientPaymentSettlementEvent({
  clientId,
  companyId,
  paymentId = null,
  paymentDetails = {},
  settledInvoices = [],
}) {
  const clientData = await getClientPaymentReceivedData({
    clientId,
    companyId,
    paymentId,
    paymentDetails,
    settledInvoices,
  });

  if (!clientData || !clientData.email) {
    console.warn(
      `[processClientPaymentSettlementEvent] No recipient email or data found for client #${clientId}`,
    );
    return { success: false, reason: "No recipient email found" };
  }

  return await notifyClientPaymentReceived(clientData);
}
