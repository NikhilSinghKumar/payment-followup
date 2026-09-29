import { db } from "@/db";
import { notificationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

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

/**
 * Fetch company-level notification settings (sendBillSubmission, sendPaymentConfirmation)
 */
async function getCompanyNotificationSettings(companyId) {
  if (!companyId) return null;
  try {
    const [row] = await db
      .select({
        sendBillSubmission: notificationSettings.sendBillSubmission,
        sendPaymentConfirmation: notificationSettings.sendPaymentConfirmation,
      })
      .from(notificationSettings)
      .where(eq(notificationSettings.companyId, companyId))
      .limit(1);
    return row || null;
  } catch (err) {
    console.error(
      "[getCompanyNotificationSettings] Error fetching settings:",
      err?.message || err,
    );
    return null;
  }
}

// ======================================================
// Invoice Events
// ======================================================

export async function processInvoiceEvents(invoiceId, options = {}) {
  const data = await getInvoiceNotificationData(invoiceId);

  if (!data) return { success: false, reason: "Invoice data not found" };

  // Determine whether to send email:
  // 1. Explicit override from user action (options.sendEmail)
  // 2. Company notification settings (sendBillSubmission)
  let shouldSendEmail = true;
  if (typeof options.sendEmail === "boolean") {
    shouldSendEmail = options.sendEmail;
  } else if (data.companyId) {
    const settings = await getCompanyNotificationSettings(data.companyId);
    if (settings && settings.sendBillSubmission === false) {
      shouldSendEmail = false;
    }
  }

  if (!shouldSendEmail) {
    console.log(
      `[processInvoiceEvents] Bill submission email skipped for invoice #${invoiceId} (sendEmail: ${options.sendEmail})`,
    );
    return {
      success: true,
      skipped: true,
      reason:
        "Bill submission email disabled by user preference or company setting",
    };
  }

  return await processNotification(
    NOTIFICATION_TYPES.BILL_SUBMITTED,
    TEMPLATE_TYPES.BILL_SUBMITTED,
    data,
  );
}

// ======================================================
// Payment Events (Single Invoice or Client Batch)
// ======================================================

export async function processPaymentEvents(invoiceId, paymentId, options = {}) {
  const data = await getInvoiceNotificationData(invoiceId, paymentId);

  if (!data)
    return { success: false, reason: "Invoice notification data not found" };

  let shouldSendEmail = true;
  if (typeof options.sendEmail === "boolean") {
    shouldSendEmail = options.sendEmail;
  } else if (data.companyId) {
    const settings = await getCompanyNotificationSettings(data.companyId);
    if (settings && settings.sendPaymentConfirmation === false) {
      shouldSendEmail = false;
    }
  }

  if (!shouldSendEmail) {
    console.log(
      `[processPaymentEvents] Payment confirmation email skipped for invoice #${invoiceId}, payment #${paymentId}`,
    );
    return {
      success: true,
      skipped: true,
      reason:
        "Payment confirmation email disabled by user preference or company setting",
    };
  }

  const cashAmount = Number(data.cashAmount || data.paymentAmount || 0);
  const tdsAmount = Number(data.tdsAmount || 0);
  const totalPayment = Number(
    data.totalPaymentAmount || cashAmount + tdsAmount,
  );

  // Use client-wise settlement notification structure
  const clientData = await getClientPaymentReceivedData({
    clientId: data.clientId,
    companyId: data.companyId,
    paymentId,
    paymentDetails: {
      amount: cashAmount,
      cashAmount,
      tdsAmount,
      totalPaymentAmount: totalPayment,
      paymentDate: data.paymentDate,
    },
    settledInvoices: [
      {
        invoiceId: data.invoiceId,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        invoiceAmount: data.invoiceAmount,
        netPayableAmount: data.netPayableAmount,
        cashSettled: cashAmount,
        tdsSettled: tdsAmount,
        settledAmount: totalPayment,
        remainingBalance: data.outstandingAmount,
      },
    ],
  });

  if (clientData && clientData.email) {
    return await notifyClientPaymentReceived(clientData);
  } else {
    // Fallback if client data could not be aggregated
    if (data.outstandingAmount <= 0) {
      return await processNotification(
        NOTIFICATION_TYPES.PAYMENT_CLEARED,
        TEMPLATE_TYPES.PAYMENT_CLEARED,
        data,
      );
    } else if (data.paymentAmount > 0) {
      return await processNotification(
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
  sendEmail,
}) {
  let shouldSendEmail = true;
  if (typeof sendEmail === "boolean") {
    shouldSendEmail = sendEmail;
  } else if (companyId) {
    const settings = await getCompanyNotificationSettings(companyId);
    if (settings && settings.sendPaymentConfirmation === false) {
      shouldSendEmail = false;
    }
  }

  if (!shouldSendEmail) {
    console.log(
      `[processClientPaymentSettlementEvent] Payment settlement email skipped for client #${clientId}, payment #${paymentId} (sendEmail: ${sendEmail})`,
    );
    return {
      success: true,
      skipped: true,
      reason:
        "Payment confirmation email disabled by user preference or company setting",
    };
  }

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
