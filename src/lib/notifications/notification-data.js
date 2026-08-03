"use server";

import { db } from "@/db";

import {
  invoices,
  clients,
  companies,
  clientContacts,
  clientContactEmails,
} from "@/db/schema";

import { and, eq, isNull } from "drizzle-orm";
import { calculateInvoiceStatus } from "@/lib/invoice-status";

export async function getInvoiceNotificationData(invoiceId) {
  // =====================================
  // LOAD INVOICE + CLIENT + COMPANY
  // =====================================

  const result = await db
    .select({
      // Sender company
      companyId: companies.id,
      senderCompany: companies.companyName,
      senderEmail: companies.email,
      senderPhone: companies.phone,
      senderLogo: companies.logo,

      // Client
      clientId: clients.id,
      clientName: clients.companyName,

      // Invoice
      invoiceId: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      invoiceAmount: invoices.invoiceAmount,
      netPayableAmount: invoices.netPayableAmount,
      status: invoices.status,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .innerJoin(companies, eq(companies.id, invoices.companyId))
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!result.length) {
    return null;
  }

  const invoice = result[0];

  // Payment Summary
  const paymentSummary = calculateInvoiceStatus({
    netPayable: invoice.netPayableAmount,
    paid: 0,
    dueDate: invoice.dueDate,
  });

  // =====================================
  // FIND CONTACT
  // =====================================

  const contacts = await db
    .select({
      contactId: clientContacts.id,
      userId: clientContacts.id, // placeholder until notification users are finalized
    })
    .from(clientContacts)
    .where(
      and(
        eq(clientContacts.clientId, invoice.clientId),
        eq(clientContacts.receivesInvoice, true),
        eq(clientContacts.status, "active"),
        isNull(clientContacts.deletedAt),
      ),
    )
    .limit(1);

  if (!contacts.length) {
    return null;
  }

  const contact = contacts[0];

  // =====================================
  // FIND EMAIL
  // =====================================

  const emails = await db
    .select({
      email: clientContactEmails.email,
    })
    .from(clientContactEmails)
    .where(
      and(
        eq(clientContactEmails.contactId, contact.contactId),
        eq(clientContactEmails.isPrimary, true),
        eq(clientContactEmails.isActive, true),
        isNull(clientContactEmails.deletedAt),
      ),
    )
    .limit(1);

  if (!emails.length) {
    return null;
  }

  // =====================================
  // RETURN DATA
  // =====================================
  return {
    companyId: invoice.companyId,

    clientId: invoice.clientId,
    invoiceId: invoice.invoiceId,

    paymentId: null,

    // Recipient
    email: emails[0].email,

    // Client
    clientName: invoice.clientName,

    // Invoice
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,

    invoiceAmount: Number(invoice.invoiceAmount),
    netPayableAmount: Number(invoice.netPayableAmount),

    status: invoice.status,

    // Invoice payment summary
    paid: paymentSummary.paid,
    due: paymentSummary.due,
    dueDays: paymentSummary.dueDays,

    // Sender company
    senderCompany: invoice.senderCompany,
    senderEmail: invoice.senderEmail,
    senderPhone: invoice.senderPhone,
    senderLogo: invoice.senderLogo,
  };
}
