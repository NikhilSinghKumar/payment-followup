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

  return {
    ...invoice,
    creditDays,

    ...calculateInvoiceStatus({
      netPayable: invoice.netPayableAmount,
      paid: invoice.paidAmount ?? invoice.paid ?? 0,
      dueDate: invoice.dueDate,
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
