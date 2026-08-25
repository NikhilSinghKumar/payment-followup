import { db } from "@/db";
import { invoices, paymentAllocations, payments } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { calculateInvoiceStatus } from "@/lib/invoice-status";

export async function updateInvoiceFinancials(invoiceId) {
  // =====================================
  // GET INVOICE
  // =====================================

  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), isNull(invoices.deletedAt)))
    .limit(1);

  const invoice = invoiceRows[0] || null;

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  // =====================================
  // TOTAL PAID
  // =====================================

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
    .innerJoin(payments, eq(paymentAllocations.paymentId, payments.id))
    .where(
      and(
        eq(paymentAllocations.invoiceId, invoiceId),

        isNull(paymentAllocations.deletedAt),

        isNull(payments.deletedAt),

        eq(payments.isVoided, false),
      ),
    );

  const paidAmount = Number(allocationResult[0]?.total || 0);

  // =====================================
  // OUTSTANDING
  // =====================================

  const outstandingAmount = Math.max(
    Number(invoice.netPayableAmount) - paidAmount,
    0,
  );

  // =====================================
  // STATUS
  // =====================================

  const invoiceStatus = calculateInvoiceStatus({
    netPayable: Number(invoice.netPayableAmount),
    paid: paidAmount,
    dueDate: invoice.dueDate,
  });

  // =====================================
  // UPDATE
  // =====================================

  await db
    .update(invoices)
    .set({
      paidAmount: paidAmount.toString(),
      outstandingAmount: outstandingAmount.toString(),
      status: invoiceStatus.status,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  return {
    paidAmount,
    outstandingAmount,
    status: invoiceStatus.status,
  };
}
