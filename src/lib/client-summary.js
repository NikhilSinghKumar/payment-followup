import { db } from "@/db";
import { invoices, invoiceAwbs, payments } from "@/db/schema";
import { and, eq, isNull, sql, count, desc } from "drizzle-orm";
import { enrichInvoices } from "@/lib/invoice-summary";

/**
 * Build client level summary from enriched invoices.
 * Matches calculations used on clients/[id]/page.js.
 *
 * @param {Array<Object>} invoices
 * @param {number} paymentsReceived
 * @returns {Object}
 */
export function calculateClientSummary(invoices, paymentsReceived = 0) {
  const invoiceList = Array.isArray(invoices) ? invoices : [];

  const totalInvoices = invoiceList.length;

  const totalAmount = invoiceList.reduce(
    (sum, inv) => sum + Number(inv.invoiceAmount || 0),
    0,
  );

  const totalNetPayable = invoiceList.reduce(
    (sum, inv) => sum + Number(inv.netPayableAmount ?? inv.invoiceAmount ?? 0),
    0,
  );

  const totalAllocated = invoiceList.reduce(
    (sum, inv) => sum + Number(inv.paidAmount ?? inv.paid ?? 0),
    0,
  );

  const payments =
    paymentsReceived !== null &&
    paymentsReceived !== undefined &&
    Number(paymentsReceived) > 0
      ? Number(paymentsReceived)
      : totalAllocated;

  const netOutstanding = Math.max(totalNetPayable - payments, 0);

  const totalOutstanding = invoiceList.reduce(
    (sum, inv) => sum + Number(inv.due || 0),
    0,
  );

  const overdueInvoices = invoiceList.filter((inv) => inv.isOverdue).length;

  const overdueAmount = invoiceList.reduce(
    (sum, inv) => (inv.isOverdue ? sum + Number(inv.due || 0) : sum),
    0,
  );

  return {
    totalInvoices,
    totalAmount,
    totalInvoicedAmount: totalAmount,
    totalNetPayable,
    netPayableAmount: totalNetPayable,
    totalPaidAmount: totalAllocated,
    totalAllocated,
    paymentsReceived: payments,
    onAccountAmount: Math.max(payments - totalAllocated, 0),
    netOutstanding,
    restDueAmount: netOutstanding,
    outstandingAmount: netOutstanding,
    creditBalance: Math.max(payments - totalNetPayable, 0),
    totalOutstanding,
    overdueInvoices,
    overdueAmount,
  };
}

/**
 * Fetches and calculates client-level financial summary matching clients/[id]/page.js {/* SUMMARY CARDS *\/}.
 *
 * Source of Truth from clients/[id]/page.js:
 * 1. totalNetPayable = normalizedInvoiceData.reduce((sum, item) => sum + Number(item.netPayableAmount || 0), 0)
 * 2. paymentsReceived = COALESCE(SUM(payments.amount), 0) where isVoided = false and deletedAt is null
 * 3. totalAllocated = normalizedInvoiceData.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0)
 * 4. onAccountAmount = Math.max(paymentsReceived - totalAllocated, 0)
 * 5. netOutstanding = Math.max(totalNetPayable - paymentsReceived, 0)
 * 6. creditBalance = Math.max(paymentsReceived - totalNetPayable, 0)
 * 7. totalAmount = normalizedInvoiceData.reduce((sum, item) => sum + Number(item.invoiceAmount || 0), 0)
 * 8. totalOutstanding = normalizedInvoiceData.reduce((sum, item) => sum + Number(item.due || 0), 0)
 *
 * @param {number|string} clientId
 * @param {number|string|null} companyId
 * @returns {Promise<Object>}
 */
export async function fetchClientFinancialSummary(clientId, companyId = null) {
  const parsedClientId = Number(clientId);
  if (!parsedClientId || isNaN(parsedClientId)) {
    return {
      totalInvoices: 0,
      totalAmount: 0,
      totalInvoicedAmount: 0,
      totalNetPayable: 0,
      netPayableAmount: 0,
      paymentsReceived: 0,
      totalAllocated: 0,
      onAccountAmount: 0,
      netOutstanding: 0,
      restDueAmount: 0,
      creditBalance: 0,
      totalOutstanding: 0,
      outstandingAmount: 0,
      overdueAmount: 0,
      overdueInvoices: 0,
      normalizedInvoices: [],
    };
  }

  // 1. Subquery for AWB counts
  const awbCounts = db
    .select({
      invoiceId: invoiceAwbs.invoiceId,
      awbCount: count(invoiceAwbs.id).as("awb_count"),
    })
    .from(invoiceAwbs)
    .where(isNull(invoiceAwbs.deletedAt))
    .groupBy(invoiceAwbs.invoiceId)
    .as("awb_counts");

  // 2. Query all client invoices
  const invoiceData = await db
    .select({
      id: invoices.id,
      financialYear: invoices.financialYear,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      invoiceAmount: invoices.invoiceAmount,
      netPayableAmount: invoices.netPayableAmount,
      paidAmount: invoices.paidAmount,
      outstandingAmount: invoices.outstandingAmount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      isOpeningBalance: invoices.isOpeningBalance,
      awbCount: sql`COALESCE(${awbCounts.awbCount}, 0)`.mapWith(Number),
    })
    .from(invoices)
    .leftJoin(awbCounts, eq(awbCounts.invoiceId, invoices.id))
    .where(
      and(
        eq(invoices.clientId, parsedClientId),
        isNull(invoices.deletedAt),
        ...(companyId ? [eq(invoices.companyId, Number(companyId))] : []),
      ),
    )
    .orderBy(desc(invoices.id));

  // 3. Normalize invoice data
  const normalizedInvoiceData = enrichInvoices(invoiceData);

  // 4. Query total unvoided payments received
  const paymentSummary = await db
    .select({
      paymentsReceived: sql`COALESCE(SUM(${payments.amount}), 0)`.mapWith(
        Number,
      ),
    })
    .from(payments)
    .where(
      and(
        eq(payments.clientId, parsedClientId),
        isNull(payments.deletedAt),
        eq(payments.isVoided, false),
        ...(companyId ? [eq(payments.companyId, Number(companyId))] : []),
      ),
    );

  const paymentsReceived = Number(paymentSummary[0]?.paymentsReceived || 0);

  // 5. Calculate Exact Summary Totals (Matching clients/[id]/page.js)
  const totalInvoices = normalizedInvoiceData.length;

  const totalAmount = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.invoiceAmount || 0),
    0,
  );

  const totalOutstanding = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.due || 0),
    0,
  );

  const overdueInvoices = normalizedInvoiceData.filter(
    (invoice) => invoice.isOverdue,
  ).length;

  const overdueAmount = normalizedInvoiceData.reduce(
    (sum, item) => (item.isOverdue ? sum + Number(item.due || 0) : sum),
    0,
  );

  const totalNetPayable = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.netPayableAmount || 0),
    0,
  );

  const totalAllocated = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0),
    0,
  );

  // Unallocated payment funds currently held on account
  const onAccountAmount = Math.max(paymentsReceived - totalAllocated, 0);

  // Net Outstanding = Net Payable - Payments Received
  const netOutstanding = Math.max(totalNetPayable - paymentsReceived, 0);

  // True Credit Balance = Only when client payments received exceed total net payable
  const creditBalance = Math.max(paymentsReceived - totalNetPayable, 0);

  return {
    totalInvoices,
    totalAmount,
    totalInvoicedAmount: totalAmount,
    totalNetPayable,
    netPayableAmount: totalNetPayable,
    totalPaidAmount: totalAllocated,
    totalAllocated,
    paymentsReceived,
    onAccountAmount,
    netOutstanding,
    restDueAmount: netOutstanding,
    outstandingAmount: netOutstanding,
    creditBalance,
    totalOutstanding,
    overdueInvoices,
    overdueAmount,
    normalizedInvoices: normalizedInvoiceData,
  };
}
