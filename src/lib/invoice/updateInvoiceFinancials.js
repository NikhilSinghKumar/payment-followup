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
  const isOpening =
    Boolean(invoice.isOpeningBalance) ||
    String(invoice.invoiceNumber || "")
      .toUpperCase()
      .startsWith("OPENING");

  if (isOpening) {
    const grossInvoiceAmount = Number(
      invoice.invoiceAmount || invoice.netPayableAmount || 0,
    );
    const deductions =
      Number(invoice.deductionAmount || 0) + Number(invoice.otherCharges || 0);
    const netBilled = Math.max(0, grossInvoiceAmount - deductions);
    const outstandingAmount = Math.max(
      0,
      Number((netBilled - paidAmount).toFixed(2)),
    );

    const invoiceStatus = calculateInvoiceStatus({
      netPayable: netBilled,
      paid: paidAmount,
      verifiedTds: 0,
      dueDate: invoice.dueDate,
    });

    await db
      .update(invoices)
      .set({
        paidAmount: paidAmount.toString(),
        outstandingAmount: outstandingAmount.toString(),
        netPayableAmount: netBilled.toString(),
        tdsAmount: "0.00",
        tdsDeductedAmount: "0.00",
        tdsApplicableUsed: false,
        tdsRateUsed: "0.00",
        isTdsVerified: false,
        tdsVerifiedAt: null,
        tdsNotes: null,
        isOpeningBalance: true,
        status: invoiceStatus.status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    return {
      paidAmount,
      outstandingAmount,
      netPayableAmount: netBilled,
      verifiedTds: 0,
      pendingTds: 0,
      status: invoiceStatus.status,
    };
  }

  const grossInvoiceAmount = Number(invoice.invoiceAmount || 0);
  const deductions =
    Number(invoice.deductionAmount || 0) + Number(invoice.otherCharges || 0);
  const netBilled = Math.max(0, grossInvoiceAmount - deductions);

  // Robust TDS resolution:
  // Numeric columns in pg can be returned as string "0.00".
  // If a non-zero tdsDeductedAmount exists, use that.
  // Otherwise, fallback to statutory tdsAmount.
  // If tdsApplicableUsed is true and both are 0, calculate dynamically from basicAmount.
  const numStatutoryTds = Number(invoice.tdsAmount || 0);
  const numTdsDeducted = Number(invoice.tdsDeductedAmount || 0);
  let effectiveTds = numTdsDeducted > 0 ? numTdsDeducted : numStatutoryTds;

  if (effectiveTds <= 0 && invoice.tdsApplicableUsed) {
    const basic = Number(invoice.basicAmount || 0);
    const rate = Number(invoice.tdsRateUsed || 2.0);
    if (basic > 0 && rate > 0) {
      effectiveTds = Math.round(basic * (rate / 100));
    }
  }

  // Under Section 288B of Income Tax Act, deductors round TDS to the nearest integer.
  // If client paid invoice minus TDS (leaving an unpaid balance that matches TDS within round-off tolerance <= ₹1.00),
  // align effectiveTds to the exact balance withheld by the client so there is zero difference in points.
  const unpaidBeforeTds = Number((netBilled - paidAmount).toFixed(2));
  let updatedTdsDeductedAmount =
    numTdsDeducted > 0 ? invoice.tdsDeductedAmount : null;
  if (
    paidAmount > 0 &&
    unpaidBeforeTds > 0 &&
    effectiveTds > 0 &&
    Math.abs(unpaidBeforeTds - effectiveTds) <= 1.0
  ) {
    effectiveTds = unpaidBeforeTds;
    updatedTdsDeductedAmount = effectiveTds.toFixed(2);
  }

  const isTdsVerified = Boolean(invoice.isTdsVerified);
  const verifiedTds = isTdsVerified ? effectiveTds : 0;

  // Net payable amount represents what client owes after TDS deduction
  const netPayableAmount = Math.max(
    0,
    Number((netBilled - effectiveTds).toFixed(2)),
  );

  // =====================================
  // OUTSTANDING
  // =====================================
  // Total invoice is settled when paidAmount + verifiedTds reaches netBilled
  const remainingDue = Number(
    (netBilled - paidAmount - verifiedTds).toFixed(2),
  );
  // In business accounting, if verified TDS + payments cover the invoice within round-off tolerance (< ₹1.00), invoice is fully settled
  const isSlightRoundoff =
    isTdsVerified && remainingDue <= 0.99 && remainingDue >= -0.99;
  const outstandingAmount = isSlightRoundoff ? 0 : Math.max(0, remainingDue);

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
      paidAmount: paidAmount.toFixed(2),
      outstandingAmount: outstandingAmount.toFixed(2),
      netPayableAmount: netPayableAmount.toFixed(2),
      tdsDeductedAmount: updatedTdsDeductedAmount || effectiveTds.toFixed(2),
      status: invoiceStatus.status,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  return {
    paidAmount,
    outstandingAmount,
    netPayableAmount,
    verifiedTds,
    pendingTds: !isTdsVerified ? effectiveTds : 0,
    status: invoiceStatus.status,
  };
}
