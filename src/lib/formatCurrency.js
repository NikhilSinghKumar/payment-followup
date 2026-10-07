/**
 * Formats a numeric value or string to Indian Currency format with exactly 2 decimal places.
 * Example: 4310 -> "₹4,310.00", 616.6 -> "₹616.60", 0 -> "₹0.00"
 */
export function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a numeric value or string with Indian numbering system and exactly 2 decimal places (without currency symbol).
 * Example: 4310 -> "4,310.00", 616.6 -> "616.60", 0 -> "0.00"
 */
export function formatAmount(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
