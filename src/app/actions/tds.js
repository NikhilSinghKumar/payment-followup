"use server";

import { db } from "@/db";
import { invoices, clients, paymentAllocations, payments } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/auth";
import { and, desc, eq, inArray, isNull, sql, not, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateInvoiceFinancials } from "@/lib/invoice/updateInvoiceFinancials";

/**
 * Fetch all clients and their invoices with TDS breakdown.
 *
 * @param {Object} options
 * @param {number|string} options.clientId - Optional client filter
 * @param {"ALL"|"PENDING"|"VERIFIED"} options.status - TDS verification filter
 * @param {string} options.search - Search string for invoice number or client name
 */
export async function getTdsManagementData({
  clientId = "ALL",
  status = "ALL",
  search = "",
} = {}) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.user || !currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const companyId = currentUser.companyId;

  // 1. Fetch active clients for dropdown
  const allClients = await db
    .select({
      id: clients.id,
      companyName: clients.companyName,
      companyCode: clients.companyCode,
      tdsApplicable: clients.tdsApplicable,
      tdsRate: clients.tdsRate,
    })
    .from(clients)
    .where(and(eq(clients.companyId, companyId), isNull(clients.deletedAt)))
    .orderBy(clients.companyName);

  // 2. Query invoices that have TDS or belong to clients with TDS (including Opening Balance invoices)
  const conditions = [
    eq(invoices.companyId, companyId),
    isNull(invoices.deletedAt),
  ];

  if (clientId && clientId !== "ALL") {
    conditions.push(eq(invoices.clientId, Number(clientId)));
  }

  const rawInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      financialYear: invoices.financialYear,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      invoiceAmount: invoices.invoiceAmount,
      basicAmount: invoices.basicAmount,
      netPayableAmount: invoices.netPayableAmount,
      paidAmount: invoices.paidAmount,
      outstandingAmount: invoices.outstandingAmount,
      tdsAmount: invoices.tdsAmount,
      tdsDeductedAmount: invoices.tdsDeductedAmount,
      isTdsVerified: invoices.isTdsVerified,
      tdsVerifiedAt: invoices.tdsVerifiedAt,
      tdsNotes: invoices.tdsNotes,
      tdsApplicableUsed: invoices.tdsApplicableUsed,
      tdsRateUsed: invoices.tdsRateUsed,
      status: invoices.status,
      clientId: invoices.clientId,
      isOpeningBalance: invoices.isOpeningBalance,
      clientName: clients.companyName,
      clientCode: clients.companyCode,
      clientTdsRate: clients.tdsRate,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.invoiceDate), desc(invoices.id));

  // 3. Enrich invoices with TDS reconciliation metrics
  const enrichedInvoices = rawInvoices.map((inv) => {
    const isOpening = Boolean(
      inv.isOpeningBalance ||
      String(inv.invoiceNumber || "")
        .toUpperCase()
        .startsWith("OPENING"),
    );

    const grossInvoiceAmount = Number(inv.invoiceAmount || 0);
    const actualPaymentReceived = Number(inv.paidAmount || 0);

    // Calculated expected TDS based on rate and basic amount (rounded to nearest rupee per Sec 288B)
    const rawExpected = isOpening ? 0 : Number(inv.tdsAmount || 0);
    const expectedTds = Math.round(rawExpected);

    // Actual deducted TDS (defaults to expected TDS if not explicitly entered)
    let rawDeducted = isOpening
      ? 0
      : inv.tdsDeductedAmount !== null &&
          inv.tdsDeductedAmount !== undefined &&
          Number(inv.tdsDeductedAmount) > 0
        ? Number(inv.tdsDeductedAmount)
        : expectedTds;

    // Under Section 288B of Indian Income Tax Act, deductors round TDS to whole rupees.
    // If client paid invoice and the unpaid balance matches TDS within round-off tolerance (<= ₹1.00),
    // align to the exact balance withheld by the client so there is zero points difference.
    const unpaidBalance = Number(
      (grossInvoiceAmount - actualPaymentReceived).toFixed(2),
    );
    if (
      !isOpening &&
      actualPaymentReceived > 0 &&
      unpaidBalance > 0 &&
      rawDeducted > 0 &&
      Math.abs(unpaidBalance - rawDeducted) <= 1.0
    ) {
      rawDeducted = unpaidBalance;
    }

    const tdsDeducted = rawDeducted;
    const hasTds = tdsDeducted > 0;
    const isVerified = !isOpening && Boolean(inv.isTdsVerified);

    const verifiedTds = hasTds && isVerified ? tdsDeducted : 0;
    const pendingTds = hasTds && !isVerified ? tdsDeducted : 0;

    // Reconciliation check: Actual Payment + TDS (Verified or Pending)
    const totalReconciled = actualPaymentReceived + tdsDeducted;
    const difference = grossInvoiceAmount - totalReconciled;
    const isFullyMatched = Math.abs(difference) < 1;
    // When TDS is not applicable (hasTds === false), the invoice is fully settled as soon as payment matches gross
    const isFullySettled = isFullyMatched && (!hasTds || isVerified);
    const isTdsPendingSettlement = isFullyMatched && hasTds && !isVerified;
    const roundOffDifference = Number(difference.toFixed(2));

    return {
      ...inv,
      grossInvoiceAmount,
      actualPaymentReceived,
      expectedTds,
      tdsDeducted,
      hasTds,
      isVerified,
      verifiedTds,
      pendingTds,
      totalReconciled,
      difference,
      roundOffDifference,
      isFullyMatched,
      isFullySettled,
      isTdsPendingSettlement,
      outstandingAmount: Number(inv.outstandingAmount || 0),
    };
  });

  // 4. Apply client-side status & search filters
  let filteredInvoices = enrichedInvoices;

  if (status === "PENDING") {
    filteredInvoices = filteredInvoices.filter(
      (inv) => !inv.isVerified && inv.tdsDeducted > 0,
    );
  } else if (status === "VERIFIED") {
    filteredInvoices = filteredInvoices.filter(
      (inv) => inv.isVerified && inv.tdsDeducted > 0,
    );
  }

  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    filteredInvoices = filteredInvoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(q) ||
        inv.clientName?.toLowerCase().includes(q) ||
        inv.clientCode?.toLowerCase().includes(q),
    );
  }

  // 5. Global Summary Statistics
  const summary = {
    totalInvoices: enrichedInvoices.length,
    totalGrossBilled: enrichedInvoices.reduce(
      (acc, inv) => acc + inv.grossInvoiceAmount,
      0,
    ),
    totalPaymentsReceived: enrichedInvoices.reduce(
      (acc, inv) => acc + inv.actualPaymentReceived,
      0,
    ),
    totalVerifiedTds: enrichedInvoices.reduce(
      (acc, inv) => acc + inv.verifiedTds,
      0,
    ),
    totalPendingTds: enrichedInvoices.reduce(
      (acc, inv) => acc + inv.pendingTds,
      0,
    ),
    totalOutstanding: enrichedInvoices.reduce(
      (acc, inv) => acc + inv.outstandingAmount,
      0,
    ),
  };

  return {
    clients: allClients,
    invoices: filteredInvoices,
    summary,
  };
}

/**
 * Toggle TDS verification directly from a checkbox.
 */
export async function toggleTdsVerification(invoiceId, isVerified) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.user || !currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const numInvoiceId = Number(invoiceId);

  // Check invoice exists and is not an opening balance
  const [existing] = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      isOpeningBalance: invoices.isOpeningBalance,
      tdsAmount: invoices.tdsAmount,
      tdsDeductedAmount: invoices.tdsDeductedAmount,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.id, numInvoiceId),
        eq(invoices.companyId, currentUser.companyId),
        isNull(invoices.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error("Invoice not found.");
  }

  if (
    existing.isOpeningBalance ||
    String(existing.invoiceNumber || "")
      .toUpperCase()
      .startsWith("OPENING")
  ) {
    throw new Error("TDS does not apply to Opening Balance invoices.");
  }

  // If deducted amount is not set, set it to the default tdsAmount
  const currentDeducted =
    Number(existing.tdsDeductedAmount || 0) > 0
      ? existing.tdsDeductedAmount
      : existing.tdsAmount;

  await db
    .update(invoices)
    .set({
      isTdsVerified: Boolean(isVerified),
      tdsDeductedAmount: currentDeducted,
      tdsVerifiedAt: isVerified ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, numInvoiceId));

  // Recalculate invoice financials
  await updateInvoiceFinancials(numInvoiceId);

  revalidatePath("/tds");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${numInvoiceId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return { success: true, isVerified: Boolean(isVerified) };
}

/**
 * Update or override TDS amount and verification status for an invoice.
 */
export async function updateInvoiceTds({
  invoiceId,
  tdsDeductedAmount,
  isTdsVerified,
  notes = "",
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.user || !currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const numInvoiceId = Number(invoiceId);
  const numTdsAmount = Number(tdsDeductedAmount || 0);

  if (isNaN(numTdsAmount) || numTdsAmount < 0) {
    throw new Error("TDS amount must be a non-negative number.");
  }

  const [existing] = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      isOpeningBalance: invoices.isOpeningBalance,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.id, numInvoiceId),
        eq(invoices.companyId, currentUser.companyId),
        isNull(invoices.deletedAt),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error("Invoice not found.");
  }

  if (
    existing.isOpeningBalance ||
    String(existing.invoiceNumber || "")
      .toUpperCase()
      .startsWith("OPENING")
  ) {
    throw new Error("TDS does not apply to Opening Balance invoices.");
  }

  await db
    .update(invoices)
    .set({
      tdsDeductedAmount: numTdsAmount.toString(),
      isTdsVerified: Boolean(isTdsVerified),
      tdsVerifiedAt: isTdsVerified ? new Date() : null,
      tdsNotes: notes || null,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, numInvoiceId));

  // Recalculate invoice financials
  await updateInvoiceFinancials(numInvoiceId);

  revalidatePath("/tds");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${numInvoiceId}`);
  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Bulk verify or unverify TDS for multiple invoices.
 */
export async function bulkVerifyTds(invoiceIds, isVerified) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.user || !currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const validIds = Array.isArray(invoiceIds) ? invoiceIds.map(Number) : [];

  if (validIds.length === 0) {
    return { count: 0 };
  }

  for (const id of validIds) {
    await toggleTdsVerification(id, isVerified);
  }

  revalidatePath("/tds");
  revalidatePath("/invoices");
  revalidatePath("/dashboard");

  return { count: validIds.length, isVerified: Boolean(isVerified) };
}
