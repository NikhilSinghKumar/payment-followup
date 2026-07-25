import {
  getDueReminderInvoices,
  getDueTodayInvoices,
  getOverdueReminderInvoices,
  getServiceSuspensionInvoices,
} from "./notification-queries";

import {
  dueReminder,
  dueToday,
  overdueReminder,
  serviceSuspensionNotice,
  serviceSuspensionAlert,
} from "./notification-services";

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
  const invoices = await getServiceSuspensionInvoices();

  return processInvoices(
    invoices,
    async (invoice) => {
      // Client Email
      await serviceSuspensionNotice(invoice);

      // Internal Notification
      await serviceSuspensionAlert(invoice);
    },
    "Service Suspension",
  );
}

// ======================================================
// Run Notification Scheduler
// ======================================================

export async function runNotificationScheduler() {
  const startedAt = Date.now();

  const summary = {
    dueReminder: await processDueReminders(),

    dueToday: await processDueToday(),

    overdueReminder: await processOverdueReminders(),

    serviceSuspension: await processServiceSuspension(),
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
