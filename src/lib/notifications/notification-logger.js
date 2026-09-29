import { db } from "@/db";
import { notificationLogs } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

const VALID_EMAIL_TYPES = new Set([
  "BILL_SUBMITTED",
  "DUE_REMINDER",
  "OVERDUE_REMINDER",
  "FINAL_REMINDER",
  "PAYMENT_RECEIVED",
  "PAYMENT_CLEARED",
  "BLOCK_NOTICE",
  "SERVICE_SUSPENSION_NOTICE",
  "SERVICE_SUSPENSION_ALERT",
  "DUE_TODAY",
]);

function normalizeEmailType(type) {
  if (!type) return null;
  const upper = String(type).toUpperCase();
  if (VALID_EMAIL_TYPES.has(upper)) return upper;
  if (upper.includes("SUSPENSION") || upper.includes("BLOCK"))
    return "SERVICE_SUSPENSION_NOTICE";
  if (upper.includes("OVERDUE")) return "OVERDUE_REMINDER";
  if (upper.includes("DUE")) return "DUE_REMINDER";
  if (upper.includes("PAYMENT")) return "PAYMENT_RECEIVED";
  return null;
}

function sanitizeLogPayload(data) {
  return {
    companyId: data.companyId,
    clientId: data.clientId || null,
    invoiceId: data.invoiceId || null,
    paymentId: data.paymentId || null,
    channel: data.channel || "EMAIL",
    emailType: normalizeEmailType(data.emailType),
    recipient: data.recipient || "",
    subject: data.subject || null,
    status: data.status || "PENDING",
  };
}

/**
 * Create notification log
 */
export async function createLog(data) {
  try {
    const [log] = await db
      .insert(notificationLogs)
      .values(sanitizeLogPayload(data))
      .returning();

    return log;
  } catch (err) {
    console.warn(
      "createLog initial insert error, retrying with fallback:",
      err?.message,
    );
    try {
      const fallbackPayload = {
        ...sanitizeLogPayload(data),
        emailType: "BLOCK_NOTICE",
      };
      const [log] = await db
        .insert(notificationLogs)
        .values(fallbackPayload)
        .returning();

      return log;
    } catch (fallbackErr) {
      console.error("createLog failed completely:", fallbackErr?.message);
      return null;
    }
  }
}

/**
 * Get log by id
 */
export async function getLogById(id) {
  const rows = await db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.id, id))
    .limit(1);

  return rows[0] || null;
}

/**
 * Update notification status
 */
export async function updateStatus(id, status, extra = {}) {
  const [log] = await db
    .update(notificationLogs)
    .set({
      status,
      ...extra,
    })
    .where(eq(notificationLogs.id, id))
    .returning();

  return log;
}

/**
 * Mark delivered
 */
export async function markDelivered(id) {
  return updateStatus(id, "DELIVERED", {
    deliveredAt: new Date(),
  });
}

/**
 * Mark opened
 */
export async function markOpened(id) {
  return updateStatus(id, "OPENED", {
    openedAt: new Date(),
  });
}

/**
 * Mark failed
 */
export async function markFailed(id, errorMessage) {
  return updateStatus(id, "FAILED", {
    errorMessage,
  });
}

/**
 * Get invoice notification logs
 */
export async function getInvoiceLogs(invoiceId) {
  return db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.invoiceId, invoiceId))
    .orderBy(desc(notificationLogs.createdAt));
}

/**
 * Get client notification logs
 */
export async function getClientLogs(clientId) {
  return db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.clientId, clientId))
    .orderBy(desc(notificationLogs.createdAt));
}

/**
 * Get recent notification logs
 */
export async function getRecentLogs(companyId) {
  return db
    .select()
    .from(notificationLogs)
    .where(eq(notificationLogs.companyId, companyId))
    .orderBy(desc(notificationLogs.createdAt))
    .limit(100);
}

export async function saveProviderMessageId(id, providerMessageId) {
  return db
    .update(notificationLogs)
    .set({
      providerMessageId,
    })
    .where(eq(notificationLogs.id, id));
}
