import {
  clientPaymentReminder,
  serviceSuspensionNotice,
  serviceSuspensionAlert,
} from "./notification-services";

import { getClientPaymentReminderData } from "./notification-data";

import { getServiceSuspensionClients } from "./notification-queries";

import { evaluateAndRunEscalations } from "./escalation-service";
import { db } from "@/db";
import { companies, notificationSettings } from "@/db/schema";
import { isNull } from "drizzle-orm";

async function processClientPaymentReminders() {
  const clients = await getClientPaymentReminderData();

  let processed = 0;
  let failed = 0;

  for (const client of clients) {
    try {
      await clientPaymentReminder(client);
      processed++;
    } catch (error) {
      console.error(
        `[Notification Scheduler] Client Payment Reminder failed for Client #${client.clientId}`,
        error,
      );
      failed++;
    }
  }

  return {
    processed,
    failed,
    total: clients.length,
  };
}

// ======================================================
// Process Invoice Notifications
// ======================================================

async function processInvoices(invoices, handler, label) {
  let processed = 0;
  let failed = 0;

  for (const invoice of invoices) {
    try {
      await handler(invoice);
      processed++;
    } catch (error) {
      console.error({
        type: label,
        invoiceId: invoice.id,
        message: error.message,
        stack: error.stack,
      });
      failed++;

      console.error(
        `[Notification Scheduler] ${label} failed for Invoice #${invoice.id}`,
        error,
      );
    }
  }

  return {
    processed,
    failed,
    total: invoices.length,
  };
}

// ======================================================
// Service Suspension
// ======================================================

async function processServiceSuspension() {
  const clients = await getServiceSuspensionClients();
  if (!clients.length) {
    return { processed: 0, failed: 0, total: 0 };
  }

  // Check notification settings for company
  const [settings] = await db
    .select({
      autoSendSuspensionNotice: notificationSettings.autoSendSuspensionNotice,
      sendInternalSuspensionAlert:
        notificationSettings.sendInternalSuspensionAlert,
    })
    .from(notificationSettings)
    .limit(1);

  const autoSendNoticeToClients = Boolean(settings?.autoSendSuspensionNotice);
  const sendInternalAlert = settings
    ? Boolean(settings.sendInternalSuspensionAlert)
    : true;

  return processInvoices(
    clients,
    async (client) => {
      // 1. Send Internal Alert / Audit copy to team
      if (sendInternalAlert) {
        await serviceSuspensionAlert(client);
      }

      // 2. Only auto-send to client if enabled in settings
      if (autoSendNoticeToClients) {
        await serviceSuspensionNotice(client);
      }
    },
    "Service Suspension",
  );
}

// ======================================================
// Run Notification Scheduler
// ======================================================

export async function runNotificationScheduler() {
  const startedAt = Date.now();

  const activeCompanies = await db
    .select({ id: companies.id })
    .from(companies)
    .where(isNull(companies.deletedAt));

  let escalationProcessed = 0;
  let escalationTotal = 0;
  let escalationFailed = 0;

  for (const comp of activeCompanies) {
    try {
      const escRes = await evaluateAndRunEscalations(comp.id);
      escalationTotal += escRes.totalOverdueInvoices || 0;
      escalationProcessed += escRes.escalated || 0;
      escalationFailed += escRes.errors?.length || 0;
    } catch (e) {
      console.error(`Escalation run failed for company ${comp.id}:`, e);
      escalationFailed++;
    }
  }

  const summary = {
    clientPaymentReminder: await processClientPaymentReminders(),

    serviceSuspension: await processServiceSuspension(),

    hierarchicalEscalations: {
      total: escalationTotal,
      processed: escalationProcessed,
      failed: escalationFailed,
    },
  };

  const duration = Date.now() - startedAt;

  const totals = Object.values(summary).reduce(
    (acc, current) => {
      acc.total += current.total;
      acc.processed += current.processed;
      acc.failed += current.failed;

      return acc;
    },
    {
      total: 0,
      processed: 0,
      failed: 0,
    },
  );

  console.table({
    "Invoices Checked": totals.total,
    Processed: totals.processed,
    Failed: totals.failed,
    "Duration (ms)": duration,
  });

  return {
    success: true,
    startedAt: new Date(startedAt).toISOString(),
    completedAt: new Date().toISOString(),
    duration,

    summary,

    totals,
  };
}
