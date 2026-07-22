import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, desc, eq, isNotNull, isNull, lt } from "drizzle-orm";

/**
 * Create a notification
 */
export async function createNotification(data) {
  const [notification] = await db
    .insert(notifications)
    .values(data)
    .returning();

  return notification;
}

/**
 * Bulk create notifications
 */
export async function createNotifications(data) {
  return db.insert(notifications).values(data).returning();
}

/**
 * Get notification by id
 */
export async function getNotificationById(id) {
  return db.query.notifications.findFirst({
    where: eq(notifications.id, id),

    with: {
      client: true,
      invoice: true,
      payment: true,
      user: true,
    },
  });
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),

    with: {
      client: true,
      invoice: true,
      payment: true,
    },

    orderBy: desc(notifications.createdAt),
  });
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(userId) {
  return db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false),
    ),

    orderBy: desc(notifications.createdAt),
  });
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
  return db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, userId),
      isNotNull(notifications.archivedAt),
    ),
    orderBy: desc(notifications.createdAt),
  });
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
