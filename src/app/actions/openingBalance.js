"use server";

import { db } from "@/db";
import { invoices, clients, paymentAllocations } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/auth";
import { getFinancialYear } from "@/lib/financial-year";
import { calculateInvoiceStatus } from "@/lib/invoice-status";

/**
 * Fetch the opening balance invoice for a specific client.
 */
export async function getOpeningBalanceByClientId(clientId) {
  if (!clientId) return null;

  try {
    const records = await db
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

    return records[0] || null;
  } catch (err) {
    console.warn("[getOpeningBalanceByClientId]", err?.message || err);
    return null;
  }
}

/**
 * Save or update a client's opening balance as a virtual invoice record.
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
    const asOfDateStr = formData.get("asOfDate");
    const notes = formData.get("notes")?.trim() || "Opening Balance";

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

    // Check if an opening balance invoice already exists for this client
    const existing = await db
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

    if (existing.length > 0) {
      const currentOpening = existing[0];
      const paid = Number(currentOpening.paidAmount || 0);

      if (amount < paid) {
        return {
          error: `Cannot reduce opening balance below the already received payment amount (₹${paid.toLocaleString("en-IN")}).`,
        };
      }

      if (amount === 0 && paid === 0) {
        // Soft delete the opening balance record if amount is reset to 0
        await db
          .update(invoices)
          .set({
            deletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, currentOpening.id));
      } else {
        const netPayable = amount;
        const outstanding = Math.max(0, netPayable - paid);

        const statusResult = calculateInvoiceStatus({
          netPayable,
          paid,
          dueDate: asOfDate,
        });

        await db
          .update(invoices)
          .set({
            invoiceAmount: amount.toFixed(2),
            basicAmount: amount.toFixed(2),
            netPayableAmount: amount.toFixed(2),
            outstandingAmount: outstanding.toFixed(2),
            invoiceDate: asOfDate,
            dueDate: asOfDate,
            financialYear,
            status: statusResult.status,
            notes,
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, currentOpening.id));
      }
    } else if (amount > 0) {
      // Create new opening balance invoice
      const invoiceNumber = `OPENING-BAL`;
      const netPayable = amount;
      const outstanding = amount;

      const statusResult = calculateInvoiceStatus({
        netPayable,
        paid: 0,
        dueDate: asOfDate,
      });

      await db.insert(invoices).values({
        companyId: currentUser.companyId,
        clientId,
        subClientId: null,
        financialYear,
        invoiceNumber,
        invoiceDate: asOfDate,
        dueDate: asOfDate,
        paymentTerms: 0,
        invoiceAmount: amount.toFixed(2),
        basicAmount: amount.toFixed(2),
        cgstAmount: "0.00",
        sgstAmount: "0.00",
        igstAmount: "0.00",
        tdsAmount: "0.00",
        deductionAmount: "0.00",
        otherCharges: "0.00",
        netPayableAmount: netPayable.toFixed(2),
        paidAmount: "0.00",
        outstandingAmount: outstanding.toFixed(2),
        gstNumberUsed: client.gstNumber || null,
        tdsApplicableUsed: client.tdsApplicable || false,
        status: statusResult.status,
        isOpeningBalance: true,
        notes,
      });
    }

    revalidatePath(`/clients/${clientId}`);
    revalidatePath(`/clients/${clientId}?tab=invoices`);
    revalidatePath("/clients");
    revalidatePath("/invoices");

    return { success: true };
  } catch (err) {
    console.error("Save Opening Balance Error:", err);
    return { error: err.message || "Failed to save opening balance." };
  }
}
