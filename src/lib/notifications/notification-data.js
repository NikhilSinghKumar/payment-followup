"use server";

import { db } from "@/db";

import {
  invoices,
  clients,
  companies,
  clientContacts,
  clientContactEmails,
  payments,
  paymentAllocations,
} from "@/db/schema";

import { and, eq, isNull, sql } from "drizzle-orm";
import { calculateInvoiceStatus } from "@/lib/invoice-status";

export async function getInvoiceNotificationData(invoiceId, paymentId = null) {
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
      clientEmail: clients.email,

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

  const allocationResult = await db
    .select({
      totalPaid: sql`
      COALESCE(
        SUM(${paymentAllocations.allocatedAmount}),
        0
      )
    `,
    })
    .from(paymentAllocations)
    .where(
      and(
        eq(paymentAllocations.invoiceId, invoiceId),
        isNull(paymentAllocations.deletedAt),
      ),
    );

  const totalPaid = Number(allocationResult[0]?.totalPaid || 0);

  const paymentResult = paymentId
    ? await db
        .select({
          amount: payments.amount,
          paymentDate: payments.paymentDate,
        })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1)
    : [];

  const payment = paymentResult[0] ?? null;

  // Payment Summary
  const paymentSummary = calculateInvoiceStatus({
    netPayable: invoice.netPayableAmount,
    paid: totalPaid,
    dueDate: invoice.dueDate,
  });

  // =====================================
  // RESOLVE RECIPIENT EMAIL (Tiered)
  // =====================================

  let recipientEmail = null;
  try {
    const contactEmails = await db
      .select({
        email: clientContactEmails.email,
        isPrimary: clientContactEmails.isPrimary,
        receivesInvoice: clientContacts.receivesInvoice,
      })
      .from(clientContacts)
      .innerJoin(
        clientContactEmails,
        eq(clientContactEmails.contactId, clientContacts.id),
      )
      .where(
        and(
          eq(clientContacts.clientId, invoice.clientId),
          isNull(clientContacts.deletedAt),
          isNull(clientContactEmails.deletedAt),
          eq(clientContactEmails.isActive, true),
        ),
      );

    if (contactEmails.length > 0) {
      const invoiceContact = contactEmails.find((c) => c.receivesInvoice);
      const primaryContact = contactEmails.find((c) => c.isPrimary);
      recipientEmail =
        invoiceContact?.email ||
        primaryContact?.email ||
        contactEmails[0]?.email;
    }
  } catch (err) {
    console.warn(`[getInvoiceNotificationData - contact email]`, err.message);
  }

  if (!recipientEmail && invoice.clientEmail) {
    recipientEmail = invoice.clientEmail;
  }

  // =====================================
  // RETURN DATA
  // =====================================
  return {
    companyId: invoice.companyId,

    clientId: invoice.clientId,
    invoiceId: invoice.invoiceId,

    paymentId,

    // Recipient
    email: recipientEmail,

    // Client
    clientName: invoice.clientName,

    // Invoice
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,

    invoiceAmount: Number(invoice.invoiceAmount),
    netPayableAmount: Number(invoice.netPayableAmount),

    status: paymentSummary.status,

    // Invoice payment summary
    paid: paymentSummary.paid,
    due: paymentSummary.due,
    dueDays: paymentSummary.dueDays,
    // Payment
    paymentAmount: payment ? Number(payment.amount) : 0,
    paymentDate: payment?.paymentDate,
    totalPaid: paymentSummary.paid,
    outstandingAmount: paymentSummary.due,

    // Sender company
    senderCompany: invoice.senderCompany,
    senderEmail: invoice.senderEmail,
    senderPhone: invoice.senderPhone,
    senderLogo: invoice.senderLogo,
  };
}

export async function getClientPaymentReminderData(clientId = null) {
  // ======================================================
  // LOAD OUTSTANDING INVOICES
  // ======================================================

  const rows = await db
    .select({
      // --------------------------------------------------
      // Sender company
      // --------------------------------------------------
      companyId: companies.id,
      senderCompany: companies.companyName,
      senderEmail: companies.email,
      senderPhone: companies.phone,
      senderLogo: companies.logo,

      // --------------------------------------------------
      // Client
      // --------------------------------------------------
      clientId: clients.id,
      clientName: clients.companyName,

      // --------------------------------------------------
      // Client contact
      // --------------------------------------------------
      contactId: clientContacts.id,

      // --------------------------------------------------
      // Recipient email
      // --------------------------------------------------
      email: clientContactEmails.email,

      // --------------------------------------------------
      // Invoice
      // --------------------------------------------------
      invoiceId: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,

      invoiceAmount: invoices.invoiceAmount,
      netPayableAmount: invoices.netPayableAmount,

      // --------------------------------------------------
      // Total paid
      // --------------------------------------------------
      paidAmount: sql`
        COALESCE(
          SUM(${paymentAllocations.allocatedAmount}),
          0
        )
      `,
    })

    .from(invoices)

    // ----------------------------------------------------
    // Client
    // ----------------------------------------------------
    .innerJoin(
      clients,
      and(
        eq(clients.id, invoices.clientId),
        isNull(clients.deletedAt),
        eq(clients.isActive, true),
      ),
    )

    // ----------------------------------------------------
    // Client contact
    // ----------------------------------------------------
    .innerJoin(
      clientContacts,
      and(
        eq(clientContacts.clientId, clients.id),
        eq(clientContacts.receivesInvoice, true),
        eq(clientContacts.isPrimary, true),
        eq(clientContacts.status, "active"),
        isNull(clientContacts.deletedAt),
      ),
    )

    // ----------------------------------------------------
    // Contact email
    // ----------------------------------------------------
    .innerJoin(
      clientContactEmails,
      and(
        eq(clientContactEmails.contactId, clientContacts.id),
        eq(clientContactEmails.isPrimary, true),
        eq(clientContactEmails.isActive, true),
        isNull(clientContactEmails.deletedAt),
      ),
    )

    // ----------------------------------------------------
    // Sender company
    // ----------------------------------------------------
    .innerJoin(
      companies,
      and(
        eq(companies.id, invoices.companyId),
        eq(companies.isActive, true),
        isNull(companies.deletedAt),
      ),
    )

    // ----------------------------------------------------
    // Payment allocations
    // ----------------------------------------------------
    .leftJoin(
      paymentAllocations,
      and(
        eq(paymentAllocations.invoiceId, invoices.id),
        isNull(paymentAllocations.deletedAt),
      ),
    )

    // ----------------------------------------------------
    // Only active invoices
    // ----------------------------------------------------
    .where(
      and(
        isNull(invoices.deletedAt),
        ...(clientId ? [eq(invoices.clientId, clientId)] : []),
      ),
    )

    // ----------------------------------------------------
    // GROUP BY
    // ----------------------------------------------------
    .groupBy(
      companies.id,
      companies.companyName,
      companies.email,
      companies.phone,
      companies.logo,

      clients.id,
      clients.companyName,

      clientContacts.id,

      clientContactEmails.email,

      invoices.id,
      invoices.invoiceNumber,
      invoices.invoiceDate,
      invoices.dueDate,
      invoices.invoiceAmount,
      invoices.netPayableAmount,
    );

  // ======================================================
  // BUILD CLIENT-WISE DATA
  // ======================================================

  const clientsMap = new Map();

  for (const row of rows) {
    const paidAmount = Number(row.paidAmount || 0);
    const netPayableAmount = Number(row.netPayableAmount || 0);

    const outstandingAmount = Math.max(netPayableAmount - paidAmount, 0);

    // -----------------------------------------------
    // Ignore fully paid invoices
    // -----------------------------------------------

    if (outstandingAmount <= 0) {
      continue;
    }

    // -----------------------------------------------
    // Credit days
    // Invoice Date → Due Date
    // -----------------------------------------------

    const invoiceDate = row.invoiceDate ? new Date(row.invoiceDate) : null;

    const dueDate = row.dueDate ? new Date(row.dueDate) : null;

    let creditDays = 0;

    if (invoiceDate && dueDate) {
      creditDays = Math.max(
        Math.ceil(
          (dueDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
        0,
      );
    }

    // -----------------------------------------------
    // Aging / Status
    // -----------------------------------------------

    let agingDays = 0;
    let agingStatus = "";
    let agingColor = "#16A34A";

    if (dueDate) {
      const today = new Date();

      // Remove time portion
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      const difference = Math.ceil(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      agingDays = Math.max(difference, 0);

      if (difference < 0) {
        const daysUntilDue = Math.abs(difference);

        agingStatus =
          daysUntilDue === 1 ? "Due tomorrow" : `Due in ${daysUntilDue} days`;

        agingColor = "#16A34A";
      } else if (difference === 0) {
        agingStatus = "Due today";
        agingColor = "#D97706";
      } else {
        agingStatus =
          difference === 1 ? "1 day overdue" : `${difference} days overdue`;

        agingColor = "#DC2626";
      }
    }

    // -----------------------------------------------
    // Get/create client
    // -----------------------------------------------

    let clientData = clientsMap.get(row.clientId);

    if (!clientData) {
      clientData = {
        companyId: row.companyId,

        clientId: row.clientId,
        clientName: row.clientName,

        email: row.email,

        totalOutstanding: 0,
        invoiceCount: 0,

        invoices: [],

        senderCompany: row.senderCompany,
        senderEmail: row.senderEmail,
        senderPhone: row.senderPhone,
        senderLogo: row.senderLogo,
      };

      clientsMap.set(row.clientId, clientData);
    }

    // -----------------------------------------------
    // Add invoice
    // -----------------------------------------------

    clientData.invoices.push({
      invoiceId: row.invoiceId,

      invoiceNumber: row.invoiceNumber,
      invoiceDate: row.invoiceDate,
      dueDate: row.dueDate,

      invoiceAmount: Number(row.invoiceAmount || 0),
      paidAmount,
      outstandingAmount,

      creditDays,

      agingDays,
      agingStatus,
      agingColor,
    });

    // -----------------------------------------------
    // Client totals
    // -----------------------------------------------

    clientData.totalOutstanding += outstandingAmount;
    clientData.invoiceCount += 1;
  }

  // ======================================================
  // RETURN CLIENT ARRAY
  // ======================================================

  return Array.from(clientsMap.values());
}

/**
 * Loads client & settlement details for a payment received event (single or multiple invoices)
 */
export async function getClientPaymentReceivedData({
  clientId,
  companyId,
  paymentId = null,
  paymentDetails = {},
  settledInvoices = [], // Array of { invoiceId, settledAmount, invoiceNumber, etc. }
}) {
  // 1. Fetch Client info & primary email
  let clientQuery;
  try {
    clientQuery = await db
      .select({
        clientId: clients.id,
        clientName: clients.companyName,
        companyId: clients.companyId,
        email: clients.email,
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);
  } catch (err) {
    throw new Error(
      `[getClientPaymentReceivedData - Query 1 (client)] ${err.message}`,
    );
  }

  if (!clientQuery || !clientQuery.length) return null;
  const client = clientQuery[0];
  const activeCompanyId = companyId || client.companyId;

  // 2. Fetch Sender Company
  let companyQuery;
  try {
    companyQuery = await db
      .select({
        senderCompany: companies.companyName,
        senderEmail: companies.email,
        senderPhone: companies.phone,
        senderLogo: companies.logo,
        address: companies.address,
        city: companies.city,
        state: companies.state,
        pincode: companies.pincode,
      })
      .from(companies)
      .where(eq(companies.id, activeCompanyId))
      .limit(1);
  } catch (err) {
    throw new Error(
      `[getClientPaymentReceivedData - Query 2 (company)] ${err.message}`,
    );
  }

  const company = companyQuery[0] || {};

  // 3. Fetch Client Contact Email (Tiered resolution: receivesInvoice -> isPrimary -> any contact email -> client.email)
  let recipientEmail = null;
  try {
    const contactEmailQuery = await db
      .select({
        email: clientContactEmails.email,
        isPrimary: clientContactEmails.isPrimary,
        receivesInvoice: clientContacts.receivesInvoice,
      })
      .from(clientContacts)
      .innerJoin(
        clientContactEmails,
        eq(clientContactEmails.contactId, clientContacts.id),
      )
      .where(
        and(
          eq(clientContacts.clientId, clientId),
          isNull(clientContacts.deletedAt),
          isNull(clientContactEmails.deletedAt),
          eq(clientContactEmails.isActive, true),
        ),
      );

    if (contactEmailQuery.length > 0) {
      const invoiceContact = contactEmailQuery.find((c) => c.receivesInvoice);
      const primaryContact = contactEmailQuery.find((c) => c.isPrimary);
      recipientEmail =
        invoiceContact?.email ||
        primaryContact?.email ||
        contactEmailQuery[0]?.email;
    }
  } catch (err) {
    console.warn(
      `[getClientPaymentReceivedData - Query 3 (contactEmail)]`,
      err.message,
    );
  }

  if (!recipientEmail && client.email) {
    recipientEmail = client.email;
  }

  // 4. Resolve full invoice data if only IDs provided
  let enrichedSettledInvoices = [];
  if (Array.isArray(settledInvoices) && settledInvoices.length > 0) {
    try {
      enrichedSettledInvoices = await Promise.all(
        settledInvoices.map(async (item) => {
          if (item.invoiceNumber && item.invoiceAmount) {
            return item;
          }
          const rows = await db
            .select({
              id: invoices.id,
              invoiceNumber: invoices.invoiceNumber,
              invoiceDate: invoices.invoiceDate,
              dueDate: invoices.dueDate,
              invoiceAmount: invoices.invoiceAmount,
              netPayableAmount: invoices.netPayableAmount,
            })
            .from(invoices)
            .where(eq(invoices.id, item.invoiceId))
            .limit(1);
          const inv = rows[0];

          const totalAmount = Number(
            inv?.netPayableAmount || inv?.invoiceAmount || 0,
          );
          const settledAmount = Number(item.settledAmount || item.amount || 0);
          const remainingBalance =
            item.remainingBalance !== undefined
              ? Number(item.remainingBalance)
              : Math.max(0, totalAmount - settledAmount);

          return {
            invoiceId: item.invoiceId,
            invoiceNumber:
              inv?.invoiceNumber ||
              item.invoiceNumber ||
              `INV-${item.invoiceId}`,
            invoiceDate: inv?.invoiceDate || item.invoiceDate,
            dueDate: inv?.dueDate || item.dueDate,
            invoiceAmount: totalAmount,
            settledAmount,
            remainingBalance,
          };
        }),
      );
    } catch (err) {
      throw new Error(
        `[getClientPaymentReceivedData - Query 4 (invoices)] ${err.message}`,
      );
    }
  }

  // 5. Compute total current account outstanding
  let allClientInvoices = [];
  try {
    allClientInvoices = await db
      .select({
        id: invoices.id,
        netPayableAmount: invoices.netPayableAmount,
        invoiceAmount: invoices.invoiceAmount,
        paidAmount: sql`
          COALESCE(
            SUM(${paymentAllocations.allocatedAmount}),
            0
          )
        `,
      })
      .from(invoices)
      .leftJoin(
        paymentAllocations,
        and(
          eq(paymentAllocations.invoiceId, invoices.id),
          isNull(paymentAllocations.deletedAt),
        ),
      )
      .where(
        and(
          eq(invoices.clientId, clientId),
          eq(invoices.companyId, activeCompanyId),
          eq(invoices.status, "ACTIVE"),
        ),
      )
      .groupBy(invoices.id, invoices.netPayableAmount, invoices.invoiceAmount);
  } catch (err) {
    throw new Error(
      `[getClientPaymentReceivedData - Query 5 (outstanding)] ${err.message}`,
    );
  }

  let totalAccountOutstanding = 0;
  for (const inv of allClientInvoices) {
    const total = Number(inv.netPayableAmount || inv.invoiceAmount || 0);
    const paid = Number(inv.paidAmount || 0);
    const due = Math.max(0, total - paid);
    totalAccountOutstanding += due;
  }

  const totalPaymentAmount =
    paymentDetails.amount !== undefined
      ? Number(paymentDetails.amount)
      : enrichedSettledInvoices.reduce(
          (sum, i) => sum + Number(i.settledAmount || 0),
          0,
        );

  return {
    companyId: activeCompanyId,
    clientId,
    paymentId,
    email: recipientEmail,
    clientName: client.clientName,

    paymentAmount: totalPaymentAmount,
    paymentDate: paymentDetails.paymentDate || new Date().toISOString(),
    paymentMethod:
      paymentDetails.paymentMethod ||
      paymentDetails.method ||
      "Bank Transfer / RTGS / NEFT",
    referenceNumber:
      paymentDetails.referenceNumber || paymentDetails.reference || "N/A",

    settledInvoices: enrichedSettledInvoices,
    totalAccountOutstanding,

    senderCompany: company.senderCompany || "PAFEX Logistics",
    senderEmail: company.senderEmail || "",
    senderPhone: company.senderPhone || "",
    senderLogo: company.senderLogo || "",
    company,
  };
}
