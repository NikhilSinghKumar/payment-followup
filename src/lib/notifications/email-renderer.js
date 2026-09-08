import React from "react";
import { EmailLayout } from "./email-layout";
import {
  Greeting,
  Paragraph,
  StatusBanner,
  InvoiceSummary,
  ClientOutstandingInvoices,
  ClientPaymentSettlementTable,
  AlertBox,
  EmailButton,
  Signature,
  CustomNote,
} from "./email-components";

import { NOTIFICATION_TYPES } from "./notification-types";
import { formatDateDifference } from "@/lib/notifications/date-utils";

function renderToStaticMarkup(element) {
  try {
    // Dynamic require avoids Turbopack/Next.js client/RSC static import restrictions
    const req =
      typeof __non_webpack_require__ !== "undefined"
        ? __non_webpack_require__
        : eval("require");
    const server = req("react-dom/server");
    return server.renderToStaticMarkup(element);
  } catch (err) {
    console.error("Failed to render email markup:", err);
    return "";
  }
}

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

/**
 * ======================================================
 * Notification Email Template (React JSX Component)
 * ======================================================
 */
export function NotificationEmailTemplate({
  type,
  body,
  variables = {},
  actionUrl,
}) {
  const config = CONFIG[type];

  if (!config) {
    throw new Error(`Unsupported email notification type: ${type}`);
  }

  const isClientPaymentReminder =
    type === NOTIFICATION_TYPES.DUE_REMINDER ||
    type === NOTIFICATION_TYPES.OVERDUE_REMINDER;

  const isClientPaymentSettlement =
    type === NOTIFICATION_TYPES.PAYMENT_RECEIVED &&
    Array.isArray(variables.settledInvoices) &&
    variables.settledInvoices.length > 0;

  // Overdue calculation
  let overdueAlert = null;
  if (
    type !== NOTIFICATION_TYPES.BILL_SUBMITTED &&
    type !== NOTIFICATION_TYPES.SERVICE_SUSPENSION_ALERT &&
    type !== NOTIFICATION_TYPES.SERVICE_SUSPENSION_NOTICE &&
    type !== NOTIFICATION_TYPES.PAYMENT_RECEIVED &&
    type !== NOTIFICATION_TYPES.PAYMENT_CLEARED &&
    type !== NOTIFICATION_TYPES.DUE_REMINDER &&
    type !== NOTIFICATION_TYPES.INVOICE_DUE &&
    type !== "DUE_TODAY" &&
    type !== "INTERNAL_DUE_TODAY" &&
    !isClientPaymentReminder &&
    !isClientPaymentSettlement
  ) {
    const overdueDays = Number(variables.overdueDays) || 0;
    if (overdueDays > 0 && variables.dueDate) {
      const diff = formatDateDifference(variables.dueDate);
      if (diff && diff !== "0 days") {
        overdueAlert = `This invoice is overdue by ${diff}.`;
      }
    }
  }

  return (
    <EmailLayout
      title={config.title}
      bannerColor={config.color}
      companyName={variables.senderCompany}
      senderCompany={variables.senderCompany}
      senderEmail={variables.senderEmail}
      senderPhone={variables.senderPhone}
      logoUrl={variables.senderLogo}
    >
      <Greeting clientName={variables.clientName} />

      <StatusBanner
        title={config.banner}
        color={config.color}
        background={config.background}
      />

      <Paragraph text={body} />

      {variables.customNote && (
        <CustomNote note={variables.customNote} color={config.color} />
      )}

      {/* Invoice Summary / Settlement Breakdown */}
      {isClientPaymentSettlement ? (
        <ClientPaymentSettlementTable
          settledInvoices={variables.settledInvoices}
          paymentInfo={{
            amount: variables.paymentAmount,
            paymentDate: variables.paymentDate,
            method: variables.paymentMethod,
            reference: variables.referenceNumber,
          }}
          totalAccountOutstanding={variables.totalAccountOutstanding}
        />
      ) : isClientPaymentReminder ? (
        <ClientOutstandingInvoices invoices={variables.invoices} />
      ) : (
        <InvoiceSummary
          invoiceNumber={variables.invoiceNumber}
          invoiceDate={variables.invoiceDate}
          dueDate={variables.dueDate}
          invoiceAmount={variables.invoiceAmount}
          paidAmount={variables.paidAmount}
          outstandingAmount={variables.outstandingAmount}
          showPaymentDetails={config.showPaymentDetails}
        />
      )}

      {/* Settlement Discrepancy Notice */}
      {(type === NOTIFICATION_TYPES.PAYMENT_RECEIVED ||
        isClientPaymentSettlement) && (
        <div
          style={{
            marginTop: "18px",
            marginBottom: "20px",
            lineHeight: 1.6,
            color: "#334155",
            fontSize: "14px",
          }}
        >
          <p style={{ margin: "0 0 12px 0" }}>
            Please review the settlement details and notify the PAFEX Accounts
            Team of any discrepancy or concern within 2 days of receiving this
            email. If we do not receive any communication within this period,
            the settlement will be considered final and recorded in our
            accounts.
          </p>
          <p style={{ margin: 0 }}>
            Thank you for your continued trust and business with PAFEX.
          </p>
        </div>
      )}

      {overdueAlert && <AlertBox message={overdueAlert} />}

      {actionUrl && <EmailButton text="View Details" url={actionUrl} />}

      <Signature
        senderCompany={variables.senderCompany}
        senderEmail={variables.senderEmail}
        senderPhone={variables.senderPhone}
        senderLogo={variables.senderLogo}
      />
    </EmailLayout>
  );
}

export function renderEmail(props) {
  const markup = renderToStaticMarkup(<NotificationEmailTemplate {...props} />);
  return `<!DOCTYPE html>\n${markup}`;
}

/**
 * ======================================================
 * Single Invoice Reminder Template (React JSX Component)
 * ======================================================
 */
export function SingleInvoiceReminderTemplate({
  invoice,
  client = {},
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
      ? `This is a final notice regarding the outstanding balance of ₹${formattedDue} for invoice #${invoice.invoiceNumber}. Please clear this invoice immediately to avoid potential disruption to your dispatch and logistics services.`
      : reminderType === "DUE_TODAY"
        ? `This is a reminder that invoice #${invoice.invoiceNumber} for ₹${formattedDue} is due for payment today. Kindly ensure timely settlement.`
        : reminderType === "DUE_SOON"
          ? `This is a friendly reminder that invoice #${invoice.invoiceNumber} with a balance due of ₹${formattedDue} is approaching its due date (${formattedDueDate}).`
          : `This is a reminder regarding the outstanding balance of ₹${formattedDue} for invoice #${invoice.invoiceNumber} which is currently overdue. Kindly process the payment at your earliest convenience.`;

  return (
    <EmailLayout
      title={title}
      bannerColor={color}
      companyName={company.companyName || "PAFEX"}
      senderCompany={company.companyName || "PAFEX"}
      senderEmail={company.email || ""}
      senderPhone={company.phone || ""}
      logoUrl={company.logoUrl || ""}
    >
      <Greeting
        clientName={client.companyName || client.name || "Valued Customer"}
      />

      <StatusBanner title={banner} color={color} background={background} />

      <Paragraph text={bodyParagraph} />

      {customNote && <CustomNote note={customNote} color={color} />}

      <InvoiceSummary
        invoiceNumber={invoice.invoiceNumber}
        invoiceDate={formattedInvoiceDate}
        dueDate={formattedDueDate}
        invoiceAmount={formattedTotal}
        paidAmount={formattedPaid}
        outstandingAmount={formattedDue}
        showPaymentDetails={true}
        awbs={invoice.awbs || []}
        isOverdue={invoice.isOverdue}
        dueDaysText={invoice.dueDaysText}
      />

      {invoice.isOverdue && invoice.dueDays >= 1 && (
        <AlertBox
          message={`This invoice is past due by <strong>${invoice.dueDays} day(s)</strong>. If you have already initiated the transfer, please share the UTR reference number.`}
        />
      )}

      <p style={{ fontSize: "13px", color: "#64748B", margin: "16px 0 0 0" }}>
        If you have already processed this transaction, kindly reply with the
        payment confirmation / UTR details for swift reconciliation.
      </p>

      <Signature
        senderCompany={company.companyName || "PAFEX Logistics"}
        senderEmail={company.email || ""}
        senderPhone={company.phone || ""}
        senderLogo={company.logoUrl || ""}
      />
    </EmailLayout>
  );
}

export function renderManualSingleInvoiceReminderEmail(props) {
  const markup = renderToStaticMarkup(
    <SingleInvoiceReminderTemplate {...props} />,
  );
  return `<!DOCTYPE html>\n${markup}`;
}

/**
 * ======================================================
 * Client Statement Reminder Template (React JSX Component)
 * ======================================================
 */
export function ClientStatementReminderTemplate({
  client = {},
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
      banner = "Overdue Statement Notice";
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
      ? `Please find below the consolidated statement of your outstanding ledger. There are currently ${invoices.length} unpaid invoices totaling ₹${formattedTotalOutstanding}, with ${clientSummary.overdueInvoices || 0} invoice(s) critically overdue. Please settle these outstanding balances immediately to ensure uninterrupted logistics support.`
      : reminderType === "OVERDUE_NOTICE"
        ? `Please find below your statement of overdue invoices. There are currently ${clientSummary.overdueInvoices || 0} overdue invoice(s) totaling ₹${formattedOverdueAmount} out of total outstanding ₹${formattedTotalOutstanding}. Kindly prioritize clearance of these pending bills.`
        : `Please find below the consolidated statement of your open invoices with ${company.companyName || "our team"}. There are currently ${invoices.length} outstanding invoices with a total pending balance of ₹${formattedTotalOutstanding}.`;

  const mappedInvoices = invoices.map((inv) => {
    let creditDays = Number(inv.creditDays || 0);
    if (!creditDays && inv.invoiceDate && inv.dueDate) {
      const invD = new Date(inv.invoiceDate);
      const dueD = new Date(inv.dueDate);
      invD.setHours(0, 0, 0, 0);
      dueD.setHours(0, 0, 0, 0);
      creditDays = Math.max(
        0,
        Math.round((dueD.getTime() - invD.getTime()) / (1000 * 60 * 60 * 24)),
      );
    }

    return {
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
      creditDays,
    };
  });

  return (
    <EmailLayout
      title={title}
      bannerColor={color}
      companyName={company.companyName || "PAFEX"}
      senderCompany={company.companyName || "PAFEX"}
      senderEmail={company.email || ""}
      senderPhone={company.phone || ""}
      logoUrl={company.logoUrl || ""}
    >
      <Greeting
        clientName={
          client.companyName || client.name || "Finance & Accounts Team"
        }
      />

      <StatusBanner title={banner} color={color} background={background} />

      <Paragraph text={bodyParagraph} />

      {clientSummary.overdueInvoices > 0 && (
        <AlertBox
          message={`⚠️ <strong>Action Required:</strong> ${clientSummary.overdueInvoices} invoice(s) are overdue totaling <strong>₹${formattedOverdueAmount}</strong>.`}
        />
      )}

      {customNote && <CustomNote note={customNote} color={color} />}

      <ClientOutstandingInvoices invoices={mappedInvoices} />

      <p style={{ fontSize: "13px", color: "#64748B", margin: "16px 0 0 0" }}>
        Kindly share payment receipts / UTR details with our accounts team for
        swift ledger posting.
      </p>

      <Signature
        senderCompany={company.companyName || "PAFEX Logistics"}
        senderEmail={company.email || ""}
        senderPhone={company.phone || ""}
        senderLogo={company.logoUrl || ""}
      />
    </EmailLayout>
  );
}

export function renderManualClientStatementReminderEmail(props) {
  const markup = renderToStaticMarkup(
    <ClientStatementReminderTemplate {...props} />,
  );
  return `<!DOCTYPE html>\n${markup}`;
}

/**
 * ======================================================
 * Bulk Invoices Statement Reminder Template (React JSX Component)
 * ======================================================
 */
export function BulkInvoicesReminderTemplate({
  client = {},
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
      banner = "Overdue Statement Notice";
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
      ? `Please find below the consolidated statement of your outstanding invoices. There are currently ${groupInvoices.length} pending invoices totaling ₹${formattedTotalDue}. Kindly arrange immediate settlement to prevent any pause in service.`
      : overdueCount > 0
        ? `Please find below your statement of open invoices. There are currently ${groupInvoices.length} pending invoices totaling ₹${formattedTotalDue} (${overdueCount} invoices past due). Kindly arrange payment at your earliest convenience.`
        : `Please find below your statement of open invoices. There are currently ${groupInvoices.length} pending invoices totaling ₹${formattedTotalDue}.`;

  const mappedInvoices = groupInvoices.map((inv) => {
    let creditDays = Number(inv.creditDays || 0);
    if (!creditDays && inv.invoiceDate && inv.dueDate) {
      const invD = new Date(inv.invoiceDate);
      const dueD = new Date(inv.dueDate);
      invD.setHours(0, 0, 0, 0);
      dueD.setHours(0, 0, 0, 0);
      creditDays = Math.max(
        0,
        Math.round((dueD.getTime() - invD.getTime()) / (1000 * 60 * 60 * 24)),
      );
    }

    return {
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      invoiceAmount: inv.invoiceAmount,
      paidAmount: inv.paidAmount || 0,
      outstandingAmount: inv.due || inv.outstandingAmount || 0,
      agingStatus: inv.isOverdue ? `${inv.dueDays || 0}d Overdue` : "Current",
      agingColor: inv.isOverdue ? "#DC2626" : "#16A34A",
      creditDays,
    };
  });

  return (
    <EmailLayout
      title={title}
      bannerColor={color}
      companyName={company.companyName || "PAFEX"}
      senderCompany={company.companyName || "PAFEX"}
      senderEmail={company.email || ""}
      senderPhone={company.phone || ""}
      logoUrl={company.logoUrl || ""}
    >
      <Greeting
        clientName={
          client.companyName || client.name || "Finance & Accounts Team"
        }
      />

      <StatusBanner title={banner} color={color} background={background} />

      <Paragraph text={bodyParagraph} />

      {overdueCount > 0 && (
        <AlertBox
          message={`⚠️ <strong>${overdueCount} of these invoice(s) are past due</strong>. Please prioritize settlement.`}
        />
      )}

      {customNote && <CustomNote note={customNote} color={color} />}

      <ClientOutstandingInvoices invoices={mappedInvoices} />

      <p style={{ fontSize: "13px", color: "#64748B", margin: "16px 0 0 0" }}>
        Kindly share transaction details / UTR number once payment is initiated.
      </p>

      <Signature
        senderCompany={company.companyName || "PAFEX Logistics"}
        senderEmail={company.email || ""}
        senderPhone={company.phone || ""}
        senderLogo={company.logoUrl || ""}
      />
    </EmailLayout>
  );
}

export function renderManualBulkInvoicesReminderEmail(props) {
  const markup = renderToStaticMarkup(
    <BulkInvoicesReminderTemplate {...props} />,
  );
  return `<!DOCTYPE html>\n${markup}`;
}

export function renderEmailLayout(props) {
  const markup = renderToStaticMarkup(<EmailLayout {...props} />);
  return `<!DOCTYPE html>\n${markup}`;
}

export function renderSignature(props) {
  return renderToStaticMarkup(<Signature {...props} />);
}
