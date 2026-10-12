import { calculateInvoiceStatus } from "@/lib/invoice-status";

/**
 * Enrich a single invoice with calculated payment summary.
 *
 * @param {Object} invoice
 * @returns {Object}
 */
export function enrichInvoice(invoice) {
  let creditDays = 0;
  if (invoice?.invoiceDate && invoice?.dueDate) {
    const start = new Date(invoice.invoiceDate);
    const end = new Date(invoice.dueDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    creditDays = Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }

  const tdsDeducted = Number(
    invoice?.tdsDeductedAmount !== undefined &&
      invoice?.tdsDeductedAmount !== null &&
      Number(invoice?.tdsDeductedAmount) > 0
      ? invoice.tdsDeductedAmount
      : invoice?.tdsAmount || 0,
  );
  const isTdsVerified = Boolean(invoice?.isTdsVerified);
  const verifiedTds = isTdsVerified ? tdsDeducted : 0;
  const pendingTds = !isTdsVerified ? tdsDeducted : 0;

  const grossInvoiceAmount = Number(
    invoice?.invoiceAmount ?? invoice?.netPayableAmount ?? 0,
  );
  const deductions =
    Number(invoice?.deductionAmount || 0) + Number(invoice?.otherCharges || 0);
  const netBilled = Math.max(0, grossInvoiceAmount - deductions);
  const paid = Number(invoice?.paidAmount ?? invoice?.paid ?? 0);

  return {
    ...invoice,
    creditDays,
    tdsDeducted,
    isTdsVerified,
    verifiedTds,
    pendingTds,

    ...calculateInvoiceStatus({
      netPayable: netBilled,
      paid,
      verifiedTds,
      dueDate: invoice?.dueDate,
    }),
  };
}

/**
 * Enrich multiple invoices.
 *
 * @param {Array<Object>} invoices
 * @returns {Array<Object>}
 */
export function enrichInvoices(invoices) {
  return invoices.map(enrichInvoice);
}
