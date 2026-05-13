"use server";

import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updatePayment(paymentId, invoiceId, formData) {
  try {
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

    await db
      .update(payments)
      .set({
        amount,
        method,
        reference,
        notes,
        paymentDate,
      })
      .where(eq(payments.id, paymentId));

    // refresh invoice detail page
    revalidatePath(`/invoices/${invoiceId}`);

    // refresh invoice list
    revalidatePath("/invoices");

    return { success: true };
  } catch (err) {
    console.error(err);

    return { error: "Failed to update payment" };
  }
}
