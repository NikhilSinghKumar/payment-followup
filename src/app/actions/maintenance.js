"use server";

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { updateInvoiceFinancials } from "@/lib/invoice/updateInvoiceFinancials";

export async function recalculateInvoiceFinancials() {
  const invoiceList = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
    })
    .from(invoices)
    .where(isNull(invoices.deletedAt));

  let success = 0;
  let failed = 0;

  for (const invoice of invoiceList) {
    try {
      await updateInvoiceFinancials(invoice.id);
      success++;
    } catch (err) {
      console.error(invoice.invoiceNumber, err);
      failed++;
    }
  }

  return {
    success,
    failed,
    total: invoiceList.length,
  };
}
