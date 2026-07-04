/**
 * Returns the Financial Year from a date.
 *
 * Examples:
 * 15-Mar-2026 -> 2025-26
 * 01-Apr-2026 -> 2026-27
 * 31-Dec-2026 -> 2026-27
 *
 * @param {Date | string} date
 * @param {number} startMonth - Financial year start month (Default: April = 4)
 * @returns {string}
 */
export function getFinancialYear(date, startMonth = 4) {
  if (!date) {
    throw new Error("Invoice date is required.");
  }

  const invoiceDate = new Date(date);

  if (isNaN(invoiceDate.getTime())) {
    throw new Error("Invalid invoice date.");
  }

  const year = invoiceDate.getFullYear();
  const month = invoiceDate.getMonth() + 1;

  if (month >= startMonth) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
}
