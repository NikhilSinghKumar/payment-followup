import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, desc, eq, isNotNull, isNull, lt } from "drizzle-orm";

function sanitizeNotificationPayload(data) {
  return {
    companyId: data.companyId,
    userId: data.userId || null,
    clientId: data.clientId || null,
    invoiceId: data.invoiceId || null,
    paymentId: data.paymentId || null,
    type: data.type,
    priority: data.priority || "LOW",
    title: data.title || "Notification",
    message: data.message || "",
    actionUrl: data.actionUrl || null,
    icon: data.icon || null,
    color: data.color || null,
  };
}

/**
 * Create a notification
 */
export async function createNotification(data) {
  const [notification] = await db
    .insert(notifications)
    .values(sanitizeNotificationPayload(data))
    .returning();

  return notification;
}

/**
 * Bulk create notifications
 */
export async function createNotifications(data) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const sanitized = data.map(sanitizeNotificationPayload);
  return db.insert(notifications).values(sanitized).returning();
}

/**
 * Get notification by id
 */
export async function getNotificationById(id) {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id))
    .limit(1);

  return rows[0] || null;
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(userId) {
  return db
    .select()
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    )
    .orderBy(desc(notifications.createdAt));
}

/**
 * Mark notification as read
 */
export async function markAsRead(id) {
  const [notification] = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(eq(notifications.id, id))
    .returning();

  return notification;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId) {
  return db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );
}

/**
 * Archive notification
 */

export async function archiveNotification(id) {
  const [notification] = await db
    .update(notifications)
    .set({
      archivedAt: new Date(),
    })
    .where(eq(notifications.id, id))
    .returning();

  return notification;
}

export async function getArchivedNotifications(userId) {
  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        isNotNull(notifications.archivedAt),
      ),
    )
    .orderBy(desc(notifications.createdAt));
}

/**
 * Delete Archived old notifications
 */
export async function deleteArchivedNotifications(cutoffDate) {
  return db
    .delete(notifications)
    .where(
      and(
        lt(notifications.archivedAt, cutoffDate),
        isNotNull(notifications.archivedAt),
      ),
    );
}
