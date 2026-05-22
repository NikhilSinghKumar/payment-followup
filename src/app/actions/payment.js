"use server";

import { db } from "@/db";

import { payments, paymentAllocations, invoices } from "@/db/schema";

import { eq, sql } from "drizzle-orm";

import { revalidatePath } from "next/cache";

export async function updatePayment(paymentId, invoiceId, prevState, formData) {
  try {
    // =====================================
    // FORM VALUES
    // =====================================

    const amount = parseFloat(formData.get("amount"));

    const method = formData.get("method");

    const reference = formData.get("reference");

    const notes = formData.get("notes");

    const paymentDate = formData.get("paymentDate")
      ? new Date(formData.get("paymentDate"))
      : null;

    if (isNaN(amount)) {
      return { error: "Invalid amount" };
    }

    // =====================================
    // UPDATE PAYMENT
    // =====================================

    await db
      .update(payments)
      .set({
        amount: String(amount),
        method,
        reference,
        notes,
        paymentDate,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    // =====================================
    // UPDATE PAYMENT ALLOCATION
    // =====================================

    await db
      .update(paymentAllocations)
      .set({
        allocatedAmount: amount.toString(),
      })
      .where(eq(paymentAllocations.paymentId, paymentId))
      .returning();

    // =====================================
    // RECALCULATE INVOICE STATUS
    // =====================================

    const invoiceResult = await db
      .select({
        amount: invoices.amount,
      })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    const invoiceAmount = Number(invoiceResult[0]?.amount || 0);

    const allocationResult = await db
      .select({
        total: sql`
          COALESCE(
            SUM(${paymentAllocations.allocatedAmount}),
            0
          )
        `,
      })
      .from(paymentAllocations)
      .where(eq(paymentAllocations.invoiceId, invoiceId));

    const totalPaid = Number(allocationResult[0]?.total || 0);

    let status = "pending";

    if (totalPaid > 0 && totalPaid < invoiceAmount) {
      status = "partial";
    }

    if (totalPaid >= invoiceAmount) {
      status = "paid";
    }

    // =====================================
    // UPDATE INVOICE
    // =====================================

    await db
      .update(invoices)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    // =====================================
    // REFRESH
    // =====================================

    revalidatePath(`/invoices/${invoiceId}`);

    revalidatePath("/invoices");

    return { success: true };
  } catch (err) {
    console.error(err);

    return { error: "Failed to update payment" };
  }
}
