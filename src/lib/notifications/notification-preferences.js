import { db } from "@/db";
import { notificationPreferences } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Get all notification preferences for a user
 */
export async function getUserPreferences(userId) {
  return db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
}

/**
 * Get a specific preference
 */
export async function getPreference(userId, type, channel) {
  const rows = await db
    .select()
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.type, type),
        eq(notificationPreferences.channel, channel),
      ),
    )
    .limit(1);

  return rows[0] || null;
}

/**
 * Check if notification is enabled
 */
export async function isNotificationEnabled(userId, type, channel) {
  const preference = await getPreference(userId, type, channel);

  // If no preference exists, default to enabled
  return preference ? preference.enabled : true;
}

/**
 * Create or update preference
 */
export async function upsertPreference(data) {
  const existing = await getPreference(data.userId, data.type, data.channel);

  if (existing) {
    const [updated] = await db
      .update(notificationPreferences)
      .set({
        enabled: data.enabled,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(notificationPreferences)
    .values(data)
    .returning();

  return created;
}

/**
 * Delete preference
 */
export async function deletePreference(id) {
  return db
    .delete(notificationPreferences)
    .where(eq(notificationPreferences.id, id));
}
