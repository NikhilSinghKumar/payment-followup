import { renderEmailLayout } from "./email-layout";
import {
  renderGreeting,
  renderParagraph,
  renderStatusBanner,
  renderInvoiceSummary,
  renderClientOutstandingInvoices,
  renderClientPaymentSettlementTable,
  renderAlertBox,
  renderButton,
  renderSignature,
  renderBankDetails,
  renderCustomNote,
} from "./email-components";

import { NOTIFICATION_TYPES } from "./notification-types";
import { formatDateDifference } from "@/lib/notifications/date-utils";

const CONFIG = {
  [NOTIFICATION_TYPES.BILL_SUBMITTED]: {
    title: "Invoice Submitted",
    color: "#2563EB",
    background: "#DBEAFE",
    banner: "Invoice Submitted Successfully",
    showPaymentDetails: false,
  },

  [NOTIFICATION_TYPES.DUE_REMINDER]: {
    title: "Payment Reminder",
    color: "#2563EB",
    background: "#DBEAFE",
    banner: "Payment Due Soon",
    showPaymentDetails: true,
  },

  [NOTIFICATION_TYPES.INVOICE_DUE]: {
    title: "Invoice Due Today",
    color: "#EA580C",
    background: "#FED7AA",
    banner: "Payment Due Today",
    showPaymentDetails: true,
  },

  [NOTIFICATION_TYPES.OVERDUE_REMINDER]: {
    title: "Overdue Reminder",
    color: "#2563EB",
    background: "#DBEAFE",
    banner: "Payment Overdue",
    showPaymentDetails: true,
  },

  [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: {
    title: "Payment Received",
    color: "#2563EB",
    background: "#DBEAFE",
    banner: "Payment Received",
    showPaymentDetails: true,
  },

  [NOTIFICATION_TYPES.PAYMENT_CLEARED]: {
    title: "Invoice Paid",
    color: "#2563EB",
    background: "#DBEAFE",
    banner: "Invoice Fully Paid",
    showPaymentDetails: true,
  },

  [NOTIFICATION_TYPES.SERVICE_SUSPENSION_NOTICE]: {
    title: "Service Suspension",
    color: "#2563EB",
    background: "#DBEAFE",
    banner: "Service Suspended",
    showPaymentDetails: true,
  },

  [NOTIFICATION_TYPES.SERVICE_SUSPENSION_ALERT]: {
    title: "Immediate Attention Required",
    color: "#2563EB",
    background: "#DBEAFE",
    banner: "Immediate Action Required",
    showPaymentDetails: true,
  },
};

export function renderEmail({ type, body, variables, actionUrl }) {
  const config = CONFIG[type];

  if (!config) {
    throw new Error(`Unsupported email notification type: ${type}`);
  }

  // ======================================================
  // Client-level payment reminder or payment received settlement
  // ======================================================

  const isClientPaymentReminder =
    type === NOTIFICATION_TYPES.DUE_REMINDER ||
    type === NOTIFICATION_TYPES.OVERDUE_REMINDER;

  const isClientPaymentSettlement =
    type === NOTIFICATION_TYPES.PAYMENT_RECEIVED &&
    Array.isArray(variables.settledInvoices) &&
    variables.settledInvoices.length > 0;

  // ======================================================
  // Invoice Summary / Breakdown
  // ======================================================

  let invoiceSummary = "";
  if (isClientPaymentSettlement) {
    invoiceSummary = renderClientPaymentSettlementTable({
      settledInvoices: variables.settledInvoices,
      paymentInfo: {
        amount: variables.paymentAmount,
        paymentDate: variables.paymentDate,
        method: variables.paymentMethod,
        reference: variables.referenceNumber,
      },
      totalAccountOutstanding: variables.totalAccountOutstanding,
    });
  } else if (isClientPaymentReminder) {
    invoiceSummary = renderClientOutstandingInvoices(variables.invoices);
  } else {
    invoiceSummary = renderInvoiceSummary({
      invoiceNumber: variables.invoiceNumber,
      invoiceDate: variables.invoiceDate,
      dueDate: variables.dueDate,
      invoiceAmount: variables.invoiceAmount,
      paidAmount: variables.paidAmount,
      outstandingAmount: variables.outstandingAmount,
      showPaymentDetails: config.showPaymentDetails,
    });
  }

  // ======================================================
  // Content
  // ======================================================

  const content = `
    ${renderGreeting(variables.clientName)}

    ${renderStatusBanner({
      title: config.banner,
      color: config.color,
      background: config.background,
    })}

    ${renderParagraph(body)}

    ${variables.customNote ? renderCustomNote(variables.customNote, config.color) : ""}

    ${invoiceSummary}

    ${
      type === NOTIFICATION_TYPES.PAYMENT_RECEIVED || isClientPaymentSettlement
        ? `
          <div style="margin-top: 18px; margin-bottom: 20px; line-height: 1.6; color: #334155; font-size: 14px;">
            <p style="margin: 0 0 12px 0;">
              Please review the settlement details and notify the PAFEX Accounts Team of any discrepancy or concern within 2 days of receiving this email. If we do not receive any communication within this period, the settlement will be considered final and recorded in our accounts.
            </p>
            <p style="margin: 0;">
              Thank you for your continued trust and business with PAFEX.
            </p>
          </div>
        `
        : ""
    }

    ${
      !isClientPaymentReminder &&
      !isClientPaymentSettlement &&
      type !== NOTIFICATION_TYPES.PAYMENT_RECEIVED &&
      variables.overdueDays > 0
        ? renderAlertBox(
            `This invoice is overdue by ${formatDateDifference(
              variables.dueDate,
            )}.`,
          )
        : ""
    }

    ${
      type !== NOTIFICATION_TYPES.PAYMENT_RECEIVED && !isClientPaymentSettlement
        ? renderBankDetails(variables.company || {})
        : ""
    }

    ${renderSignature({
      senderCompany: variables.senderCompany,
      senderEmail: variables.senderEmail,
      senderPhone: variables.senderPhone,
      senderLogo: variables.senderLogo,
    })}
  `;

  // ======================================================
  // Email Layout
  // ======================================================

  return renderEmailLayout({
    title: config.title,
    bannerColor: config.color,
    companyName: variables.senderCompany,
    content,
    senderCompany: variables.senderCompany,
    senderEmail: variables.senderEmail,
    senderPhone: variables.senderPhone,
    logoUrl: variables.senderLogo,
  });
}

/**
 * ======================================================
 * Manual Single Invoice Reminder Renderer
 * (Unified with automatic email layout)
 * ======================================================
 */
export function renderManualSingleInvoiceReminderEmail({
  invoice,
  client,
  company = {},
  reminderType = "OVERDUE",
  customNote = "",
}) {
  let title = "Payment Reminder";
  let banner = "Payment Reminder";
  let color = "#2563EB";
  let background = "#DBEAFE";

  switch (reminderType) {
    case "DUE_SOON":
      title = `Payment Due Soon - Invoice #${invoice.invoiceNumber}`;
      banner = "Payment Due Soon";
      color = "#2563EB";
      background = "#DBEAFE";
      break;
    case "DUE_TODAY":
      title = `Payment Due Today - Invoice #${invoice.invoiceNumber}`;
      banner = "Payment Due Today";
      color = "#D97706";
      background = "#FEF3C7";
      break;
    case "FINAL_NOTICE":
      title = `FINAL NOTICE: Overdue Invoice #${invoice.invoiceNumber}`;
      banner = "Final Notice / Credit Action Warning";
      color = "#DC2626";
      background = "#FEE2E2";
      break;
    case "OVERDUE":
    default:
      title = `Overdue Payment Reminder - Invoice #${invoice.invoiceNumber}`;
      banner = invoice.dueDaysText
        ? `Overdue Payment Notice (${invoice.dueDaysText})`
        : "Overdue Payment Notice";
      color = "#EA580C";
      background = "#FFEDD5";
      break;
  }

  const formattedDueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const formattedInvoiceDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const formattedTotal = Number(invoice.invoiceAmount || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
    },
  );
  const formattedPaid = Number(invoice.paidAmount || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
    },
  );
  const formattedDue = Number(
    invoice.due || invoice.outstandingAmount || 0,
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  const bodyParagraph =
    reminderType === "FINAL_NOTICE"
      ? `This is a final notice regarding the outstanding balance of ₹${formattedDue} for invoice <strong>#${invoice.invoiceNumber}</strong>. Please clear this invoice immediately to avoid potential disruption to your dispatch and logistics services.`
      : reminderType === "DUE_TODAY"
        ? `This is a reminder that invoice <strong>#${invoice.invoiceNumber}</strong> for ₹${formattedDue} is due for payment today. Kindly ensure timely settlement.`
        : reminderType === "DUE_SOON"
          ? `This is a friendly reminder that invoice <strong>#${invoice.invoiceNumber}</strong> with a balance due of ₹${formattedDue} is approaching its due date (${formattedDueDate}).`
          : `This is a reminder regarding the outstanding balance of ₹${formattedDue} for invoice <strong>#${invoice.invoiceNumber}</strong> which is currently overdue. Kindly process the payment at your earliest convenience.`;

  const content = `
    ${renderGreeting(client.companyName || client.name || "Valued Customer")}

    ${renderStatusBanner({
      title: banner,
      color,
      background,
    })}

    ${renderParagraph(bodyParagraph)}

    ${renderCustomNote(customNote, color)}

    ${renderInvoiceSummary({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: formattedInvoiceDate,
      dueDate: formattedDueDate,
      invoiceAmount: formattedTotal,
      paidAmount: formattedPaid,
      outstandingAmount: formattedDue,
      showPaymentDetails: true,
      awbs: invoice.awbs || [],
      isOverdue: invoice.isOverdue,
      dueDaysText: invoice.dueDaysText,
    })}

    ${
      invoice.isOverdue && invoice.dueDays >= 1
        ? renderAlertBox(
            `This invoice is past due by <strong>${invoice.dueDays} day(s)</strong>. If you have already initiated the transfer, please share the UTR reference number.`,
          )
        : ""
    }

    ${renderBankDetails(company)}

    <p style="font-size: 13px; color: #64748B; margin: 16px 0 0 0;">
      If you have already processed this transaction, kindly reply with the payment confirmation / UTR details for swift reconciliation.
    </p>

    ${renderSignature({
      senderCompany: company.companyName || "PAFEX Logistics",
      senderEmail: company.email || "",
      senderPhone: company.phone || "",
      senderLogo: company.logoUrl || "",
    })}
  `;

  return renderEmailLayout({
    title,
    bannerColor: color,
    companyName: company.companyName || "PAFEX",
    content,
    senderCompany: company.companyName || "PAFEX",
    senderEmail: company.email || "",
    senderPhone: company.phone || "",
    logoUrl: company.logoUrl || "",
  });
}

/**
 * ======================================================
 * Manual Client Statement Reminder Renderer
 * (Unified with automatic email layout)
 * ======================================================
 */
export function renderManualClientStatementReminderEmail({
  client,
  clientSummary = {},
  invoices = [],
  company = {},
  reminderType = "STATEMENT",
  customNote = "",
}) {
  let title = "Statement of Outstanding Invoices";
  let banner = "Statement of Account";
  let color = "#2563EB";
  let background = "#DBEAFE";

  switch (reminderType) {
    case "SUSPENSION_WARNING":
      title = `URGENT: Outstanding Dues & Service Suspension Warning - ${client.companyName}`;
      banner = "Credit Terms Warning / Final Demand";
      color = "#DC2626";
      background = "#FEE2E2";
      break;
    case "OVERDUE_NOTICE":
      title = `Overdue Statement of Account: ${clientSummary.overdueInvoices || 0} Overdue Invoices - ${client.companyName}`;
      banner = "Overdue Statement Reminder";
      color = "#EA580C";
      background = "#FFEDD5";
      break;
    case "STATEMENT":
    default:
      title = `Statement of Outstanding Invoices (${invoices.length} Invoices) - ${client.companyName}`;
      banner = "Statement of Outstanding Invoices";
      color = "#2563EB";
      background = "#DBEAFE";
      break;
  }

  const formattedTotalOutstanding = Number(
    clientSummary.outstandingAmount || 0,
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });
  const formattedOverdueAmount = Number(
    clientSummary.overdueAmount || 0,
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  const bodyParagraph =
    reminderType === "SUSPENSION_WARNING"
      ? `Please find below the consolidated statement of your outstanding ledger. There are currently <strong>${invoices.length} unpaid invoices</strong> totaling <strong style="color: #DC2626;">₹${formattedTotalOutstanding}</strong>, with <strong>${clientSummary.overdueInvoices || 0} invoice(s) critically overdue</strong>. Please settle these outstanding balances immediately to ensure uninterrupted logistics support.`
      : reminderType === "OVERDUE_NOTICE"
        ? `Please find below your statement of overdue invoices. There are currently <strong>${clientSummary.overdueInvoices || 0} overdue invoice(s)</strong> totaling <strong style="color: #EA580C;">₹${formattedOverdueAmount}</strong> out of total outstanding ₹${formattedTotalOutstanding}. Kindly prioritize clearance of these pending bills.`
        : `Please find below the consolidated statement of your open invoices with ${company.companyName || "our team"}. There are currently <strong>${invoices.length} outstanding invoices</strong> with a total pending balance of <strong style="color: #2563EB;">₹${formattedTotalOutstanding}</strong>.`;

  // Transform invoices into format expected by renderClientOutstandingInvoices
  const mappedInvoices = invoices.map((inv) => ({
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    invoiceAmount: inv.invoiceAmount,
    paidAmount: inv.paidAmount || 0,
    outstandingAmount: inv.due || inv.outstandingAmount || 0,
    agingStatus: inv.isOverdue
      ? `${inv.dueDays}d Overdue`
      : inv.isDueToday
        ? "Due Today"
        : "Current",
    agingColor: inv.isOverdue
      ? "#DC2626"
      : inv.isDueToday
        ? "#D97706"
        : "#16A34A",
    creditDays: inv.creditDays || 0,
  }));

  const content = `
    ${renderGreeting(client.companyName || client.name || "Finance & Accounts Team")}

    ${renderStatusBanner({
      title: banner,
      color,
      background,
    })}

    ${renderParagraph(bodyParagraph)}

    ${
      clientSummary.overdueInvoices > 0
        ? renderAlertBox(
            `⚠️ <strong>Action Required:</strong> ${clientSummary.overdueInvoices} invoice(s) are overdue totaling <strong>₹${formattedOverdueAmount}</strong>.`,
          )
        : ""
    }

    ${renderCustomNote(customNote, color)}

    ${renderClientOutstandingInvoices(mappedInvoices)}

    ${renderBankDetails(company)}

    <p style="font-size: 13px; color: #64748B; margin: 16px 0 0 0;">
      Kindly share payment receipts / UTR details with our accounts team for swift ledger posting.
    </p>

    ${renderSignature({
      senderCompany: company.companyName || "PAFEX Logistics",
      senderEmail: company.email || "",
      senderPhone: company.phone || "",
      senderLogo: company.logoUrl || "",
    })}
  `;

  return renderEmailLayout({
    title,
    bannerColor: color,
    companyName: company.companyName || "PAFEX",
    content,
    senderCompany: company.companyName || "PAFEX",
    senderEmail: company.email || "",
    senderPhone: company.phone || "",
    logoUrl: company.logoUrl || "",
  });
}

/**
 * ======================================================
 * Manual Bulk Invoices Statement Renderer
 * (Unified with automatic email layout)
 * ======================================================
 */
export function renderManualBulkInvoicesReminderEmail({
  client,
  groupInvoices = [],
  company = {},
  reminderType = "STATEMENT",
  customNote = "",
  totalDue = 0,
  overdueCount = 0,
}) {
  let title = "Statement of Outstanding Invoices";
  let banner = "Statement of Account";
  let color = "#2563EB";
  let background = "#DBEAFE";

  switch (reminderType) {
    case "SUSPENSION_WARNING":
      title = `URGENT: Outstanding Dues & Service Suspension Warning - ${client.companyName}`;
      banner = "Credit Terms Warning / Final Demand";
      color = "#DC2626";
      background = "#FEE2E2";
      break;
    case "OVERDUE_NOTICE":
      title = `Overdue Statement of Account: ${overdueCount} Overdue Invoices - ${client.companyName}`;
      banner = "Overdue Statement Reminder";
      color = "#EA580C";
      background = "#FFEDD5";
      break;
    case "STATEMENT":
    default:
      title = `Statement of Outstanding Invoices (${groupInvoices.length} Invoices) - ${client.companyName}`;
      banner = "Statement of Outstanding Invoices";
      color = "#2563EB";
      background = "#DBEAFE";
      break;
  }

  const formattedTotalDue = Number(totalDue || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  const bodyParagraph =
    reminderType === "SUSPENSION_WARNING"
      ? `Please find below the consolidated statement of your outstanding invoices. There are currently <strong>${groupInvoices.length} pending invoices</strong> totaling <strong style="color: #DC2626;">₹${formattedTotalDue}</strong>. Kindly arrange immediate settlement to prevent any pause in service.`
      : overdueCount > 0
        ? `Please find below your statement of open invoices. There are currently <strong>${groupInvoices.length} pending invoices</strong> totaling <strong style="color: #2563EB;">₹${formattedTotalDue}</strong>. Kindly arrange payment at your earliest convenience to avoid temporary suspension of PAFEX services.`
        : `Please find below your statement of open invoices. There are currently <strong>${groupInvoices.length} pending invoices</strong> totaling <strong style="color: #2563EB;">₹${formattedTotalDue}</strong>.`;

  const mappedInvoices = groupInvoices.map((inv) => ({
    invoiceNumber: inv.invoiceNumber,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    invoiceAmount: inv.invoiceAmount,
    paidAmount: inv.paidAmount || 0,
    outstandingAmount: inv.due || inv.outstandingAmount || 0,
    agingStatus: inv.isOverdue ? `${inv.dueDays || 0}d Overdue` : "Current",
    agingColor: inv.isOverdue ? "#DC2626" : "#16A34A",
    creditDays: inv.creditDays || 0,
  }));

  const content = `
    ${renderGreeting(client.companyName || client.name || "Finance & Accounts Team")}

    ${renderStatusBanner({
      title: banner,
      color,
      background,
    })}

    ${renderParagraph(bodyParagraph)}

    ${
      overdueCount > 0
        ? renderAlertBox(
            `⚠️ <strong>${overdueCount} of these invoice(s) are past due</strong>. Please prioritize settlement.`,
          )
        : ""
    }

    ${renderCustomNote(customNote, color)}

    ${renderClientOutstandingInvoices(mappedInvoices)}

    ${renderBankDetails(company)}

    <p style="font-size: 13px; color: #64748B; margin: 16px 0 0 0;">
      Kindly share transaction details / UTR number once payment is initiated.
    </p>

    ${renderSignature({
      senderCompany: company.companyName || "PAFEX Logistics",
      senderEmail: company.email || "",
      senderPhone: company.phone || "",
      senderLogo: company.logoUrl || "",
    })}
  `;

  return renderEmailLayout({
    title,
    bannerColor: color,
    companyName: company.companyName || "PAFEX",
    content,
    senderCompany: company.companyName || "PAFEX",
    senderEmail: company.email || "",
    senderPhone: company.phone || "",
    logoUrl: company.logoUrl || "",
  });
}
