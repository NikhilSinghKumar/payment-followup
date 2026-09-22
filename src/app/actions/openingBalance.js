"use server";

import { db } from "@/db";
import { invoices, clients, payments, paymentAllocations } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/auth";
import { setOrUpdateClientOpeningBalance } from "@/lib/client-opening-balance";
import { getFinancialYear } from "@/lib/financial-year";

/**
 * Fetch the opening balance for a specific client (either Debit in invoices or Credit in payments).
 */
export async function getOpeningBalanceByClientId(clientId) {
  if (!clientId) return null;

  try {
    // 1. Check for Debit opening balance invoice
    const invoiceRecords = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.clientId, clientId),
          eq(invoices.isOpeningBalance, true),
          isNull(invoices.deletedAt),
        ),
      )
      .limit(1);

    if (invoiceRecords.length > 0) {
      const inv = invoiceRecords[0];
      return {
        id: inv.id,
        type: "DEBIT",
        amount: inv.netPayableAmount || inv.invoiceAmount || "0",
        invoiceAmount: inv.invoiceAmount,
        netPayableAmount: inv.netPayableAmount,
        paidAmount: inv.paidAmount || "0",
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        notes: inv.notes,
        isOpeningBalance: true,
      };
    }

    // 2. Check for Credit opening balance payment
    const paymentRecords = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.clientId, clientId),
          eq(payments.isOpeningBalance, true),
          eq(payments.isVoided, false),
          isNull(payments.deletedAt),
        ),
      )
      .limit(1);

    if (paymentRecords.length > 0) {
      const pay = paymentRecords[0];
      // Check allocations for this payment
      const allocResult = await db
        .select({
          total: sql`COALESCE(SUM(${paymentAllocations.allocatedAmount}), 0)`,
        })
        .from(paymentAllocations)
        .where(eq(paymentAllocations.paymentId, pay.id));

      const allocated = Number(allocResult[0]?.total || 0);

      return {
        id: pay.id,
        type: "CREDIT",
        amount: pay.amount || "0",
        invoiceAmount: pay.amount || "0",
        netPayableAmount: pay.amount || "0",
        paidAmount: allocated.toString(),
        invoiceDate: pay.paymentDate,
        dueDate: pay.paymentDate,
        notes: pay.notes,
        isOpeningBalance: true,
      };
    }

    return null;
  } catch (err) {
    console.warn("[getOpeningBalanceByClientId]", err?.message || err);
    return null;
  }
}

/**
 * Save or update a client's opening balance as a virtual invoice (Debit) or initial credit payment (Credit).
 */
export async function saveClientOpeningBalance(formData) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser.user) {
      return { error: "Unauthorized" };
    }

    if (!currentUser.companyId) {
      return { error: "User is not associated with a company." };
    }

    const clientId = Number(formData.get("clientId"));
    const rawAmount = formData.get("amount");
    const amount = parseFloat(rawAmount || "0");
    const type = (formData.get("type") || "DEBIT").toUpperCase(); // "DEBIT" or "CREDIT"
    const asOfDateStr = formData.get("asOfDate");
    const notes =
      formData.get("notes")?.trim() ||
      (type === "CREDIT"
        ? "Opening Balance (Credit) / Advance Carried Forward"
        : "Opening Balance");

    if (!clientId || isNaN(clientId)) {
      return { error: "Invalid client ID" };
    }

    if (isNaN(amount) || amount < 0) {
      return { error: "Invalid opening balance amount" };
    }

    const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date();
    if (isNaN(asOfDate.getTime())) {
      return { error: "Invalid date provided" };
    }

    const financialYear = getFinancialYear(asOfDate);

    // Verify client exists and belongs to company
    const clientRecord = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, clientId),
          eq(clients.companyId, currentUser.companyId),
          isNull(clients.deletedAt),
        ),
      )
      .limit(1);

    if (!clientRecord.length) {
      return { error: "Client not found" };
    }

    const client = clientRecord[0];

    await setOrUpdateClientOpeningBalance({
      companyId: currentUser.companyId,
      clientId,
      amount,
      type,
      asOfDate,
      notes,
      gstNumber: client.gstNumber,
      tdsApplicable: client.tdsApplicable,
      tdsRate: client.tdsRate,
    });

    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/clients/${clientId}?tab=invoices`);
    revalidatePath(`/clients/${clientId}?tab=payments`);
    revalidatePath("/clients");
    revalidatePath("/invoices");
    revalidatePath("/payments");

    return { success: true };
  } catch (err) {
    console.error("Save Opening Balance Error:", err);
    return { error: err.message || "Failed to save opening balance." };
  }
}
