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
  formatDate,
} from "./email-components";

import { NOTIFICATION_TYPES } from "./notification-types";

// ============================================================================
// Static HTML Markup Renderer (Server-Side)
// ============================================================================

function renderToStaticMarkup(element) {
  try {
    const req =
      typeof __non_webpack_require__ !== "undefined"
        ? __non_webpack_require__
        : eval("require");
    const server = req("react-dom/server");
    return server.renderToStaticMarkup(element);
  } catch (err) {
    console.error("[Email Renderer] Failed to render email markup:", err);
    return "";
  }
}

// ============================================================================
// TEMPLATE 1: Single Invoice Email Template (Data Shape: Single Invoice)
// ============================================================================
// Handles:
// - Bill Submitted / Invoice Issued (SUBMITTED / BILL_SUBMITTED)
// - Upcoming Due Date Reminder (DUE_SOON / DUE_REMINDER)
// - Invoice Due Today (DUE_TODAY / INVOICE_DUE)
// - Overdue Payment Notice (OVERDUE / OVERDUE_REMINDER)
// - Final Demand Notice (FINAL_NOTICE / FINAL_REMINDER)
// - Invoice Paid / Cleared (PAID / PAYMENT_CLEARED)
// ============================================================================

export function SingleInvoiceEmailTemplate({
  invoice = {},
  client = {},
  company = {},
  reminderType = "OVERDUE",
  urgency = null,
  type = null,
  customNote = "",
  body = "",
  actionUrl = "",
}) {
  const normalizedType = String(
    urgency || reminderType || type || "OVERDUE",
  ).toUpperCase();

  let title = "Payment Reminder";
  let banner = "Payment Reminder";
  let color = "#2563EB";
  let background = "#DBEAFE";

  if (normalizedType === "BILL_SUBMITTED" || normalizedType === "SUBMITTED") {
    title = `Invoice #${invoice.invoiceNumber || ""} Issued`;
    banner = "Invoice Submitted Successfully";
    color = "#2563EB";
    background = "#DBEAFE";
  } else if (
    normalizedType === "DUE_SOON" ||
    normalizedType === "DUE_REMINDER"
  ) {
    title = `Payment Due Soon - Invoice #${invoice.invoiceNumber || ""}`;
    banner = "Payment Due Soon";
    color = "#2563EB";
    background = "#DBEAFE";
  } else if (
    normalizedType === "DUE_TODAY" ||
    normalizedType === "INVOICE_DUE"
  ) {
    title = `Payment Due Today - Invoice #${invoice.invoiceNumber || ""}`;
    banner = "Payment Due Today";
    color = "#D97706";
    background = "#FEF3C7";
  } else if (
    normalizedType === "FINAL_NOTICE" ||
    normalizedType === "FINAL_REMINDER"
  ) {
    title = `FINAL NOTICE: Overdue Invoice #${invoice.invoiceNumber || ""}`;
    banner = "Final Notice / Credit Action Warning";
    color = "#DC2626";
    background = "#FEE2E2";
  } else if (
    normalizedType === "PAID" ||
    normalizedType === "PAYMENT_CLEARED"
  ) {
    title = `Invoice #${invoice.invoiceNumber || ""} Paid`;
    banner = "Invoice Fully Paid";
    color = "#16A34A";
    background = "#DCFCE7";
  } else {
    // OVERDUE or default
    title = `Overdue Payment Reminder - Invoice #${invoice.invoiceNumber || ""}`;
    banner = invoice.dueDaysText
      ? `Overdue Payment Notice (${invoice.dueDaysText})`
      : "Overdue Payment Notice";
    color = "#EA580C";
    background = "#FFEDD5";
  }

  const formattedDueDate = formatDate(invoice.dueDate);
  const formattedInvoiceDate = formatDate(invoice.invoiceDate);

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
  const dueAmt =
    invoice.due !== undefined
      ? invoice.due
      : invoice.outstandingAmount !== undefined
        ? invoice.outstandingAmount
        : Math.max(
            Number(invoice.invoiceAmount || 0) -
              Number(invoice.paidAmount || 0),
            0,
          );

  const formattedDue = Number(dueAmt || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  const clientDisplayName =
    client.companyName || client.name || "Valued Customer";
  const companyDisplayName = company.companyName || "PAFEX Logistics";

  const defaultBody =
    normalizedType === "FINAL_NOTICE" || normalizedType === "FINAL_REMINDER"
      ? `This is a final notice regarding the outstanding balance of ₹${formattedDue} for invoice #${invoice.invoiceNumber}. Please clear this invoice immediately to avoid potential disruption to your dispatch and logistics services.`
      : normalizedType === "DUE_TODAY" || normalizedType === "INVOICE_DUE"
        ? `This is a reminder that invoice #${invoice.invoiceNumber} for ₹${formattedDue} is due for payment today. Kindly ensure timely settlement.`
        : normalizedType === "DUE_SOON" || normalizedType === "DUE_REMINDER"
          ? `This is a friendly reminder that invoice #${invoice.invoiceNumber} with a balance due of ₹${formattedDue} is approaching its due date (${formattedDueDate}).`
          : normalizedType === "BILL_SUBMITTED" ||
              normalizedType === "SUBMITTED"
            ? `Please find attached your invoice #${invoice.invoiceNumber} dated ${formattedInvoiceDate} for ₹${formattedTotal}. Kindly arrange for settlement on or before ${formattedDueDate}.`
            : normalizedType === "PAID" || normalizedType === "PAYMENT_CLEARED"
              ? `Thank you for your payment. Invoice #${invoice.invoiceNumber} has been fully settled and recorded in our accounts.`
              : `This is a reminder regarding the outstanding balance of ₹${formattedDue} for invoice #${invoice.invoiceNumber} which is currently overdue. Kindly process the payment at your earliest convenience.`;

  const paragraphText = body || defaultBody;
  const isPaidOrCleared =
    normalizedType === "PAID" || normalizedType === "PAYMENT_CLEARED";

  return (
    <EmailLayout
      title={title}
      bannerColor={color}
      companyName={companyDisplayName}
      senderCompany={companyDisplayName}
      senderEmail={company.email || ""}
      senderPhone={company.phone || ""}
      logoUrl={company.logoUrl || company.logo || ""}
    >
      <Greeting clientName={clientDisplayName} />

      <StatusBanner title={banner} color={color} background={background} />

      <Paragraph text={paragraphText} />

      {customNote && <CustomNote note={customNote} color={color} />}

      <InvoiceSummary
        invoiceNumber={invoice.invoiceNumber}
        invoiceDate={formattedInvoiceDate}
        dueDate={formattedDueDate}
        invoiceAmount={formattedTotal}
        paidAmount={formattedPaid}
        outstandingAmount={formattedDue}
        showPaymentDetails={!isPaidOrCleared}
        awbs={invoice.awbs || []}
        isOverdue={invoice.isOverdue}
        dueDaysText={invoice.dueDaysText}
      />

      {invoice.isOverdue && invoice.dueDays >= 1 && (
        <AlertBox
          message={`This invoice is past due by <strong>${invoice.dueDays} day(s)</strong>. If you have already initiated the transfer, please share the UTR reference number.`}
        />
      )}

      {actionUrl && <EmailButton text="View Invoice Online" url={actionUrl} />}

      {!isPaidOrCleared && (
        <p style={{ fontSize: "13px", color: "#64748B", margin: "16px 0 0 0" }}>
          If you have already processed this transaction, kindly reply with the
          payment confirmation / UTR details for swift reconciliation.
        </p>
      )}

      <Signature
        senderCompany={companyDisplayName}
        senderEmail={company.email || ""}
        senderPhone={company.phone || ""}
        senderLogo={company.logoUrl || company.logo || ""}
      />
    </EmailLayout>
  );
}

// ============================================================================
// TEMPLATE 2: Client Statement Email Template (Data Shape: Multi-Invoice SOA)
// ============================================================================
// Handles:
// - Regular Statement of Outstanding Invoices (STATEMENT / DUE_REMINDER)
// - Overdue Statement Notice (OVERDUE_NOTICE / OVERDUE_REMINDER)
// - Service Suspension Warning / Final Demand (SUSPENSION_WARNING / SERVICE_SUSPENSION_NOTICE)
// - Multi-Invoice Payment Allocation Settlement (SETTLEMENT / PAYMENT_RECEIVED)
// - Bulk Multi-Invoice Table Reminders
// ============================================================================

export function ClientStatementEmailTemplate({
  client = {},
  invoices = [],
  company = {},
  reminderType = "STATEMENT",
  urgency = null,
  type = null,
  customNote = "",
  body = "",
  clientSummary = null,
  settledInvoices = null,
  paymentInfo = null,
  totalDue = null,
  overdueCount: propOverdueCount = null,
  actionUrl = "",
}) {
  const normalizedType = String(
    urgency || reminderType || type || "STATEMENT",
  ).toUpperCase();

  const isSettlement =
    normalizedType === "SETTLEMENT" || normalizedType === "PAYMENT_RECEIVED";

  // Normalize invoices array (supports invoice list, bulk group invoices, or raw DB rows)
  const mappedInvoices = (invoices || []).map((inv) => {
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

    const paidAmount = Number(inv.paidAmount || 0);
    const invoiceAmount = Number(
      inv.invoiceAmount || inv.netPayableAmount || 0,
    );
    const outstandingAmount =
      inv.due !== undefined
        ? Number(inv.due)
        : inv.outstandingAmount !== undefined
          ? Number(inv.outstandingAmount)
          : Math.max(invoiceAmount - paidAmount, 0);

    const isOverdue = Boolean(
      inv.isOverdue ||
      (inv.agingDays && inv.agingDays > 0) ||
      (inv.dueDays && inv.dueDays > 0) ||
      inv.agingStatus?.toLowerCase().includes("overdue"),
    );

    const dueDays = inv.dueDays || inv.agingDays || 0;

    return {
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      creditDays,
      invoiceAmount,
      paidAmount,
      outstandingAmount,
      isOverdue,
      dueDays,
      agingStatus:
        inv.agingStatus ||
        (isOverdue
          ? `${dueDays}d Overdue`
          : inv.isDueToday
            ? "Due Today"
            : "Current"),
      agingColor:
        inv.agingColor ||
        (isOverdue ? "#DC2626" : inv.isDueToday ? "#D97706" : "#16A34A"),
    };
  });

  // Calculate summaries dynamically if not explicitly provided
  const totalOutstanding =
    totalDue !== null && totalDue !== undefined
      ? Number(totalDue)
      : clientSummary?.outstandingAmount !== undefined
        ? Number(clientSummary.outstandingAmount)
        : mappedInvoices.reduce((sum, i) => sum + i.outstandingAmount, 0);

  const overdueInvoicesCount =
    propOverdueCount !== null && propOverdueCount !== undefined
      ? Number(propOverdueCount)
      : clientSummary?.overdueInvoices !== undefined
        ? Number(clientSummary.overdueInvoices)
        : mappedInvoices.filter((i) => i.isOverdue).length;

  const overdueAmount =
    clientSummary?.overdueAmount !== undefined
      ? Number(clientSummary.overdueAmount)
      : mappedInvoices
          .filter((i) => i.isOverdue)
          .reduce((sum, i) => sum + i.outstandingAmount, 0);

  let title = "Statement of Outstanding Invoices";
  let banner = "Statement of Account";
  let color = "#2563EB";
  let background = "#DBEAFE";

  if (isSettlement) {
    title = `Payment Acknowledgment & Settlement - ${client.companyName || client.name || "Customer"}`;
    banner = "Payment Received & Allocated";
    color = "#16A34A";
    background = "#DCFCE7";
  } else if (
    normalizedType === "SUSPENSION_WARNING" ||
    normalizedType === "SERVICE_SUSPENSION_NOTICE" ||
    normalizedType === "SERVICE_SUSPENSION_ALERT"
  ) {
    title = `URGENT: Outstanding Dues & Credit Terms Warning - ${client.companyName || client.name || ""}`;
    banner = "Credit Terms Warning / Final Demand";
    color = "#DC2626";
    background = "#FEE2E2";
  } else if (
    normalizedType === "OVERDUE_NOTICE" ||
    normalizedType === "OVERDUE_REMINDER" ||
    overdueInvoicesCount > 0
  ) {
    title = `Overdue Statement of Account: ${overdueInvoicesCount} Overdue Invoices - ${client.companyName || client.name || ""}`;
    banner =
      overdueInvoicesCount > 0
        ? `Overdue Statement Notice (${overdueInvoicesCount} Overdue)`
        : "Overdue Statement Notice";
    color = "#EA580C";
    background = "#FFEDD5";
  } else {
    // STATEMENT / DUE_REMINDER
    title = `Statement of Outstanding Invoices (${mappedInvoices.length} Invoices) - ${client.companyName || client.name || ""}`;
    banner = "Statement of Outstanding Invoices";
    color = "#2563EB";
    background = "#DBEAFE";
  }

  const formattedTotalOutstanding = totalOutstanding.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });
  const formattedOverdueAmount = overdueAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  const clientDisplayName =
    client.companyName || client.name || "Finance & Accounts Team";
  const companyDisplayName = company.companyName || "PAFEX Logistics";

  const defaultBody = isSettlement
    ? `We have received and credited your payment towards the outstanding invoices detailed below.`
    : normalizedType === "SUSPENSION_WARNING" ||
        normalizedType === "SERVICE_SUSPENSION_NOTICE"
      ? `Please find below the consolidated statement of your outstanding ledger. There are currently ${mappedInvoices.length} unpaid invoices totaling ₹${formattedTotalOutstanding}, with ${overdueInvoicesCount} invoice(s) critically overdue. Please settle these outstanding balances immediately to avoid interruption to dispatch and credit services.`
      : overdueInvoicesCount > 0
        ? `Please find below your statement of outstanding invoices. There are currently ${overdueInvoicesCount} overdue invoice(s) totaling ₹${formattedOverdueAmount} out of total outstanding ₹${formattedTotalOutstanding}. Kindly prioritize clearance of these pending bills.`
        : `Please find below the consolidated statement of your open invoices with ${companyDisplayName}. There are currently ${mappedInvoices.length} outstanding invoices with a total pending balance of ₹${formattedTotalOutstanding}.`;

  const paragraphText = body || defaultBody;

  return (
    <EmailLayout
      title={title}
      bannerColor={color}
      companyName={companyDisplayName}
      senderCompany={companyDisplayName}
      senderEmail={company.email || ""}
      senderPhone={company.phone || ""}
      logoUrl={company.logoUrl || company.logo || ""}
    >
      <Greeting clientName={clientDisplayName} />

      <StatusBanner title={banner} color={color} background={background} />

      <Paragraph text={paragraphText} />

      {!isSettlement && overdueInvoicesCount > 0 && (
        <AlertBox
          message={`⚠️ <strong>Action Required:</strong> ${overdueInvoicesCount} invoice(s) are overdue totaling <strong>₹${formattedOverdueAmount}</strong>.`}
        />
      )}

      {customNote && <CustomNote note={customNote} color={color} />}

      {isSettlement ? (
        <ClientPaymentSettlementTable
          settledInvoices={settledInvoices || []}
          paymentInfo={paymentInfo || {}}
          totalAccountOutstanding={totalOutstanding}
        />
      ) : (
        <ClientOutstandingInvoices invoices={mappedInvoices} />
      )}

      {actionUrl && (
        <EmailButton text="View Account Statement Online" url={actionUrl} />
      )}

      <p style={{ fontSize: "13px", color: "#64748B", margin: "16px 0 0 0" }}>
        {isSettlement
          ? "Please review the settlement details and notify our Accounts Team within 2 days if there are any discrepancies."
          : "Kindly share payment receipts / UTR details with our accounts team for swift ledger reconciliation."}
      </p>

      <Signature
        senderCompany={companyDisplayName}
        senderEmail={company.email || ""}
        senderPhone={company.phone || ""}
        senderLogo={company.logoUrl || company.logo || ""}
      />
    </EmailLayout>
  );
}

// ============================================================================
// Core Render Functions
// ============================================================================

/**
 * Render a Single Invoice Email to an HTML string
 */
export function renderSingleInvoiceEmail(props) {
  const markup = renderToStaticMarkup(
    <SingleInvoiceEmailTemplate {...props} />,
  );
  return `<!DOCTYPE html>\n${markup}`;
}

/**
 * Render a Client Statement Email (Multi-Invoice) to an HTML string
 */
export function renderClientStatementEmail(props) {
  const markup = renderToStaticMarkup(
    <ClientStatementEmailTemplate {...props} />,
  );
  return `<!DOCTYPE html>\n${markup}`;
}

// ============================================================================
// Intelligent Dispatcher & Backward-Compatibility Layer
// ============================================================================

/**
 * Unified renderEmail:
 * Inspects incoming props and intelligently dispatches to either:
 * - ClientStatementEmail (if multiple invoices / SOA / settlement)
 * - SingleInvoiceEmail (if 1 invoice)
 */
export function renderEmail(props = {}) {
  const vars = props.variables || {};
  const typeStr = String(props.type || props.reminderType || "").toUpperCase();

  // Explicit Single Invoice events: always render as single invoice
  const isExplicitSingleInvoice =
    typeStr === "BILL_SUBMITTED" ||
    typeStr === "SUBMITTED" ||
    typeStr === "DUE_TODAY" ||
    typeStr === "INTERNAL_DUE_TODAY" ||
    typeStr === "PAYMENT_CLEARED" ||
    (!props.invoices?.length &&
      !props.groupInvoices?.length &&
      !vars.invoices?.length &&
      vars.invoiceNumber);

  // Explicit Settlement receipt
  const isExplicitSettlement =
    typeStr === "PAYMENT_RECEIVED" || typeStr === "SETTLEMENT";

  // Multi-invoice statement events
  const isMultiInvoiceStatement =
    !isExplicitSingleInvoice &&
    (isExplicitSettlement ||
      (Array.isArray(props.invoices) && props.invoices.length > 0) ||
      (Array.isArray(props.groupInvoices) && props.groupInvoices.length > 0) ||
      (Array.isArray(vars.invoices) && vars.invoices.length > 0) ||
      typeStr === "STATEMENT" ||
      typeStr === "OVERDUE_NOTICE" ||
      typeStr === "SUSPENSION_WARNING" ||
      typeStr === "SERVICE_SUSPENSION_NOTICE" ||
      typeStr === "SERVICE_SUSPENSION_ALERT" ||
      typeStr === "OVERDUE_REMINDER");

  if (isMultiInvoiceStatement) {
    const rawInvoices =
      props.invoices || props.groupInvoices || vars.invoices || [];

    return renderClientStatementEmail({
      client: props.client || {
        companyName: vars.clientName || props.clientName || "",
        name: vars.clientName || props.clientName || "",
      },
      invoices: rawInvoices,
      company: props.company ||
        vars.company || {
          companyName: vars.senderCompany || "",
          email: vars.senderEmail || "",
          phone: vars.senderPhone || "",
          logoUrl: vars.senderLogo || "",
        },
      reminderType: props.reminderType || props.type || "STATEMENT",
      customNote: props.customNote || vars.customNote || "",
      body: props.body || "",
      actionUrl: props.actionUrl || "",
      settledInvoices: vars.settledInvoices || props.settledInvoices || null,
      paymentInfo: vars.settledInvoices
        ? {
            amount: vars.paymentAmount,
            paymentDate: vars.paymentDate,
            method: vars.paymentMethod,
            reference: vars.referenceNumber,
          }
        : null,
      totalDue: props.totalDue || vars.totalOutstanding || null,
      clientSummary: props.clientSummary || null,
    });
  }

  // Single Invoice Fallback
  return renderSingleInvoiceEmail({
    invoice: props.invoice || {
      invoiceNumber: vars.invoiceNumber || "",
      invoiceDate: vars.invoiceDate || "",
      dueDate: vars.dueDate || "",
      invoiceAmount: vars.invoiceAmount || 0,
      paidAmount: vars.paidAmount || 0,
      outstandingAmount: vars.outstandingAmount || 0,
      isOverdue: vars.isOverdue || false,
      dueDays: vars.dueDays || vars.overdueDays || 0,
      dueDaysText: vars.dueDaysText || "",
      awbs: vars.awbs || [],
    },
    client: props.client || {
      companyName: vars.clientName || props.clientName || "",
      name: vars.clientName || props.clientName || "",
    },
    company: props.company ||
      vars.company || {
        companyName: vars.senderCompany || "",
        email: vars.senderEmail || "",
        phone: vars.senderPhone || "",
        logoUrl: vars.senderLogo || "",
      },
    reminderType: props.reminderType || props.type || "OVERDUE",
    customNote: props.customNote || vars.customNote || "",
    body: props.body || "",
    actionUrl: props.actionUrl || "",
  });
}

// Backward-compatible named exports
export function renderManualSingleInvoiceReminderEmail(props) {
  return renderSingleInvoiceEmail(props);
}

export function renderManualClientStatementReminderEmail(props) {
  return renderClientStatementEmail(props);
}

export function renderManualBulkInvoicesReminderEmail(props) {
  return renderClientStatementEmail({
    ...props,
    invoices: props.groupInvoices || props.invoices || [],
  });
}

export function renderEmailLayout(props) {
  const markup = renderToStaticMarkup(<EmailLayout {...props} />);
  return `<!DOCTYPE html>\n${markup}`;
}

export function renderSignature(props) {
  return renderToStaticMarkup(<Signature {...props} />);
}

// Component aliases for backward compatibility
export const NotificationEmailTemplate = SingleInvoiceEmailTemplate;
export const SingleInvoiceReminderTemplate = SingleInvoiceEmailTemplate;
export const ClientStatementReminderTemplate = ClientStatementEmailTemplate;
export const BulkInvoicesReminderTemplate = ClientStatementEmailTemplate;
