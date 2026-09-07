export const AVAILABLE_VARIABLES = [
  {
    tag: "{{clientName}}",
    label: "Client Name",
    desc: "Name of the client / customer",
  },
  {
    tag: "{{invoiceNumber}}",
    label: "Invoice #",
    desc: "Invoice Number (e.g. INV-2026-0842)",
  },
  { tag: "{{dueDate}}", label: "Due Date", desc: "Invoice payment due date" },
  { tag: "{{invoiceDate}}", label: "Invoice Date", desc: "Invoice issue date" },
  {
    tag: "{{outstandingAmount}}",
    label: "Outstanding Due",
    desc: "Remaining balance amount",
  },
  {
    tag: "{{invoiceAmount}}",
    label: "Invoice Total",
    desc: "Total invoice billing amount",
  },
  { tag: "{{amount}}", label: "Amount", desc: "Payment amount (for receipts)" },
  { tag: "{{count}}", label: "Count", desc: "Number of invoices settled" },
  { tag: "{{overdueDays}}", label: "Overdue Days", desc: "Days past due date" },
  {
    tag: "{{companyName}}",
    label: "Company Name",
    desc: "Sender company name",
  },
];

export const TEMPLATE_DESCRIPTIONS = {
  BILL_SUBMITTED:
    "Sent when an invoice is submitted and shared with a client for review and payment.",
  DUE_REMINDER:
    "Friendly automated reminder dispatched prior to the invoice payment due date.",
  DUE_TODAY:
    "Reminder dispatched to the client on the exact date an invoice payment is due.",
  OVERDUE_REMINDER:
    "Notice sent when one or more invoices cross their credit due date without settlement.",
  PAYMENT_RECEIVED:
    "Confirmation receipt and settlement breakdown sent after client payments are recorded.",
  PAYMENT_CLEARED:
    "Notification confirming an invoice has been completely settled with zero remaining balance.",
  SERVICE_SUSPENSION_NOTICE:
    "Critical demand letter informing client of impending or active service suspension.",
  SERVICE_SUSPENSION_ALERT:
    "Immediate action alert warning of chronic overdue status and credit breach.",
  INTERNAL_DUE_TODAY:
    "Internal team alert reminding accounts staff of client bills maturing today.",
};
