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

  // =====================================
  // PAYMENT STATE
  // =====================================

  const isPaid = due <= 0;
  const isPartial = paid > 0 && due > 0;

  // =====================================
  // AGING
  // =====================================

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dueDays = 0;
  let dueDaysText = "";

  // Only active outstanding invoices should age

  if (!isPaid && dueDate) {
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(0, 0, 0, 0);

    dueDays = Math.floor((today - dueDateObj) / (1000 * 60 * 60 * 24));

    if (dueDays > 0) {
      dueDaysText = `${dueDays} day${dueDays > 1 ? "s" : ""} overdue`;
    } else if (dueDays < 0) {
      const daysRemaining = Math.abs(dueDays);

      dueDaysText = `Due in ${daysRemaining} day${
        daysRemaining > 1 ? "s" : ""
      }`;
    } else {
      dueDaysText = "Due today";
    }
  }

  // =====================================
  // FLAGS
  // =====================================

  const DUE_REMINDER_DAYS = 7;
  const SERVICE_SUSPENSION_DAYS = 10;

  // NOW calculate flags
  const isPending = paid === 0 && due > 0 && dueDays <= 0;

  const isDueToday = due > 0 && dueDays === 0;
  const isDueSoon = due > 0 && dueDays === -DUE_REMINDER_DAYS;
  const isOverdue = due > 0 && dueDays > 0;

  const shouldBlockClient = due > 0 && dueDays >= SERVICE_SUSPENSION_DAYS;

  // =====================================
  // STATUS
  // =====================================

  let status = "pending";

  if (isPaid) {
    status = "paid";
  } else if (isPartial) {
    status = "partial";
  } else if (isOverdue) {
    status = "overdue";
  }

  return {
    paid,
    due,

    dueDays,
    dueDaysText,

    status,

    isOverdue,

    isPaid,
    isPartial,
    isPending,

    isDueToday,
    isDueSoon,

    shouldBlockClient,
  };
}
