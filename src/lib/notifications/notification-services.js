import { buildNotification } from "./notification-builder";
import { createNotification } from "./notification-repository";
import { createLog, markFailed, updateStatus } from "./notification-logger";
import { isNotificationEnabled } from "./notification-preferences";
import { renderTemplate } from "./notification-template";
import { renderEmail } from "./email-renderer";

import { sendEmail, EMAIL_PROVIDER } from "@/lib/email";

import {
  NOTIFICATION_TYPES,
  DELIVERY_CHANNELS,
  NOTIFICATION_STATUS,
  TEMPLATE_TYPES,
} from "./notification-types";

// ======================================================
// Generic Notification Sender
// ======================================================

async function sendNotification(notificationType, templateType, data) {
  return processNotification(notificationType, templateType, data);
}

// ======================================================
// Public APIs
// ======================================================

export const billSubmission = (data) =>
  sendNotification(
    NOTIFICATION_TYPES.BILL_SUBMITTED,
    TEMPLATE_TYPES.BILL_SUBMITTED,
    data,
  );

export const dueReminder = (data) =>
  sendNotification(
    NOTIFICATION_TYPES.DUE_REMINDER,
    TEMPLATE_TYPES.DUE_REMINDER,
    data,
  );

export const dueToday = (data) =>
  sendNotification(
    NOTIFICATION_TYPES.INVOICE_DUE,
    TEMPLATE_TYPES.DUE_TODAY,
    data,
  );

export const internalDueToday = (data) =>
  sendNotification(
    NOTIFICATION_TYPES.INVOICE_DUE,
    TEMPLATE_TYPES.INTERNAL_DUE_TODAY,
    data,
  );

export const overdueReminder = (data) =>
  sendNotification(
    NOTIFICATION_TYPES.OVERDUE_REMINDER,
    TEMPLATE_TYPES.OVERDUE_REMINDER,
    data,
  );

export const paymentReceived = (data) =>
  sendNotification(
    NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    TEMPLATE_TYPES.PAYMENT_RECEIVED,
    data,
  );

export const paymentCleared = (data) =>
  sendNotification(
    NOTIFICATION_TYPES.PAYMENT_CLEARED,
    TEMPLATE_TYPES.PAYMENT_CLEARED,
    data,
  );

export const serviceSuspensionNotice = (data) =>
  sendNotification(
    NOTIFICATION_TYPES.SERVICE_SUSPENSION_NOTICE,
    TEMPLATE_TYPES.SERVICE_SUSPENSION_NOTICE,
    data,
  );

export const serviceSuspensionAlert = (data) =>
  sendNotification(
    NOTIFICATION_TYPES.SERVICE_SUSPENSION_ALERT,
    TEMPLATE_TYPES.SERVICE_SUSPENSION_ALERT,
    data,
  );

// ======================================================
// Core Notification Processor
// ======================================================

export async function processNotification(
  notificationType,
  templateType,
  data,
) {
  // ------------------------------------------
  // Build Notification Payload
  // ------------------------------------------

  const notification = buildNotification(notificationType, data);
  if (!notification) {
    throw new Error(`Failed to build notification: ${notificationType}`);
  }

  // ------------------------------------------
  // Save Notification
  // ------------------------------------------

  const savedNotification = await createNotification({
    companyId: data.companyId,
    userId: data.userId,
    clientId: data.clientId,
    invoiceId: data.invoiceId,
    paymentId: data.paymentId,

    ...notification,
  });

  // ------------------------------------------
  // Validate Email
  // ------------------------------------------

  if (!data.email) {
    return {
      success: true,
      skipped: true,
      reason: "Recipient email not available",
      notification: savedNotification,
    };
  }

  // ------------------------------------------
  // User Preference
  // ------------------------------------------

  let emailEnabled = true;

  if (data.userId) {
    emailEnabled = await isNotificationEnabled(
      data.userId,
      notificationType,
      DELIVERY_CHANNELS.EMAIL,
    );
  }

  if (!emailEnabled) {
    return {
      success: true,
      skipped: true,
      reason: "Email notification disabled",
      notification: savedNotification,
    };
  }

  // ------------------------------------------
  // Render Email
  // ------------------------------------------

  const emailContent = await renderTemplate(
    data.companyId,
    templateType,
    notification.templateVariables,
  );

  // ------------------------------------------
  // Create Notification Log
  // ------------------------------------------

  const log = await createLog({
    companyId: data.companyId,

    clientId: data.clientId,

    invoiceId: data.invoiceId,

    paymentId: data.paymentId,

    channel: DELIVERY_CHANNELS.EMAIL,

    recipient: data.email,

    subject: emailContent.subject,
  });

  let result;

  // ------------------------------------------
  // Send Email
  // ------------------------------------------

  const html = renderEmail({
    type: notificationType,
    body: emailContent.body,
    variables: notification.templateVariables,
    actionUrl: notification.actionUrl,
  });

  try {
    result = await sendEmail({
      to: data.email,
      subject: emailContent.subject,
      html,
    });

    await updateStatus(log.id, NOTIFICATION_STATUS.SENT, {
      sentAt: new Date(),
      provider: EMAIL_PROVIDER.SMTP,
      providerMessageId: result.messageId,
    });
  } catch (error) {
    await markFailed(log.id, error.message);

    throw error;
  }

  // ------------------------------------------
  // Response
  // ------------------------------------------

  return {
    success: true,

    notification: savedNotification,

    emailSent: true,

    messageId: result.messageId,

    logId: log.id,
  };
}
