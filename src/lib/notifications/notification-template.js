import { db } from "@/db";
import { notificationTemplates } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { replaceTemplateVariables } from "./notification-utils";
import { DEFAULT_NOTIFICATION_TEMPLATES } from "./seed-notification-templates";

/**
 * Get notification template
 *
 * First checks company template.
 * Falls back to default template in DB.
 * Falls back to in-memory DEFAULT_NOTIFICATION_TEMPLATES.
 */
export async function getTemplate(companyId, type) {
  let template = null;
  try {
    if (companyId) {
      const rows = await db
        .select()
        .from(notificationTemplates)
        .where(
          and(
            eq(notificationTemplates.companyId, companyId),
            eq(notificationTemplates.type, type),
            eq(notificationTemplates.isActive, true),
          ),
        )
        .limit(1);
      template = rows[0] || null;
    }

    if (!template) {
      const defaultRows = await db
        .select()
        .from(notificationTemplates)
        .where(
          and(
            isNull(notificationTemplates.companyId),
            eq(notificationTemplates.type, type),
            eq(notificationTemplates.isActive, true),
          ),
        )
        .limit(1);
      template = defaultRows[0] || null;
    }
  } catch (err) {
    console.warn(`[getTemplate] DB lookup error for ${type}:`, err.message);
  }

  if (!template) {
    template =
      DEFAULT_NOTIFICATION_TEMPLATES.find((t) => t.type === type) || null;
  }

  return template;
}

/**
 * Render template with variables
 */
export async function renderTemplate(companyId, type, variables = {}) {
  const template = await getTemplate(companyId, type);

  if (!template) {
    throw new Error(`Template not found: ${type}`);
  }

  return {
    subject: replaceTemplateVariables(template.subject, variables),

    body: replaceTemplateVariables(template.body, variables),

    template,
  };
}

/**
 * Create company template
 */
export async function createTemplate(data) {
  const [template] = await db
    .insert(notificationTemplates)
    .values(data)
    .returning();

  return template;
}

/**
 * Update template
 */
export async function updateTemplate(id, data) {
  const [template] = await db
    .update(notificationTemplates)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(notificationTemplates.id, id))
    .returning();

  return template;
}

/**
 * Deactive company template
 */
export async function deactivateTemplate(id) {
  const [template] = await db
    .update(notificationTemplates)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(notificationTemplates.id, id))
    .returning();

  return template;
}

/**
 * Get all templates for company
 */
export async function getCompanyTemplates(companyId) {
  return db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.companyId, companyId));
}

export function isDefaultTemplate(template) {
  return template.companyId === null;
}
