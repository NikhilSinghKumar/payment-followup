import { db } from "@/db";
import { invoices, payments, paymentAllocations } from "@/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getFinancialYear } from "@/lib/financial-year";
import { calculateInvoiceStatus } from "@/lib/invoice-status";
import { parseImportDate } from "@/lib/date-parser";

/**
 * Creates, updates, or adjusts a client's opening balance as either:
 * - DEBIT: a special opening balance invoice (in `invoices`)
 * - CREDIT: a special advance payment (in `payments`)
 *
 * Handles switching between Debit and Credit, checking existing allocations/receipts,
 * and updating status/amounts safely.
 */
export async function setOrUpdateClientOpeningBalance({
  companyId,
  clientId,
  amount,
  type = "DEBIT", // "DEBIT" or "CREDIT"
  asOfDate = new Date(),
  notes = "",
  gstNumber = null,
  tdsApplicable = false,
  tdsRate = "2.00",
}) {
  if (isNaN(amount) || amount < 0) {
    throw new Error("Invalid opening balance amount");
  }

  const parsedDate = parseImportDate(asOfDate);
  const validDate =
    parsedDate instanceof Date && !isNaN(parsedDate.getTime())
      ? parsedDate
      : asOfDate instanceof Date && !isNaN(asOfDate.getTime())
        ? asOfDate
        : new Date();
  const financialYear = getFinancialYear(validDate);

  const normalizedType =
    type?.toString().trim().toUpperCase() === "CREDIT" ||
    type?.toString().trim().toUpperCase() === "CR"
      ? "CREDIT"
      : "DEBIT";

  // Fetch any existing debit invoice & credit payment records for this client
  const existingDebit = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.clientId, clientId),
        eq(invoices.isOpeningBalance, true),
        isNull(invoices.deletedAt),
      ),
    )
    .limit(1);

  const existingCredit = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        eq(payments.clientId, clientId),
        eq(payments.isOpeningBalance, true),
        eq(payments.isVoided, false),
        isNull(payments.deletedAt),
      ),
    )
    .limit(1);

  if (normalizedType === "CREDIT") {
    // 1. If switching from DEBIT to CREDIT, check if existing debit invoice has payments
    if (existingDebit.length > 0) {
      const debitInv = existingDebit[0];
      const paidOnDebit = Number(debitInv.paidAmount || 0);
      if (paidOnDebit > 0) {
        throw new Error(
          `Cannot switch to Credit opening balance: existing Debit opening balance has received payments of ₹${paidOnDebit.toLocaleString("en-IN")}.`,
        );
      }
      // Soft delete the debit invoice
      await db
        .update(invoices)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(invoices.id, debitInv.id));
    }

    // 2. Handle credit payment record
    if (existingCredit.length > 0) {
      const currentCredit = existingCredit[0];
      const allocResult = await db
        .select({
          total: sql`COALESCE(SUM(${paymentAllocations.allocatedAmount}), 0)`,
        })
        .from(paymentAllocations)
        .where(eq(paymentAllocations.paymentId, currentCredit.id));

      const allocated = Number(allocResult[0]?.total || 0);

      if (amount < allocated) {
        throw new Error(
          `Cannot reduce credit opening balance below the already allocated amount (₹${allocated.toLocaleString("en-IN")}).`,
        );
      }

      if (amount === 0 && allocated === 0) {
        // Soft delete/void credit payment
        await db
          .update(payments)
          .set({
            deletedAt: new Date(),
            isVoided: true,
            voidReason: "Opening credit cleared to 0",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, currentCredit.id));
      } else {
        await db
          .update(payments)
          .set({
            amount: amount.toFixed(2),
            paymentDate: validDate,
            notes:
              notes ||
              currentCredit.notes ||
              "Opening Balance (Credit) / Advance Carried Forward",
            updatedAt: new Date(),
          })
          .where(eq(payments.id, currentCredit.id));
      }
    } else if (amount > 0) {
      await db.insert(payments).values({
        companyId,
        clientId,
        subClientId: null,
        amount: amount.toFixed(2),
        paymentDate: validDate,
        receiptNumber: `RCPT-OPENING-${clientId}`,
        method: "adjustment",
        reference: "OPENING-ADVANCE",
        notes: notes || "Opening Balance (Credit) / Advance Carried Forward",
        isOpeningBalance: true,
      });
    }
  } else {
    // normalizedType === "DEBIT"
    // 1. If switching from CREDIT to DEBIT, check if existing credit has allocations
    if (existingCredit.length > 0) {
      const creditPay = existingCredit[0];
      const allocResult = await db
        .select({
          total: sql`COALESCE(SUM(${paymentAllocations.allocatedAmount}), 0)`,
        })
        .from(paymentAllocations)
        .where(eq(paymentAllocations.paymentId, creditPay.id));

      const allocated = Number(allocResult[0]?.total || 0);
      if (allocated > 0) {
        throw new Error(
          `Cannot switch to Debit opening balance: existing Credit opening balance has already been allocated (₹${allocated.toLocaleString("en-IN")}).`,
        );
      }

      // Void the credit payment
      await db
        .update(payments)
        .set({
          deletedAt: new Date(),
          isVoided: true,
          voidReason: "Switched to Debit opening balance",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, creditPay.id));
    }

    // 2. Handle debit invoice record
    if (existingDebit.length > 0) {
      const currentOpening = existingDebit[0];
      const paid = Number(currentOpening.paidAmount || 0);

      if (amount < paid) {
        throw new Error(
          `Cannot reduce opening balance below the already received payment amount (₹${paid.toLocaleString("en-IN")}).`,
        );
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
          dueDate: validDate,
        });

        await db
          .update(invoices)
          .set({
            invoiceAmount: amount.toFixed(2),
            basicAmount: amount.toFixed(2),
            netPayableAmount: amount.toFixed(2),
            outstandingAmount: outstanding.toFixed(2),
            invoiceDate: validDate,
            dueDate: validDate,
            financialYear,
            status: statusResult.status,
            gstNumberUsed: gstNumber ?? currentOpening.gstNumberUsed,
            tdsApplicableUsed:
              tdsApplicable ?? currentOpening.tdsApplicableUsed,
            tdsRateUsed: tdsApplicable
              ? String(tdsRate ?? currentOpening.tdsRateUsed ?? "2.00")
              : "2.00",
            notes: notes || currentOpening.notes || "Imported Opening Balance",
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
        dueDate: validDate,
      });

      await db.insert(invoices).values({
        companyId,
        clientId,
        subClientId: null,
        financialYear,
        invoiceNumber,
        invoiceDate: validDate,
        dueDate: validDate,
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
        gstNumberUsed: gstNumber || null,
        tdsApplicableUsed: tdsApplicable || false,
        tdsRateUsed: tdsApplicable ? String(tdsRate || "2.00") : "2.00",
        status: statusResult.status,
        isOpeningBalance: true,
        notes: notes || "Imported Opening Balance",
      });
    }
  }
}
