"use server";

import { db } from "@/db";
import {
  notificationSettings,
  notificationLogs,
  companies,
  clients,
  invoices,
  notificationEscalationRules,
  roles,
  departments,
  companyUsers,
  users,
} from "@/db/schema";
import { eq, desc, and, count, ilike, asc, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { runNotificationScheduler } from "@/lib/notifications/notification-scheduler";
import {
  ensureDefaultEscalationRules,
  evaluateAndRunEscalations,
} from "@/lib/notifications/escalation-service";
import { ensureDefaultDepartments } from "@/app/actions/department";

/**
 * Get notification settings for the user's company
 */
export async function getNotificationSettings() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { error: "Unauthorized" };
    }

    let [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.companyId, currentUser.companyId))
      .limit(1);

    // If not found, insert default settings for this company
    if (!settings) {
      const [newSettings] = await db
        .insert(notificationSettings)
        .values({
          companyId: currentUser.companyId,
          sendBillSubmission: true,
          reminderBeforeDue: true,
          reminderDaysBefore: 2,
          sendDueTodayNotification: true,
          sendOverdueReminder: true,
          overdueReminderDays: 7,
          sendPaymentConfirmation: true,
          sendInvoicePdf: true,
          notifyManager: false,
          businessStartHour: 9,
          businessEndHour: 18,
          skipWeekends: false,
        })
        .returning();

      settings = newSettings;
    }

    // Also get company details for context
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, currentUser.companyId))
      .limit(1);

    return { settings, company };
  } catch (error) {
    console.error("getNotificationSettings error:", error);
    return { error: error?.message || "Failed to fetch notification settings" };
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(formData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const payload = {
      sendBillSubmission: formData.sendBillSubmission ?? true,
      reminderBeforeDue: formData.reminderBeforeDue ?? true,
      reminderDaysBefore: Number(formData.reminderDaysBefore ?? 2),
      sendDueTodayNotification: formData.sendDueTodayNotification ?? true,
      sendOverdueReminder: formData.sendOverdueReminder ?? true,
      overdueReminderDays: Number(formData.overdueReminderDays ?? 7),
      sendPaymentConfirmation: formData.sendPaymentConfirmation ?? true,
      autoSendSuspensionNotice: formData.autoSendSuspensionNotice ?? false,
      sendInternalSuspensionAlert: formData.sendInternalSuspensionAlert ?? true,
      sendInvoicePdf: formData.sendInvoicePdf ?? true,
      ccAccountsEmail: formData.ccAccountsEmail?.trim() || null,
      ccSalesEmail: formData.ccSalesEmail?.trim() || null,
      notifyManager: formData.notifyManager ?? false,
      businessStartHour: Number(formData.businessStartHour ?? 9),
      businessEndHour: Number(formData.businessEndHour ?? 18),
      skipWeekends: formData.skipWeekends ?? false,
      updatedAt: new Date(),
    };

    // Check if exists
    const [existing] = await db
      .select({ id: notificationSettings.id })
      .from(notificationSettings)
      .where(eq(notificationSettings.companyId, currentUser.companyId))
      .limit(1);

    if (existing) {
      await db
        .update(notificationSettings)
        .set(payload)
        .where(eq(notificationSettings.companyId, currentUser.companyId));
    } else {
      await db.insert(notificationSettings).values({
        companyId: currentUser.companyId,
        ...payload,
      });
    }

    revalidatePath("/settings");
    revalidatePath("/settings/notifications");

    return {
      success: true,
      message:
        "Notification settings and automation controls saved successfully.",
    };
  } catch (error) {
    console.error("updateNotificationSettings error:", error);
    return {
      success: false,
      error: error?.message || "Failed to update notification settings",
    };
  }
}

/**
 * Fetch paginated Notification Logs
 */
export async function getNotificationAuditLogs({
  page = 1,
  limit = 20,
  status = "",
  search = "",
} = {}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { error: "Unauthorized" };
    }

    const offset = (page - 1) * limit;
    const conditions = [eq(notificationLogs.companyId, currentUser.companyId)];

    if (status && status !== "ALL") {
      conditions.push(eq(notificationLogs.status, status));
    }

    if (search) {
      conditions.push(ilike(notificationLogs.recipient, `%${search}%`));
    }

    const logs = await db
      .select({
        id: notificationLogs.id,
        channel: notificationLogs.channel,
        recipient: notificationLogs.recipient,
        subject: notificationLogs.subject,
        status: notificationLogs.status,
        errorMessage: notificationLogs.errorMessage,
        sentAt: notificationLogs.sentAt,
        createdAt: notificationLogs.createdAt,
        clientId: notificationLogs.clientId,
        invoiceId: notificationLogs.invoiceId,
        clientName: clients.companyName,
        invoiceNumber: invoices.invoiceNumber,
      })
      .from(notificationLogs)
      .leftJoin(clients, eq(notificationLogs.clientId, clients.id))
      .leftJoin(invoices, eq(notificationLogs.invoiceId, invoices.id))
      .where(and(...conditions))
      .orderBy(desc(notificationLogs.sentAt), desc(notificationLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalCountResult] = await db
      .select({ count: count() })
      .from(notificationLogs)
      .where(and(...conditions));

    const total = totalCountResult?.count || 0;

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    console.error("getNotificationAuditLogs error:", error);
    return { error: error?.message || "Failed to fetch notification logs" };
  }
}

/**
 * Trigger manual scheduler execution
 */
export async function triggerManualSchedulerRun() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await runNotificationScheduler();

    revalidatePath("/settings");
    revalidatePath("/invoices");

    return {
      success: true,
      result,
      message: `Automation executed. Invoices evaluated: ${result?.totals?.total || 0}, Processed: ${result?.totals?.processed || 0}`,
    };
  } catch (error) {
    console.error("triggerManualSchedulerRun error:", error);
    return {
      success: false,
      error: error?.message || "Automation execution encountered an error",
    };
  }
}

/**
 * Test send email to check mailer configuration
 */
export async function testNotificationEmail(targetEmail) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!targetEmail || !targetEmail.includes("@")) {
      return { success: false, error: "Invalid email address" };
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, currentUser.companyId))
      .limit(1);

    const companyName = company?.companyName || "PAFEX Logistics";

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; background: #ffffff;">
        <h2 style="color: #2563eb; margin-top: 0;">Notification System Test</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">
          This is a test notification from <strong>${companyName}</strong>. 
          Your email dispatcher and notification automation settings are configured properly.
        </p>
        <div style="margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 6px; font-size: 12px; color: #64748b;">
          <div><strong>Sender Company:</strong> ${companyName}</div>
          <div><strong>Timestamp:</strong> ${new Date().toLocaleString("en-IN")}</div>
          <div><strong>Status:</strong> Active</div>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">
          PAFEX Automated Notification Engine
        </p>
      </div>
    `;

    await sendEmail({
      to: targetEmail,
      subject: `[Test] Notification Configuration Verified - ${companyName}`,
      html,
    });

    await db.insert(notificationLogs).values({
      companyId: currentUser.companyId,
      channel: "EMAIL",
      recipient: targetEmail,
      subject: `[Test] Notification Configuration Verified - ${companyName}`,
      status: "DELIVERED",
      sentAt: new Date(),
    });

    return {
      success: true,
      message: `Test email successfully dispatched to ${targetEmail}`,
    };
  } catch (error) {
    console.error("testNotificationEmail error:", error);
    return {
      success: false,
      error: error?.message || "Failed to dispatch test email",
    };
  }
}

/**
 * Get escalation tier rules and available company roles & departments
 */
export async function getEscalationTierRules() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return {
        error: "Unauthorized",
        rules: [],
        rolesList: [],
        departmentsList: [],
      };
    }

    await ensureDefaultDepartments(currentUser.companyId);
    const rules = await ensureDefaultEscalationRules(currentUser.companyId);

    const rolesList = await db
      .select({
        id: roles.id,
        roleName: roles.roleName,
      })
      .from(roles)
      .where(
        and(
          eq(roles.companyId, currentUser.companyId),
          isNull(roles.deletedAt),
        ),
      );

    const departmentsList = await db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
      })
      .from(departments)
      .where(
        and(
          eq(departments.companyId, currentUser.companyId),
          eq(departments.isActive, true),
          isNull(departments.deletedAt),
        ),
      )
      .orderBy(asc(departments.name));

    return { rules, rolesList, departmentsList };
  } catch (error) {
    console.error("getEscalationTierRules error:", error);
    return {
      error: error?.message,
      rules: [],
      rolesList: [],
      departmentsList: [],
    };
  }
}

/**
 * Save / Update escalation tier rules
 */
export async function saveEscalationTierRules(rulesPayload) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    for (const r of rulesPayload) {
      const tierLevel = Number(r.tierLevel);
      const daysAfterDue = Number(r.daysAfterDue);
      const targetRoleId = r.targetRoleId ? Number(r.targetRoleId) : null;
      const targetDepartmentId = r.targetDepartmentId
        ? Number(r.targetDepartmentId)
        : null;
      const notifyAccountManager = Boolean(r.notifyAccountManager);
      const customEmail = r.customEmail?.trim() || null;
      const description = r.description?.trim() || null;
      const isActive = r.isActive !== false;

      if (r.id) {
        await db
          .update(notificationEscalationRules)
          .set({
            tierLevel,
            daysAfterDue,
            targetRoleId,
            targetDepartmentId,
            notifyAccountManager,
            customEmail,
            description,
            isActive,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notificationEscalationRules.id, Number(r.id)),
              eq(notificationEscalationRules.companyId, currentUser.companyId),
            ),
          );
      } else {
        await db.insert(notificationEscalationRules).values({
          companyId: currentUser.companyId,
          tierLevel,
          daysAfterDue,
          targetRoleId,
          targetDepartmentId,
          notifyAccountManager,
          customEmail,
          description,
          isActive,
        });
      }
    }

    revalidatePath("/settings");

    return {
      success: true,
      message: "Hierarchical escalation tiers saved successfully.",
    };
  } catch (error) {
    console.error("saveEscalationTierRules error:", error);
    return {
      success: false,
      error: error?.message || "Failed to save escalation rules",
    };
  }
}

/**
 * Trigger manual escalation run for current company
 */
export async function triggerManualEscalationRun() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const summary = await evaluateAndRunEscalations(currentUser.companyId);

    revalidatePath("/settings");
    revalidatePath("/invoices");

    return {
      success: true,
      summary,
      message: `Escalation run completed. Overdue Invoices: ${summary.totalOverdueInvoices}, Escalated: ${summary.escalated}, Resolved: ${summary.resolvedPaid}`,
    };
  } catch (error) {
    console.error("triggerManualEscalationRun error:", error);
    return {
      success: false,
      error: error?.message || "Escalation evaluation failed",
    };
  }
}

/**
 * Preview Payment Received Email HTML
 */
export async function previewPaymentReceivedEmailAction(clientId = null) {
  try {
    const currentUser = await getCurrentUser();
    const activeCompanyId = currentUser?.companyId || null;

    let client = null;
    let clientInvoices = [];

    if (clientId) {
      client = await db.query.clients.findFirst({
        where: eq(clients.id, Number(clientId)),
      });
    }

    if (!client && activeCompanyId) {
      client = await db.query.clients.findFirst({
        where: eq(clients.companyId, activeCompanyId),
      });
    }

    if (!client) {
      client = await db.query.clients.findFirst();
    }

    const clientName = client?.companyName || "Sample Client Logistics Pvt Ltd";
    const activeClientId = client?.id || 1;

    if (client) {
      clientInvoices = await db.query.invoices.findMany({
        where: eq(invoices.clientId, activeClientId),
        limit: 3,
      });
    }

    const settledInvoices =
      clientInvoices.length > 0
        ? clientInvoices.map((inv, idx) => {
            const invAmt = Number(
              inv.netPayableAmount || inv.invoiceAmount || 45000,
            );
            const settledAmt = idx === 0 ? invAmt : Math.round(invAmt / 2);
            return {
              invoiceId: inv.id,
              invoiceNumber: inv.invoiceNumber,
              invoiceDate: inv.invoiceDate || new Date().toISOString(),
              invoiceAmount: invAmt,
              settledAmount: settledAmt,
              remainingBalance: Math.max(0, invAmt - settledAmt),
            };
          })
        : [
            {
              invoiceId: 101,
              invoiceNumber: "PAF-D/24-25/584",
              invoiceDate: "2024-08-15",
              invoiceAmount: 50000,
              settledAmount: 50000,
              remainingBalance: 0,
            },
            {
              invoiceId: 102,
              invoiceNumber: "PAF-D/24-25/612",
              invoiceDate: "2024-08-20",
              invoiceAmount: 75000,
              settledAmount: 25000,
              remainingBalance: 50000,
            },
          ];

    const totalSettled = settledInvoices.reduce(
      (sum, i) => sum + i.settledAmount,
      0,
    );

    const [company] = activeCompanyId
      ? await db
          .select()
          .from(companies)
          .where(eq(companies.id, activeCompanyId))
          .limit(1)
      : [null];

    const payload = {
      clientId: activeClientId,
      companyId: activeCompanyId,
      email: "client@example.com",
      clientName,
      paymentAmount: totalSettled,
      paymentDate: new Date().toISOString(),
      paymentMethod: "NEFT / Bank Transfer",
      referenceNumber: "UTR98320481239X",
      settledInvoices,
      totalAccountOutstanding: 50000,
      senderCompany: company?.companyName || "PAFEX Express & Logistics",
      senderEmail: company?.email || "accounts@pafex.com",
      senderPhone: company?.phone || "+91 98765 43210",
      senderLogo: company?.logo || "",
      company: company || {},
    };

    const { renderEmail } = await import("@/lib/notifications/email-renderer");
    const { NOTIFICATION_TYPES, TEMPLATE_TYPES } =
      await import("@/lib/notifications/notification-types");
    const { renderTemplate } =
      await import("@/lib/notifications/notification-template");

    const templateResult = await renderTemplate(
      activeCompanyId,
      TEMPLATE_TYPES.PAYMENT_RECEIVED,
      payload,
    );

    const html = renderEmail({
      type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      body: templateResult.body,
      variables: payload,
      actionUrl: `/clients/${activeClientId}`,
    });

    return {
      success: true,
      html,
      subject: templateResult.subject || "Payment Received - PAFEX",
      payload,
    };
  } catch (error) {
    console.error("previewPaymentReceivedEmailAction error:", error);
    return {
      success: false,
      error: error?.message || "Failed to render preview",
    };
  }
}

/**
 * Send Test Payment Received Email
 */
export async function sendTestPaymentReceivedEmailAction(
  targetEmail,
  clientId = null,
) {
  try {
    if (!targetEmail || !targetEmail.includes("@")) {
      return { success: false, error: "Valid email address required" };
    }

    const previewRes = await previewPaymentReceivedEmailAction(clientId);
    if (!previewRes.success) {
      return { success: false, error: previewRes.error };
    }

    const payload = {
      ...previewRes.payload,
      email: targetEmail,
    };

    const { notifyClientPaymentReceived } =
      await import("@/lib/notifications/notification-services");

    const res = await notifyClientPaymentReceived(payload);

    return {
      success: true,
      message: `Test Payment Received email sent to ${targetEmail}`,
      details: res,
    };
  } catch (error) {
    console.error("sendTestPaymentReceivedEmailAction error:", error);
    return {
      success: false,
      error: error?.message || "Failed to send test email",
    };
  }
}
