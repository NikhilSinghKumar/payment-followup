"use server";

import { db } from "@/db";
import {
  invoices,
  clients,
  companies,
  clientContacts,
  clientContactEmails,
  paymentAllocations,
  notificationLogs,
  notificationSettings,
} from "@/db/schema";
import { and, eq, inArray, isNull, sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";
import { enrichInvoices } from "@/lib/invoice-summary";
import { sendEmail } from "@/lib/email";
import {
  serviceSuspensionNotice,
  serviceSuspensionAlert,
} from "@/lib/notifications/notification-services";
import { renderInternalSuspensionSummaryEmail } from "@/lib/notifications/internal-summary-renderer";
import { revalidatePath } from "next/cache";

/**
 * Fetch all clients who currently have invoices exceeding the suspension threshold (>= 10 days overdue).
 */
export async function getSuspensionDefaulters() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { error: "Unauthorized", defaulters: [] };
    }

    // 1. Query all unpaid active invoices for this company
    const rawInvoices = await db
      .select({
        id: invoices.id,
        invoiceId: invoices.id,
        companyId: invoices.companyId,
        clientId: invoices.clientId,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        invoiceAmount: invoices.invoiceAmount,
        netPayableAmount: invoices.netPayableAmount,
        status: invoices.status,
        clientName: clients.companyName,
        companyCode: clients.companyCode,
        clientEmail: clientContactEmails.email,
        contactName: clientContacts.name,
        contactDesignation: clientContacts.designation,
        senderCompany: companies.companyName,
        senderEmail: companies.email,
        senderPhone: companies.phone,
        senderLogo: companies.logo,
        paid: sql`COALESCE(SUM(${paymentAllocations.allocatedAmount}), 0)`,
      })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .leftJoin(
        clientContacts,
        and(
          eq(clientContacts.clientId, clients.id),
          isNull(clientContacts.deletedAt),
          eq(clientContacts.isPrimary, true),
        ),
      )
      .leftJoin(
        clientContactEmails,
        and(
          eq(clientContactEmails.contactId, clientContacts.id),
          isNull(clientContactEmails.deletedAt),
          eq(clientContactEmails.isPrimary, true),
        ),
      )
      .leftJoin(companies, eq(companies.id, invoices.companyId))
      .leftJoin(
        paymentAllocations,
        and(
          eq(paymentAllocations.invoiceId, invoices.id),
          isNull(paymentAllocations.deletedAt),
        ),
      )
      .where(
        and(
          isNull(invoices.deletedAt),
          isNull(clients.deletedAt),
          eq(invoices.companyId, currentUser.companyId),
        ),
      )
      .groupBy(
        invoices.id,
        invoices.companyId,
        invoices.clientId,
        invoices.invoiceNumber,
        invoices.invoiceDate,
        invoices.dueDate,
        invoices.invoiceAmount,
        invoices.netPayableAmount,
        invoices.status,
        clients.companyName,
        clients.companyCode,
        clientContactEmails.email,
        clientContacts.name,
        clientContacts.designation,
        companies.companyName,
        companies.email,
        companies.phone,
        companies.logo,
      );

    // 2. Enrich invoices with aging calculations
    const enriched = enrichInvoices(rawInvoices);

    // 3. Filter for suspension candidates (shouldBlockClient = true, unpaid)
    const qualifyingInvoices = enriched.filter(
      (inv) => inv.shouldBlockClient && !inv.isPaid,
    );

    // 4. Group by Client
    const clientsMap = new Map();

    for (const inv of qualifyingInvoices) {
      if (!clientsMap.has(inv.clientId)) {
        clientsMap.set(inv.clientId, {
          clientId: inv.clientId,
          clientName: inv.clientName,
          companyCode: inv.companyCode,
          email: inv.clientEmail,
          contactName: inv.contactName?.trim() || "Primary Contact",
          contactDesignation: inv.contactDesignation,
          senderCompany: inv.senderCompany,
          senderEmail: inv.senderEmail,
          senderPhone: inv.senderPhone,
          senderLogo: inv.senderLogo,
          totalOverdue: 0,
          overdueInvoiceCount: 0,
          maxOverdueDays: 0,
          oldestDueDate: inv.dueDate,
          invoices: [],
        });
      }

      const clientEntry = clientsMap.get(inv.clientId);
      const invoiceDue = Number(inv.due || inv.netPayableAmount || 0);

      clientEntry.totalOverdue += invoiceDue;
      clientEntry.overdueInvoiceCount += 1;
      clientEntry.maxOverdueDays = Math.max(
        clientEntry.maxOverdueDays,
        inv.dueDays || 0,
      );

      if (
        new Date(inv.dueDate).getTime() <
        new Date(clientEntry.oldestDueDate).getTime()
      ) {
        clientEntry.oldestDueDate = inv.dueDate;
      }

      clientEntry.invoices.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        dueDays: inv.dueDays,
        due: invoiceDue,
      });
    }

    const defaulters = Array.from(clientsMap.values()).sort(
      (a, b) => b.totalOverdue - a.totalOverdue,
    );

    // 5. Check last suspension notification timestamps from notification_logs
    if (defaulters.length > 0) {
      const clientIds = defaulters.map((d) => d.clientId);
      const recentLogs = await db
        .select({
          clientId: notificationLogs.clientId,
          sentAt: notificationLogs.sentAt,
          status: notificationLogs.status,
        })
        .from(notificationLogs)
        .where(
          and(
            inArray(notificationLogs.clientId, clientIds),
            eq(notificationLogs.companyId, currentUser.companyId),
          ),
        )
        .orderBy(desc(notificationLogs.sentAt));

      const logsByClient = new Map();
      for (const log of recentLogs) {
        if (!logsByClient.has(log.clientId)) {
          logsByClient.set(log.clientId, log);
        }
      }

      for (const d of defaulters) {
        const lastLog = logsByClient.get(d.clientId);
        d.lastNotifiedAt = lastLog?.sentAt || null;
        d.lastDeliveryStatus = lastLog?.status || null;
      }
    }

    // 6. Get current suspension settings
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.companyId, currentUser.companyId))
      .limit(1);

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, currentUser.companyId))
      .limit(1);

    return {
      defaulters,
      settings: settings || {},
      company: company || {},
      totalDefaulters: defaulters.length,
      totalOverdueAmount: defaulters.reduce(
        (acc, curr) => acc + curr.totalOverdue,
        0,
      ),
    };
  } catch (error) {
    console.error("getSuspensionDefaulters error:", error);
    return {
      error: error?.message || "Failed to load suspension defaulters",
      defaulters: [],
    };
  }
}

/**
 * Send official Suspension Notification emails to Selected Clients
 */
export async function sendSuspensionNoticeToSelected(
  clientIds = [],
  customNote = "",
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!clientIds.length) {
      return {
        success: false,
        error: "Please select at least one client to send suspension notices.",
      };
    }

    const { defaulters } = await getSuspensionDefaulters();
    const targetClients = defaulters.filter((d) =>
      clientIds.map(Number).includes(Number(d.clientId)),
    );

    if (!targetClients.length) {
      return {
        success: false,
        error: "No matching client records found for selected IDs.",
      };
    }

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const client of targetClients) {
      try {
        if (!client.email) {
          throw new Error(
            `Client ${client.clientName} does not have a primary billing email configured.`,
          );
        }

        const payload = {
          ...client,
          customNote,
        };

        // 1. Send notice to the client
        await serviceSuspensionNotice(payload);

        // 2. Send internal individual audit alert
        await serviceSuspensionAlert(payload);

        successCount++;
      } catch (err) {
        console.error(
          `Failed to send suspension notice to client ${client.clientId}:`,
          err,
        );
        failCount++;
        errors.push(`${client.clientName}: ${err.message}`);
      }
    }

    revalidatePath("/settings");
    revalidatePath("/reminders");
    revalidatePath("/invoices");

    return {
      success: true,
      successCount,
      failCount,
      message: `Suspension notice sent to ${successCount} client(s).${failCount > 0 ? ` (${failCount} failed: ${errors.join(", ")})` : ""}`,
    };
  } catch (error) {
    console.error("sendSuspensionNoticeToSelected error:", error);
    return {
      success: false,
      error: error?.message || "Failed to send suspension notices.",
    };
  }
}

/**
 * Send Consolidated Defaulters Report / Summary to Internal Team Email(s)
 */
export async function sendInternalDefaultersSummaryEmail({
  recipientEmails = [],
  clientIds = null, // null = all defaulters, or array of specific clientIds
  customNote = "",
} = {}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const { defaulters, company, settings } = await getSuspensionDefaulters();

    let targetClients = defaulters;
    if (clientIds && Array.isArray(clientIds) && clientIds.length > 0) {
      targetClients = defaulters.filter((d) =>
        clientIds.map(Number).includes(Number(d.clientId)),
      );
    }

    if (!targetClients.length) {
      return {
        success: false,
        error: "No defaulter clients to include in summary report.",
      };
    }

    // Determine target recipient emails (input > company cc > current user)
    let finalRecipients = recipientEmails.filter(Boolean);
    if (!finalRecipients.length) {
      const fallbackList = [
        settings?.ccAccountsEmail,
        settings?.ccSalesEmail,
        company?.email,
        currentUser?.user?.email,
      ].filter(Boolean);

      finalRecipients = Array.from(new Set(fallbackList));
    }

    if (!finalRecipients.length) {
      return {
        success: false,
        error:
          "No recipient email address specified. Please provide an email or configure Accounts Team CC in settings.",
      };
    }

    const html = renderInternalSuspensionSummaryEmail({
      clients: targetClients,
      company: company || {},
      summaryTitle: `Service Suspension Defaulters Report (${targetClients.length} Clients)`,
      customNote,
    });

    const subject = `⚠️ [INTERNAL ACTION] Service Suspension Defaulters List - ${targetClients.length} Clients (${company.companyName || "PAFEX"})`;

    const sendResults = await Promise.all(
      finalRecipients.map(async (email) => {
        try {
          await sendEmail({
            to: email,
            subject,
            html,
          });

          await db.insert(notificationLogs).values({
            companyId: currentUser.companyId,
            channel: "EMAIL",
            recipient: email,
            subject,
            status: "DELIVERED",
            sentAt: new Date(),
          });

          return { email, success: true };
        } catch (err) {
          console.error(`Failed to send internal summary to ${email}:`, err);
          return { email, success: false, error: err.message };
        }
      }),
    );

    const anySuccess = sendResults.some((r) => r.success);
    revalidatePath("/settings");

    return {
      success: anySuccess,
      message: `Internal summary report dispatched to ${finalRecipients.join(", ")}`,
    };
  } catch (error) {
    console.error("sendInternalDefaultersSummaryEmail error:", error);
    return {
      success: false,
      error: error?.message || "Failed to dispatch internal summary report.",
    };
  }
}

/**
 * Generate preview HTML for the internal suspension summary email
 */
export async function getInternalSuspensionSummaryPreviewHtml({
  clientIds = null,
  customNote = "",
} = {}) {
  try {
    const { defaulters, company } = await getSuspensionDefaulters();

    let targetClients = defaulters;
    if (clientIds && Array.isArray(clientIds) && clientIds.length > 0) {
      targetClients = defaulters.filter((d) =>
        clientIds.map(Number).includes(Number(d.clientId)),
      );
    }

    const html = renderInternalSuspensionSummaryEmail({
      clients: targetClients,
      company: company || {},
      summaryTitle: `Service Suspension Defaulters Report (${targetClients.length} Clients)`,
      customNote,
    });

    const subject = `⚠️ [INTERNAL ACTION] Service Suspension Defaulters List - ${targetClients.length} Clients`;

    return { success: true, html, subject, clientCount: targetClients.length };
  } catch (err) {
    return { error: err?.message || "Failed to generate preview" };
  }
}
