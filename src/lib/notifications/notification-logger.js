import { db } from "@/db";
import { notificationLogs } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

function sanitizeLogPayload(data) {
  return {
    companyId: data.companyId,
    clientId: data.clientId || null,
    invoiceId: data.invoiceId || null,
    paymentId: data.paymentId || null,
    channel: data.channel || "EMAIL",
    emailType: data.emailType || null,
    recipient: data.recipient || "",
    subject: data.subject || null,
    status: data.status || "PENDING",
  };
}

/**
 * Create notification log
 */
export async function createLog(data) {
  const [log] = await db
    .insert(notificationLogs)
    .values(sanitizeLogPayload(data))
    .returning();

  return log;
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
