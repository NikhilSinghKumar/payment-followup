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
  // TDS FINANCIAL CALCULATION
  // =====================================
  const tdsDeducted = Number(
    invoice.tdsDeductedAmount || invoice.tdsAmount || 0,
  );
  const isTdsVerified = Boolean(invoice.isTdsVerified);
  const verifiedTds = isTdsVerified ? tdsDeducted : 0;

  const grossInvoiceAmount = Number(
    invoice.invoiceAmount || invoice.netPayableAmount || 0,
  );
  const deductions =
    Number(invoice.deductionAmount || 0) + Number(invoice.otherCharges || 0);
  const netBilled = Math.max(0, grossInvoiceAmount - deductions);

  // Net payable amount represents what client owes after TDS deduction
  const netPayableAmount = Math.max(0, netBilled - tdsDeducted);

  // =====================================
  // OUTSTANDING
  // =====================================
  // Total invoice is settled when paidAmount + verifiedTds reaches netBilled
  const outstandingAmount = Math.max(
    0,
    Number((netBilled - paidAmount - verifiedTds).toFixed(2)),
  );

  // =====================================
  // STATUS
  // =====================================
  const invoiceStatus = calculateInvoiceStatus({
    netPayable: netBilled,
    paid: paidAmount,
    verifiedTds,
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
      netPayableAmount: netPayableAmount.toString(),
      status: invoiceStatus.status,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  return {
    paidAmount,
    outstandingAmount,
    netPayableAmount,
    verifiedTds,
    pendingTds: !isTdsVerified ? tdsDeducted : 0,
    status: invoiceStatus.status,
  };
}
