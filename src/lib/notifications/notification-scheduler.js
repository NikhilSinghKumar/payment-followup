import {
  clientPaymentReminder,
  dueToday,
  serviceSuspensionNotice,
  serviceSuspensionAlert,
} from "./notification-services";

import { getClientPaymentReminderData } from "./notification-data";

import {
  getDueTodayInvoices,
  getServiceSuspensionClients,
} from "./notification-queries";

import { evaluateAndRunEscalations } from "./escalation-service";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { isNull } from "drizzle-orm";

async function processClientPaymentReminders() {
  const clients = await getClientPaymentReminderData();

  // console.log(
  //   "[REMINDER TEST] getClientPaymentReminderData returned:",
  //   clients.length,
  // );

  const testClients = clients.filter(
    (client) => Number(client.clientId) === 488,
  );

  // console.log(
  //   "[REMINDER TEST] AFTER FILTER:",
  //   testClients.map((client) => ({
  //     clientId: client.clientId,
  //     clientName: client.clientName,
  //     email: client.email,
  //   })),
  // );

  let processed = 0;
  let failed = 0;

  // chnage testClients to clients to send
  for (const client of testClients) {
    try {
      console.log("[REMINDER TEST] SENDING TO:", client.clientId, client.email);

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

  console.log("[REMINDER TEST] RESULT:", {
    processed,
    failed,
    total: testClients.length,
  });

  return {
    processed,
    failed,
    total: testClients.length,
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
// Due Reminder
// ======================================================

async function processDueReminders() {
  const invoices = await getDueReminderInvoices();

  return processInvoices(invoices, dueReminder, "Due Reminder");
}

// ======================================================
// Due Today
// ======================================================

async function processDueToday() {
  const invoices = await getDueTodayInvoices();

  return processInvoices(invoices, dueToday, "Due Today");
}

// ======================================================
// Overdue Reminder
// ======================================================

async function processOverdueReminders() {
  const invoices = await getOverdueReminderInvoices();

  return processInvoices(invoices, overdueReminder, "Overdue Reminder");
}

// ======================================================
// Service Suspension
// ======================================================

async function processServiceSuspension() {
  const clients = await getServiceSuspensionClients();

  return processInvoices(
    clients,
    async (client) => {
      // Client Email
      await serviceSuspensionNotice(client);

      // Internal Notification
      await serviceSuspensionAlert(client);
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

    dueToday: await processDueToday(),

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
