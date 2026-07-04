import { calculateInvoiceStatus } from "@/lib/invoice-status";

/**
 * Enrich a single invoice with calculated payment summary.
 *
 * @param {Object} invoice
 * @returns {Object}
 */
export function enrichInvoice(invoice) {
  return {
    ...invoice,

    ...calculateInvoiceStatus({
      netPayable: invoice.netPayableAmount,
      paid: invoice.paid,
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
