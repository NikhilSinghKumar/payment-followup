/**
 * Build client level summary from enriched invoices.
 *
 * @param {Array<Object>} invoices
 * @returns {Object}
 */
export function calculateClientSummary(invoices) {
  return {
    totalInvoices: invoices.length,

    outstandingAmount: invoices.reduce(
      (sum, inv) => sum + Number(inv.due || 0),
      0,
    ),

    overdueAmount: invoices.reduce(
      (sum, inv) => (inv.isOverdue ? sum + Number(inv.due || 0) : sum),
      0,
    ),

    overdueInvoices: invoices.filter((inv) => inv.isOverdue).length,
  };
}
