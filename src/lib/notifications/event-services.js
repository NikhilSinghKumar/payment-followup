import { getInvoiceNotificationData } from "./notification-data";
import { processNotification } from "./notification-services";

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
// Payment Events
// ======================================================

export async function processPaymentEvents(invoiceId, paymentId) {
  console.log("[Payment Event] Started", { invoiceId, paymentId });

  const data = await getInvoiceNotificationData(invoiceId, paymentId);

  console.log("[Payment Event] Data:", data);

  if (!data) return;

  // ------------------------------------------
  // Invoice Fully Paid
  // ------------------------------------------

  if (data.outstandingAmount <= 0) {
    await processNotification(
      NOTIFICATION_TYPES.PAYMENT_CLEARED,
      TEMPLATE_TYPES.PAYMENT_CLEARED,
      data,
    );

    return;
  }

  // ------------------------------------------
  // Partial Payment Received
  // ------------------------------------------

  if (data.paymentAmount > 0) {
    await processNotification(
      NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      TEMPLATE_TYPES.PAYMENT_RECEIVED,
      data,
    );
  }
}
