/**
 * Returns calendar difference between two dates.
 *
 * Example:
 * Due: 2025-02-15
 * Today: 2026-07-30
 *
 * => 1 year 5 months 15 days
 */
export function formatDateDifference(fromDate, toDate = new Date()) {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (start >= end) {
    return "0 days";
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  // Borrow days from previous month
  if (days < 0) {
    months--;

    const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0);

    days += previousMonth.getDate();
  }

  // Borrow months from previous year
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];

  if (years) parts.push(`${years} year${years > 1 ? "s" : ""}`);

  if (months) parts.push(`${months} month${months > 1 ? "s" : ""}`);

  if (days || parts.length === 0)
    parts.push(`${days} day${days > 1 ? "s" : ""}`);

  return parts.join(" ");
}
