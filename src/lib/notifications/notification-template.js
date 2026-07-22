import { db } from "@/db";
import { notificationTemplates } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { replaceTemplateVariables } from "./notification-utils";

/**
 * Get notification template
 *
 * First checks company template.
 * Falls back to default template.
 */
export async function getTemplate(companyId, type) {
  let template = await db.query.notificationTemplates.findFirst({
    where: and(
      eq(notificationTemplates.companyId, companyId),
      eq(notificationTemplates.type, type),
      eq(notificationTemplates.isActive, true),
    ),
  });

  if (!template) {
    template = await db.query.notificationTemplates.findFirst({
      where: and(
        isNull(notificationTemplates.companyId),
        eq(notificationTemplates.type, type),
        eq(notificationTemplates.isActive, true),
      ),
    });
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
  return db.query.notificationTemplates.findMany({
    where: eq(notificationTemplates.companyId, companyId),
  });
}

export function isDefaultTemplate(template) {
  return template.companyId === null;
}
