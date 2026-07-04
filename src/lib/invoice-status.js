/**
 * Calculates invoice payment summary and status.
 *
 * @param {Object} params
 * @param {number|string} params.netPayable
 * @param {number|string} params.paid
 * @param {Date|string|null} params.dueDate
 *
 * @returns {{
 *   paid: number,
 *   due: number,
 *   dueDays: number,
 *   dueDaysText: string,
 *   status: "pending" | "partial" | "paid" | "overdue"
 * }}
 */
export function calculateInvoiceStatus({ netPayable, paid, dueDate }) {
  netPayable = Number(netPayable || 0);
  paid = Number(paid || 0);

  // Prevent negative due because of over-payment
  const due = Math.max(0, Number((netPayable - paid).toFixed(2)));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dueDays = 0;
  let dueDaysText = "";

  if (dueDate) {
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(0, 0, 0, 0);

    dueDays = Math.floor((today - dueDateObj) / (1000 * 60 * 60 * 24));

    if (dueDays > 0) {
      dueDaysText = `${dueDays} day${dueDays > 1 ? "s" : ""} overdue`;
    } else if (dueDays < 0) {
      dueDaysText = `Due in ${Math.abs(dueDays)} day${Math.abs(dueDays) > 1 ? "s" : ""}`;
    } else {
      dueDaysText = "Due today";
    }
  }

  let status = "pending";

  if (due <= 0) {
    status = "paid";
  } else if (paid > 0) {
    status = dueDays > 0 ? "overdue" : "partial";
  } else {
    status = dueDays > 0 ? "overdue" : "pending";
  }

  const isOverdue = due > 0 && dueDays > 0;

  return {
    paid,
    due,
    dueDays,
    dueDaysText,
    status,
    isOverdue,
  };
}
