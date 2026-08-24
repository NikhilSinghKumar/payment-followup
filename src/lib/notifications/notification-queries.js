import { db } from "@/db";

import {
  invoices,
  clients,
  companies,
  paymentAllocations,
  clientContacts,
  clientContactEmails,
} from "@/db/schema";

import { and, eq, isNull, sql } from "drizzle-orm";

import { enrichInvoices } from "@/lib/invoice-summary";

// ======================================================
// PRIVATE
// Load invoices with payment summary
// ======================================================

async function getNotificationCandidates() {
  const data = await db
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
      email: clientContactEmails.email,

      // Sender
      senderCompany: companies.companyName,
      senderEmail: companies.email,
      senderPhone: companies.phone,
      // senderWebsite: companies.website,
      senderLogo: companies.logo,

      paid: sql`
        COALESCE(
          SUM(${paymentAllocations.allocatedAmount}),
          0
        )
      `,
    })
    .from(invoices)
    .leftJoin(clients, eq(clients.id, invoices.clientId))

    .leftJoin(
      clientContacts,
      and(
        eq(clientContacts.clientId, clients.id),
        isNull(clientContacts.deletedAt),
        eq(clientContacts.isPrimary, true), // optional but recommended
      ),
    )
    .leftJoin(
      clientContactEmails,
      and(
        eq(clientContactEmails.contactId, clientContacts.id),
        isNull(clientContactEmails.deletedAt),
        eq(clientContactEmails.isPrimary, true), // optional
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
        eq(clients.companyCode, "AMAZON"),
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
      companies.companyName,
      companies.email,
      companies.phone,
      // companies.website,
      companies.logo,
    );

  return enrichInvoices(data);
}

// ======================================================
// Due Reminder
// (7 days before due date)
// ======================================================

export async function getDueReminderInvoices() {
  const invoices = await getNotificationCandidates();

  return invoices.filter((invoice) => invoice.isDueSoon && !invoice.isPaid);
}

// ======================================================
// Due Today
// ======================================================

export async function getDueTodayInvoices() {
  const invoices = await getNotificationCandidates();

  return invoices.filter((invoice) => invoice.isDueToday && !invoice.isPaid);
}

// ======================================================
// Overdue Reminder
// Day 1 -> Day 9
// ======================================================

export async function getOverdueReminderInvoices() {
  const invoices = await getNotificationCandidates();

  return invoices.filter(
    (invoice) =>
      invoice.isOverdue && !invoice.shouldBlockClient && !invoice.isPaid,
  );
}

// ======================================================
// Service Suspension
// Day 10 onwards
// ======================================================

export async function getServiceSuspensionInvoices() {
  const invoices = await getNotificationCandidates();

  return invoices.filter(
    (invoice) => invoice.shouldBlockClient && !invoice.isPaid,
  );
}

export async function getServiceSuspensionClients() {
  const invoices = await getNotificationCandidates();

  const qualifyingInvoices = invoices.filter(
    (invoice) => invoice.shouldBlockClient && !invoice.isPaid,
  );

  const clientsMap = new Map();

  for (const invoice of qualifyingInvoices) {
    if (!clientsMap.has(invoice.clientId)) {
      clientsMap.set(invoice.clientId, {
        ...invoice,

        // Client-level notification
        invoiceId: null,
      });
    }
  }

  return Array.from(clientsMap.values());
}
