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

  let year, month;

  // Handle direct string YYYY-MM-DD
  if (typeof date === "string" && /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(date)) {
    const parts = date.split(/[-/.]/);
    year = Number(parts[0]);
    month = Number(parts[1]);
  } else {
    const invoiceDate = date instanceof Date ? date : new Date(date);
    if (isNaN(invoiceDate.getTime())) {
      throw new Error("Invalid invoice date.");
    }

    try {
      const localStr = invoiceDate.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      const parts = localStr.split("-");
      year = Number(parts[0]);
      month = Number(parts[1]);
    } catch {
      year = invoiceDate.getUTCFullYear();
      month = invoiceDate.getUTCMonth() + 1;
    }
  }

  if (month >= startMonth) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }

  return `${year - 1}-${String(year).slice(-2)}`;
}
