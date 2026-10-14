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

import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { calculateInvoiceStatus } from "@/lib/invoice-status";
import { enrichInvoices } from "@/lib/invoice-summary";
import { fetchClientFinancialSummary } from "@/lib/client-summary";

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
      paidAmount: invoices.paidAmount,
      tdsDeducted: invoices.tdsAmount,
      tdsDeductedAmount: invoices.tdsDeductedAmount,
      isTdsVerified: invoices.isTdsVerified,
      deductionAmount: invoices.deductionAmount,
      otherCharges: invoices.otherCharges,
      outstandingAmount: invoices.outstandingAmount,
      basicAmount: invoices.basicAmount,
      tdsApplicableUsed: invoices.tdsApplicableUsed,
      tdsRateUsed: invoices.tdsRateUsed,
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
      totalCash: sql`
      COALESCE(
        SUM(CAST(${paymentAllocations.allocatedAmount} AS numeric)),
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

  const totalCash = Number(allocationResult[0]?.totalCash || 0);
  const isTdsVerified = Boolean(invoice.isTdsVerified);
  const tdsDeducted = Number(invoice.tdsDeductedAmount || invoice.tdsDeducted || invoice.tdsAmount || 0);
  const verifiedTds = isTdsVerified ? tdsDeducted : 0;

  const grossInvoiceAmount = Number(invoice.invoiceAmount || 0);
  const deductions =
    Number(invoice.deductionAmount || 0) + Number(invoice.otherCharges || 0);
  const netInvoiceAmount = Math.max(0, grossInvoiceAmount - deductions);

  // In due/overdue emails & payment emails:
  // If payment is done: net outstanding = (Total Invoice Amount - total payment received - tds verified).
  // If payment is not done: total outstanding = net invoice amount.
  const remainingDue = Number((netInvoiceAmount - totalCash - verifiedTds).toFixed(2));
  const isSlightRoundoff = isTdsVerified && remainingDue <= 0.99 && remainingDue >= -0.99;
  const outstandingAmount = isSlightRoundoff ? 0 : Math.max(0, remainingDue);

  const paymentResult = paymentId
    ? await db
        .select({
          amount: payments.amount,
          paymentDate: payments.paymentDate,
          receiptNumber: payments.receiptNumber,
          reference: payments.reference,
          method: payments.method,
        })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1)
    : [];

  const payment = paymentResult[0] ?? null;

  // Payment Summary per Net Invoice Amount & Verified TDS
  const paymentSummary = calculateInvoiceStatus({
    netPayable: netInvoiceAmount,
    paid: totalCash,
    verifiedTds,
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

    invoiceAmount: netInvoiceAmount,
    tdsAmount: Number(payment?.tdsAmount || tdsDeducted || 0),
    tdsDeducted,
    isTdsVerified,
    verifiedTds,
    netPayableAmount: netInvoiceAmount,

    status: paymentSummary.status,

    // Invoice payment summary
    paid: totalCash,
    due: outstandingAmount,
    dueDays: paymentSummary.dueDays,
    // Payment
    paymentAmount: payment ? Number(payment.amount) : 0,
    cashAmount: payment ? Number(payment.amount) : 0,
    totalPaymentAmount: payment
      ? Number(payment.amount) + Number(payment.tdsAmount || 0)
      : 0,
    paymentDate: payment?.paymentDate,
    totalPaid: totalCash,
    settledAmount: totalCash + verifiedTds,
    outstandingAmount,

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
      tdsDeductedAmount: invoices.tdsDeductedAmount,
      isTdsVerified: invoices.isTdsVerified,

      // --------------------------------------------------
      // Total paid & TDS deducted
      // --------------------------------------------------
      paidAmount: sql`
        COALESCE(
          SUM(CAST(${paymentAllocations.allocatedAmount} AS numeric)),
          0
        )
      `,
      tdsDeducted: invoices.tdsAmount,
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
      invoices.tdsDeductedAmount,
      invoices.isTdsVerified,
      invoices.tdsAmount,
    );

  // ======================================================
  // BUILD CLIENT-WISE DATA
  // ======================================================

  const clientsMap = new Map();

  for (const row of rows) {
    const grossInvoiceAmount = Number(row.invoiceAmount || 0);
    const paidAmount = Number(row.paidAmount || 0);
    const isTdsVerified = Boolean(row.isTdsVerified);
    const tdsDeducted = Number(
      row.tdsDeductedAmount || row.tdsDeducted || 0,
    );
    const verifiedTds = isTdsVerified ? tdsDeducted : 0;
    const totalSettled = paidAmount + verifiedTds;

    // In due/overdue emails:
    // If payment is done: net outstanding = (Total Invoice Amount - total payment received - tds verified).
    // If payment is not done: total outstanding = net invoice amount (not net receivable/payable).
    const remainingDue = Number((grossInvoiceAmount - paidAmount - verifiedTds).toFixed(2));
    const isSlightRoundoff = isTdsVerified && remainingDue <= 0.99 && remainingDue >= -0.99;
    const outstandingAmount = isSlightRoundoff ? 0 : Math.max(0, remainingDue);

    // -----------------------------------------------
    // Ignore fully paid / settled invoices
    // -----------------------------------------------

    if (outstandingAmount <= 0.001) {
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
      const invD = new Date(invoiceDate);
      const dueD = new Date(dueDate);
      invD.setHours(0, 0, 0, 0);
      dueD.setHours(0, 0, 0, 0);
      creditDays = Math.max(
        0,
        Math.round((dueD.getTime() - invD.getTime()) / (1000 * 60 * 60 * 24)),
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
      tdsDeducted,
      verifiedTds,
      isTdsVerified,
      totalSettled,
      outstandingAmount,
      due: outstandingAmount,

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

  // Attach exact client-level financials matching clients/[id]/page.js
  for (const clientItem of clientsMap.values()) {
    try {
      const fin = await fetchClientFinancialSummary(clientItem.clientId);
      clientItem.totalInvoiceAmount = fin.totalAmount;
      clientItem.totalInvoicedAmount = fin.totalAmount;
      clientItem.totalNetPayable = fin.totalAmount; // Total Invoice Amount
      clientItem.netInvoiceAmount = fin.totalAmount;
      clientItem.netPayableAmount = fin.totalAmount;
      clientItem.paymentsReceived = fin.paymentsReceived;
      clientItem.totalVerifiedTds = fin.totalVerifiedTds;
      clientItem.netOutstanding = fin.netOutstanding;
      clientItem.restDueAmount = fin.netOutstanding;
      clientItem.totalOutstanding = fin.totalAmount;
      clientItem.totalAccountOutstanding = fin.netOutstanding;
      clientItem.clientSummary = fin;
    } catch (err) {
      console.warn(
        "Failed to fetch client financials in getClientPaymentReminderData:",
        err?.message,
      );
    }
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
  const parsedClientId = Number(clientId);

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
      .where(eq(clients.id, parsedClientId))
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
          let inv = null;
          if (
            !item.invoiceNumber ||
            item.invoiceAmount === undefined ||
            item.netPayableAmount === undefined
          ) {
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
            inv = rows[0];
          }

          const grossInvoiceAmount = Number(
            item.invoiceAmount ?? inv?.invoiceAmount ?? 0,
          );
          const isTdsVerified = Boolean(
            item.isTdsVerified ?? inv?.isTdsVerified,
          );
          const cashSettled = Number(
            item.allocatedAmount ?? item.cashSettled ?? item.paidAmount ?? item.amount ?? 0,
          );
          const tdsSettled = Number(
            item.allocatedTds ?? item.tdsSettled ?? item.tdsAmount ?? 0,
          );
          const verifiedTds = isTdsVerified
            ? tdsSettled || Number(inv?.tdsDeductedAmount || 0)
            : 0;
          const settledAmount = Number(
            item.settledAmount ?? cashSettled + tdsSettled,
          );
          // If payment is done, net outstanding = (Total Invoice Amount - total payment received - tds verified)
          const remainingDue = Number(
            (grossInvoiceAmount - cashSettled - verifiedTds).toFixed(2),
          );
          const isSlightRoundoff =
            isTdsVerified && remainingDue <= 0.99 && remainingDue >= -0.99;
          const remainingBalance =
            item.remainingBalance !== undefined &&
            item.remainingBalance !== null
              ? Number(item.remainingBalance)
              : isSlightRoundoff
                ? 0
                : Math.max(0, remainingDue);

          return {
            invoiceId: item.invoiceId || inv?.id,
            invoiceNumber:
              item.invoiceNumber ||
              inv?.invoiceNumber ||
              `INV-${item.invoiceId}`,
            invoiceDate: item.invoiceDate || inv?.invoiceDate,
            dueDate: item.dueDate || inv?.dueDate,
            invoiceAmount: grossInvoiceAmount,
            netPayableAmount: grossInvoiceAmount,
            cashSettled,
            tdsSettled,
            verifiedTds,
            isTdsVerified,
            settledAmount,
            remainingBalance,
            status: remainingBalance <= 0 ? "paid" : "partial",
          };
        }),
      );
    } catch (err) {
      throw new Error(
        `[getClientPaymentReceivedData - Query 4 (invoices)] ${err.message}`,
      );
    }
  }

  // 5. Compute client-level totals matching clients/[id]/page.js
  let clientFinancials = null;
  try {
    clientFinancials = await fetchClientFinancialSummary(parsedClientId);
  } catch (err) {
    console.warn(
      `[getClientPaymentReceivedData - fetchClientFinancialSummary]`,
      err.message,
    );
  }

  // totalNetPayable that is used on clients/[id]/page.js file
  const totalNetPayableFromClient = clientFinancials?.totalNetPayable ?? 0;

  // Payments received that is used on clients/[id]/page.js file
  const paymentsReceivedFromClient = clientFinancials?.paymentsReceived ?? 0;

  // netOutstanding that is used on clients/[id]/page.js: Math.max(totalNetPayable - paymentsReceived, 0)
  const netOutstandingFromClient = clientFinancials?.netOutstanding ?? 0;

  // Client's unallocated balance across account
  let clientUnallocatedBalance = 0;
  try {
    const unallocatedRows = await db
      .select({
        paymentId: payments.id,
        amount: payments.amount,
        allocatedCash: sql`COALESCE(SUM(CAST(${paymentAllocations.allocatedAmount} AS numeric)), 0)`,
      })
      .from(payments)
      .leftJoin(
        paymentAllocations,
        and(
          eq(paymentAllocations.paymentId, payments.id),
          isNull(paymentAllocations.deletedAt),
        ),
      )
      .where(
        and(
          eq(payments.clientId, parsedClientId),
          isNull(payments.deletedAt),
          eq(payments.isVoided, false),
        ),
      )
      .groupBy(payments.id, payments.amount);

    for (const p of unallocatedRows) {
      const pAmt = Number(p.amount || 0);
      const allocCash = Number(p.allocatedCash || 0);
      clientUnallocatedBalance += Math.max(0, pAmt - allocCash);
    }
  } catch (uErr) {
    console.warn("[getClientPaymentReceivedData - unallocated]", uErr?.message);
  }

  const totalSettledAmount = enrichedSettledInvoices.reduce(
    (sum, i) => sum + Number(i.settledAmount || 0),
    0,
  );
  const totalInvoiceAmount = enrichedSettledInvoices.reduce(
    (sum, i) => sum + Number(i.invoiceAmount || 0),
    0,
  );
  const batchNetPayableTotal = enrichedSettledInvoices.reduce(
    (sum, i) => sum + Number(i.netPayableAmount || i.invoiceAmount || 0),
    0,
  );

  // Payment Received = Settled against invoice(s) + unallocated amount (OR On Account)
  const cashAmount =
    paymentDetails.cashAmount !== undefined
      ? Number(paymentDetails.cashAmount)
      : paymentDetails.amount !== undefined
        ? Number(paymentDetails.amount)
        : totalSettledAmount;
  const tdsAmount = Number(paymentDetails.tdsAmount || 0);
  const totalPaidAndTds = cashAmount + tdsAmount;

  const rawUnallocated =
    paymentDetails.unallocatedAmount !== undefined
      ? Number(paymentDetails.unallocatedAmount)
      : cashAmount > totalSettledAmount
        ? cashAmount - totalSettledAmount
        : 0;
  const unallocatedAmount = Math.max(0, rawUnallocated);

  const totalPaymentAmount = Math.max(
    totalPaidAndTds,
    totalSettledAmount + unallocatedAmount,
  );

  // Total Invoice Amount for client (not net receivable/payable)
  const clientTotalInvoiceAmount =
    clientFinancials?.totalAmount ??
    clientFinancials?.totalInvoicedAmount ??
    totalInvoiceAmount;

  const clientPaymentsReceived =
    clientFinancials?.paymentsReceived ??
    paymentsReceivedFromClient ??
    totalPaymentAmount;

  const clientTotalVerifiedTds =
    clientFinancials?.totalVerifiedTds ?? 0;

  // If payment is done, net outstanding = (Total Invoice Amount - total payment received - tds verified)
  const finalNetOutstanding =
    clientFinancials?.netOutstanding !== undefined &&
    clientFinancials?.netOutstanding !== null
      ? Number(clientFinancials.netOutstanding)
      : Math.max(
          0,
          Number(
            (
              clientTotalInvoiceAmount -
              clientPaymentsReceived -
              clientTotalVerifiedTds
            ).toFixed(2),
          ),
        );

  return {
    companyId: activeCompanyId,
    clientId,
    paymentId,
    email: recipientEmail,
    clientName: client.clientName,

    paymentAmount: totalPaymentAmount,
    cashAmount,
    tdsAmount,
    settledAmount: totalSettledAmount,
    unallocatedAmount,
    clientUnallocatedBalance,
    invoiceAmount: clientTotalInvoiceAmount,
    totalInvoiceAmount: clientTotalInvoiceAmount,
    // Total Outstanding should be Net Invoice Amount (not net receivable/payable)
    totalNetPayable: clientTotalInvoiceAmount,
    netPayableAmount: clientTotalInvoiceAmount,
    // Rest Due Amount: (Total Invoice Amount - total payment received - tds verified)
    netOutstanding: finalNetOutstanding,
    restDueAmount: finalNetOutstanding,
    overallOutstanding: finalNetOutstanding,
    totalOutstanding: clientTotalInvoiceAmount,
    totalAccountOutstanding: finalNetOutstanding,
    remainingOutstanding: finalNetOutstanding,
    paymentsReceived: clientPaymentsReceived,
    totalVerifiedTds: clientTotalVerifiedTds,
    clientSummary: clientFinancials,
    paymentDate: paymentDetails.paymentDate || new Date().toISOString(),
    paymentMethod:
      paymentDetails.paymentMethod ||
      paymentDetails.method ||
      "Bank Transfer / RTGS / NEFT",
    referenceNumber:
      paymentDetails.referenceNumber || paymentDetails.reference || "N/A",

    settledInvoices: enrichedSettledInvoices,

    senderCompany: company.senderCompany || "PAFEX Logistics",
    senderEmail: company.senderEmail || "",
    senderPhone: company.senderPhone || "",
    senderLogo: company.senderLogo || "",
    company,
  };
}
