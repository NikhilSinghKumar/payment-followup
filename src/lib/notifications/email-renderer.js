import React from "react";
import { renderToStaticMarkup as reactRenderToStaticMarkup } from "react-dom/server.edge";
import { EmailLayout } from "./email-layout";
import {
  Greeting,
  Paragraph,
  StatusBanner,
  InvoiceSummary,
  AccountFinancialSummary,
  SingleInvoiceDataTable,
  ClientOutstandingInvoices,
  ClientPaymentSettlementTable,
  AlertBox,
  EmailButton,
  Signature,
  BankDetails,
  CustomNote,
  formatDate,
} from "./email-components";

import { NOTIFICATION_TYPES } from "./notification-types";

// ============================================================================
// Static HTML Markup Renderer (Server-Side)
// ============================================================================

function renderToStaticMarkup(element) {
  try {
    if (typeof reactRenderToStaticMarkup === "function") {
      return reactRenderToStaticMarkup(element);
    }
  } catch (err) {
    console.warn(
      "[Email Renderer] Static render failed, falling back:",
      err?.message,
    );
  }

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
// - Overdue Payment Reminder (OVERDUE / OVERDUE_REMINDER)
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
  clientSummary = null,
  totalNetPayable = null,
  netOutstanding = null,
  paymentsReceived = null,
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
    color = "#2563EB";
    background = "#DBEAFE";
  } else if (
    normalizedType === "FINAL_NOTICE" ||
    normalizedType === "FINAL_REMINDER"
  ) {
    title = `FINAL NOTICE: Overdue Invoice #${invoice.invoiceNumber || ""}`;
    banner = "Final Notice / Credit Action Warning";
    color = "#2563EB";
    background = "#DBEAFE";
  } else if (
    normalizedType === "PAID" ||
    normalizedType === "PAYMENT_CLEARED"
  ) {
    title = `Invoice #${invoice.invoiceNumber || ""} Paid`;
    banner = "Invoice Fully Paid";
    color = "#2563EB";
    background = "#DBEAFE";
  } else {
    // OVERDUE or default
    title = `Overdue Payment Reminder - Invoice #${invoice.invoiceNumber || ""}`;
    banner = invoice.dueDaysText
      ? `Overdue Payment Rminder`
      : "Overdue Payment Reminder";
    color = "#2563EB";
    background = "#DBEAFE";
  }

  const formattedDueDate = formatDate(invoice.dueDate);
  const formattedInvoiceDate = formatDate(invoice.invoiceDate);

  const rawGross = Number(invoice.invoiceAmount || 0);
  const rawNet = Number(invoice.netPayableAmount || 0);
  const invoiceAmountVal = rawGross > 0 ? rawGross : rawNet > 0 ? rawNet : 0;
  const netPayableVal = rawNet > 0 ? rawNet : invoiceAmountVal;
  const paidVal = Number(
    invoice.paymentDeduction !== undefined && invoice.paymentDeduction !== null
      ? invoice.paymentDeduction
      : (invoice.paidAmount ?? invoice.paid ?? 0),
  );
  const dueAmt =
    invoice.due !== undefined && invoice.due !== null
      ? Number(invoice.due)
      : invoice.restDueAmount !== undefined && invoice.restDueAmount !== null
        ? Number(invoice.restDueAmount)
        : invoice.outstandingAmount !== undefined &&
            invoice.outstandingAmount !== null
          ? Number(invoice.outstandingAmount)
          : Math.max(0, netPayableVal - paidVal);

  const formattedTotal = Number(invoiceAmountVal || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });
  const formattedPaid = Number(paidVal || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });
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

      <AccountFinancialSummary
        overallDue={
          clientSummary?.totalNetPayable ??
          totalNetPayable ??
          clientSummary?.netPayableAmount ??
          invoiceAmountVal
        }
        paymentDeduction={
          clientSummary?.paymentsReceived ??
          paymentsReceived ??
          clientSummary?.totalPaidAmount ??
          paidVal
        }
        restDueAmount={
          clientSummary?.netOutstanding ??
          netOutstanding ??
          clientSummary?.restDueAmount ??
          dueAmt
        }
        totalNetPayable={
          clientSummary?.totalNetPayable ??
          totalNetPayable ??
          clientSummary?.netPayableAmount ??
          null
        }
        paymentsReceived={
          clientSummary?.paymentsReceived ?? paymentsReceived ?? null
        }
        netOutstanding={
          clientSummary?.netOutstanding ??
          netOutstanding ??
          clientSummary?.restDueAmount ??
          null
        }
        isOverdue={Boolean(invoice.isOverdue)}
      />

      <SingleInvoiceDataTable
        invoice={invoice}
        overallDue={invoiceAmountVal}
        paymentDeduction={paidVal}
        restDueAmount={dueAmt}
        awbs={invoice.awbs || []}
        isOverdue={Boolean(invoice.isOverdue)}
        dueDaysText={invoice.dueDaysText}
      />

      {invoice.isOverdue && invoice.dueDays >= 1 && (
        <AlertBox
          message={`This invoice is past due by <strong>${invoice.dueDays} day(s)</strong>. If you have already done payment, please contact PAFEX accounts team for swift reconciliation.`}
        />
      )}

      {actionUrl && <EmailButton text="View Invoice Online" url={actionUrl} />}

      {!isPaidOrCleared && <BankDetails company={company} />}

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
// - Overdue Statement (OVERDUE_NOTICE / OVERDUE_REMINDER)
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
  totalNetPayable: propTotalNetPayable = null,
  netOutstanding: propNetOutstanding = null,
  paymentsReceived: propPaymentsReceived = null,
  onAccountAmount: propOnAccountAmount = null,
  unallocatedAmount: propUnallocatedAmount = null,
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

    const rawGross = Number(inv.invoiceAmount || 0);
    const rawNet = Number(inv.netPayableAmount || 0);
    const invoiceAmount = rawGross > 0 ? rawGross : rawNet > 0 ? rawNet : 0;
    const netPayableAmount = rawNet > 0 ? rawNet : invoiceAmount;
    const paidAmount = Number(
      inv.paymentDeduction !== undefined && inv.paymentDeduction !== null
        ? inv.paymentDeduction
        : (inv.paidAmount ?? inv.paid ?? 0),
    );
    const outstandingAmount =
      inv.due !== undefined && inv.due !== null
        ? Number(inv.due)
        : inv.restDueAmount !== undefined && inv.restDueAmount !== null
          ? Number(inv.restDueAmount)
          : inv.outstandingAmount !== undefined &&
              inv.outstandingAmount !== null
            ? Number(inv.outstandingAmount)
            : Math.max(0, netPayableAmount - paidAmount);

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

  const settlementRemaining =
    paymentInfo?.remainingOutstanding !== undefined &&
    paymentInfo.remainingOutstanding !== null
      ? Number(paymentInfo.remainingOutstanding)
      : paymentInfo?.totalAccountOutstanding !== undefined &&
          paymentInfo.totalAccountOutstanding !== null
        ? Number(paymentInfo.totalAccountOutstanding)
        : null;

  // Source of Truth matching clients/[id]/page.js:
  // "Net Payable Amount" for a client is totalNetPayable
  // "Payment Received" is paymentsReceived
  // "Rest Due Amount" is netOutstanding: Math.max(totalNetPayable - paymentsReceived, 0)
  const resolvedTotalNetPayable =
    clientSummary?.totalNetPayable !== undefined &&
    clientSummary?.totalNetPayable !== null
      ? Number(clientSummary.totalNetPayable)
      : propTotalNetPayable !== null && propTotalNetPayable !== undefined
        ? Number(propTotalNetPayable)
        : clientSummary?.netPayableAmount !== undefined &&
            clientSummary?.netPayableAmount !== null
          ? Number(clientSummary.netPayableAmount)
          : mappedInvoices.reduce(
              (s, i) =>
                s + (Number(i.netPayableAmount ?? i.invoiceAmount) || 0),
              0,
            );

  const resolvedPaymentsReceived =
    clientSummary?.paymentsReceived !== undefined &&
    clientSummary?.paymentsReceived !== null
      ? Number(clientSummary.paymentsReceived)
      : propPaymentsReceived !== null && propPaymentsReceived !== undefined
        ? Number(propPaymentsReceived)
        : clientSummary?.totalPaidAmount !== undefined &&
            clientSummary?.totalPaidAmount !== null
          ? Number(clientSummary.totalPaidAmount)
          : mappedInvoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);

  const resolvedNetOutstanding =
    clientSummary?.netOutstanding !== undefined &&
    clientSummary?.netOutstanding !== null
      ? Number(clientSummary.netOutstanding)
      : propNetOutstanding !== null && propNetOutstanding !== undefined
        ? Number(propNetOutstanding)
        : clientSummary?.restDueAmount !== undefined &&
            clientSummary?.restDueAmount !== null
          ? Number(clientSummary.restDueAmount)
          : totalDue !== null && totalDue !== undefined
            ? Number(totalDue)
            : clientSummary?.outstandingAmount !== undefined &&
                clientSummary?.outstandingAmount !== null
              ? Number(clientSummary.outstandingAmount)
              : Math.max(0, resolvedTotalNetPayable - resolvedPaymentsReceived);

  // Calculate summaries dynamically if not explicitly provided
  const totalOutstanding = resolvedNetOutstanding;

  const resolvedOnAccount = Math.max(
    0,
    Number(
      clientSummary?.onAccountAmount !== undefined &&
        clientSummary?.onAccountAmount !== null
        ? clientSummary.onAccountAmount
        : clientSummary?.unallocatedAmount !== undefined &&
            clientSummary?.unallocatedAmount !== null
          ? clientSummary.unallocatedAmount
          : propOnAccountAmount !== null && propOnAccountAmount !== undefined
            ? propOnAccountAmount
            : propUnallocatedAmount !== null &&
                propUnallocatedAmount !== undefined
              ? propUnallocatedAmount
              : Math.max(
                  0,
                  resolvedPaymentsReceived -
                    mappedInvoices.reduce(
                      (s, i) => s + (Number(i.paidAmount) || 0),
                      0,
                    ),
                ),
    ),
  );

  const overdueInvoicesCount =
    propOverdueCount !== null && propOverdueCount !== undefined
      ? Number(propOverdueCount)
      : clientSummary?.overdueInvoices !== undefined
        ? Number(clientSummary.overdueInvoices)
        : mappedInvoices.filter((i) => i.isOverdue).length;

  const rawOverdueAmount =
    clientSummary?.overdueAmount !== undefined
      ? Number(clientSummary.overdueAmount)
      : mappedInvoices
          .filter((i) => i.isOverdue)
          .reduce((sum, i) => sum + Number(i.outstandingAmount || 0), 0);

  // If on-account credit is present and covers/adjusts pending dues, net overdue cannot exceed net outstanding
  const overdueAmount =
    resolvedOnAccount > 0 &&
    rawOverdueAmount > resolvedNetOutstanding &&
    resolvedNetOutstanding > 0
      ? resolvedNetOutstanding
      : rawOverdueAmount;

  let title = "Statement of Outstanding Invoices";
  let banner = "Statement of Account";
  let color = "#2563EB";
  let background = "#DBEAFE";

  if (isSettlement) {
    title = `Payment Acknowledgment & Settlement - ${client.companyName || client.name || "Customer"}`;
    banner = "Payment Received";
    color = "#2563EB";
    background = "#DBEAFE";
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
    normalizedType === "OVERDUE" ||
    overdueInvoicesCount > 0
  ) {
    title = `Overdue Statement of Account: ${overdueInvoicesCount} Overdue Invoices - ${client.companyName || client.name || ""}`;
    banner = "Overdue Statement";
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
  const formattedOnAccount = resolvedOnAccount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  const clientDisplayName =
    client.companyName || client.name || "Finance & Accounts Team";
  const companyDisplayName = company.companyName || "PAFEX Logistics";

  const settlementPaymentAmount = Number(
    paymentInfo?.amount ||
      (Array.isArray(settledInvoices)
        ? settledInvoices.reduce(
            (s, i) => s + Number(i.settledAmount || i.paidAmount || 0),
            0,
          )
        : 0) ||
      0,
  );
  const formattedSettlementPayment = settlementPaymentAmount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
    },
  );

  const isAllOverdue =
    overdueInvoicesCount >= mappedInvoices.length ||
    (totalOutstanding > 0 && overdueAmount >= totalOutstanding);

  const defaultBody = isSettlement
    ? settlementPaymentAmount > 0
      ? `We have received and credited your payment of ₹${formattedSettlementPayment} towards the outstanding invoices detailed below.`
      : `We have received and credited your payment towards the outstanding invoices detailed below.`
    : normalizedType === "SUSPENSION_WARNING" ||
        normalizedType === "SERVICE_SUSPENSION_NOTICE"
      ? `Please find below the consolidated statement of your outstanding ledger. There are currently ${mappedInvoices.length} unpaid invoices totaling ₹${formattedTotalOutstanding}, with ${overdueInvoicesCount} invoice(s) critically overdue${resolvedOnAccount > 0 ? ` (after adjusting ₹${formattedOnAccount} on-account credit)` : ""}. Please settle these outstanding balances immediately to avoid interruption to dispatch and credit services.`
      : overdueInvoicesCount > 0
        ? isAllOverdue
          ? `Please find below your statement of outstanding invoices. There are currently ${overdueInvoicesCount} overdue invoice(s) totaling ₹${formattedTotalOutstanding}${resolvedOnAccount > 0 ? ` (after adjusting ₹${formattedOnAccount} on-account payment)` : ""}. Kindly prioritize clearance of these pending bills.`
          : `Please find below your statement of outstanding invoices. There are currently ${overdueInvoicesCount} overdue invoice(s) totaling ₹${formattedOverdueAmount}${resolvedOnAccount > 0 ? ` (after adjusting on-account credit)` : ""} out of total outstanding ₹${formattedTotalOutstanding}. Kindly prioritize clearance of these pending bills.`
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

      {customNote && <CustomNote note={customNote} color={color} />}

      {isSettlement ? (
        <ClientPaymentSettlementTable
          settledInvoices={settledInvoices || []}
          paymentInfo={paymentInfo || {}}
          totalAccountOutstanding={
            paymentInfo?.netOutstanding ??
            paymentInfo?.restDueAmount ??
            resolvedNetOutstanding ??
            paymentInfo?.totalAccountOutstanding ??
            paymentInfo?.remainingOutstanding ??
            totalOutstanding
          }
          totalOutstanding={
            paymentInfo?.totalNetPayable ??
            paymentInfo?.netPayableAmount ??
            resolvedTotalNetPayable ??
            paymentInfo?.totalOutstanding
          }
          remainingOutstanding={
            paymentInfo?.netOutstanding ??
            paymentInfo?.restDueAmount ??
            resolvedNetOutstanding ??
            paymentInfo?.remainingOutstanding ??
            paymentInfo?.totalAccountOutstanding ??
            totalOutstanding
          }
        />
      ) : (
        <ClientOutstandingInvoices
          invoices={mappedInvoices}
          showSummaryCards={true}
          overallDue={resolvedTotalNetPayable}
          paymentDeduction={resolvedPaymentsReceived}
          restDueAmount={resolvedNetOutstanding}
          totalNetPayable={resolvedTotalNetPayable}
          paymentsReceived={resolvedPaymentsReceived}
          netOutstanding={resolvedNetOutstanding}
          onAccountAmount={resolvedOnAccount}
          unallocatedAmount={resolvedOnAccount}
          clientSummary={clientSummary}
        />
      )}

      {actionUrl && (
        <EmailButton text="View Account Statement Online" url={actionUrl} />
      )}

      {!isSettlement && <BankDetails company={company} />}

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

  // Explicit Settlement receipt
  const isExplicitSettlement =
    typeStr === "PAYMENT_RECEIVED" || typeStr === "SETTLEMENT";

  // Dedicated Payment Settlement Handler
  if (isExplicitSettlement) {
    let settledInvoicesList =
      vars.settledInvoices ||
      props.settledInvoices ||
      vars.invoices ||
      props.invoices ||
      props.groupInvoices ||
      [];

    if (
      !Array.isArray(settledInvoicesList) ||
      settledInvoicesList.length === 0
    ) {
      if (vars.invoiceNumber || props.invoice?.invoiceNumber) {
        const invNum = vars.invoiceNumber || props.invoice?.invoiceNumber || "";
        const rawGross = Number(
          vars.invoiceAmount ?? props.invoice?.invoiceAmount ?? 0,
        );
        const rawNet = Number(
          vars.netPayableAmount ?? props.invoice?.netPayableAmount ?? 0,
        );
        const invFace = rawGross > 0 ? rawGross : rawNet > 0 ? rawNet : 0;
        const netPayable = rawNet > 0 ? rawNet : invFace;
        const settledAmt = Number(
          vars.paymentAmount ?? props.invoice?.paidAmount ?? 0,
        );
        const remAmt =
          vars.remainingOutstanding !== undefined &&
          vars.remainingOutstanding !== null
            ? Number(vars.remainingOutstanding)
            : vars.outstandingAmount !== undefined &&
                vars.outstandingAmount !== null
              ? Number(vars.outstandingAmount)
              : props.invoice?.outstandingAmount !== undefined &&
                  props.invoice?.outstandingAmount !== null
                ? Number(props.invoice.outstandingAmount)
                : vars.due !== undefined && vars.due !== null
                  ? Number(vars.due)
                  : props.invoice?.due !== undefined &&
                      props.invoice?.due !== null
                    ? Number(props.invoice.due)
                    : Math.max(0, netPayable - settledAmt);

        const invTotal = invFace > 0 ? invFace : settledAmt + remAmt;

        settledInvoicesList = [
          {
            invoiceNumber: invNum,
            invoiceDate: vars.invoiceDate || props.invoice?.invoiceDate || "",
            dueDate: vars.dueDate || props.invoice?.dueDate || "",
            invoiceAmount: invTotal,
            netPayableAmount: netPayable > 0 ? netPayable : invTotal,
            settledAmount: settledAmt,
            remainingBalance: remAmt,
            status: remAmt <= 0 ? "paid" : "partial",
          },
        ];
      }
    }

    const normalizedSettledInvoices = (settledInvoicesList || []).map(
      (inv, idx) => {
        const invNum = inv.invoiceNumber || inv.number || `INV-${idx + 1}`;
        const rawGross = Number(inv.invoiceAmount || 0);
        const rawNet = Number(inv.netPayableAmount || 0);
        const invFace =
          rawGross > 0
            ? rawGross
            : rawNet > 0
              ? rawNet
              : Number(inv.totalAmount || 0);
        const netPayable = rawNet > 0 ? rawNet : invFace;
        const settled = Number(
          inv.settledAmount ??
            inv.amountSettled ??
            inv.allocatedAmount ??
            inv.paidAmount ??
            0,
        );
        const remaining =
          inv.remainingBalance !== undefined && inv.remainingBalance !== null
            ? Number(inv.remainingBalance)
            : inv.outstandingAmount !== undefined &&
                inv.outstandingAmount !== null
              ? Number(inv.outstandingAmount)
              : inv.due !== undefined && inv.due !== null
                ? Number(inv.due)
                : Math.max(
                    0,
                    (netPayable > 0 ? netPayable : invFace) - settled,
                  );
        const totalAmount = invFace > 0 ? invFace : settled + remaining;

        return {
          ...inv,
          invoiceNumber: invNum,
          invoiceDate: inv.invoiceDate || "",
          dueDate: inv.dueDate || "",
          invoiceAmount: totalAmount,
          netPayableAmount: netPayable > 0 ? netPayable : totalAmount,
          settledAmount: settled,
          remainingBalance: remaining,
          status: inv.status || (remaining <= 0 ? "paid" : "partial"),
        };
      },
    );

    const totalSettledFromInvoices = normalizedSettledInvoices.reduce(
      (sum, i) => sum + Number(i.settledAmount || 0),
      0,
    );

    const totalNetPayableFromInvoices = normalizedSettledInvoices.reduce(
      (sum, i) => sum + Number(i.netPayableAmount || i.invoiceAmount || 0),
      0,
    );

    const totalInvoiceAmount = normalizedSettledInvoices.reduce(
      (sum, i) => sum + Number(i.invoiceAmount || 0),
      0,
    );

    const unallocatedAmount = Number(
      vars.unallocatedAmount ??
        vars.onAccount ??
        vars.onAccountAmount ??
        vars.clientUnallocatedBalance ??
        props.paymentInfo?.unallocatedAmount ??
        props.paymentInfo?.onAccount ??
        props.paymentInfo?.onAccountAmount ??
        props.paymentInfo?.clientUnallocatedBalance ??
        (vars.paymentAmount &&
        Number(vars.paymentAmount) > totalSettledFromInvoices
          ? Number(vars.paymentAmount) - totalSettledFromInvoices
          : props.paymentInfo?.amount &&
              Number(props.paymentInfo.amount) > totalSettledFromInvoices
            ? Number(props.paymentInfo.amount) - totalSettledFromInvoices
            : 0),
    );

    // Payment Received = Settled against invoice(s) + unallocated amount (OR On Account)
    const paymentAmount =
      vars.paymentAmount !== undefined && vars.paymentAmount !== null
        ? Math.max(
            Number(vars.paymentAmount),
            totalSettledFromInvoices + unallocatedAmount,
          )
        : props.paymentInfo?.amount !== undefined &&
            props.paymentInfo?.amount !== null
          ? Math.max(
              Number(props.paymentInfo.amount),
              totalSettledFromInvoices + unallocatedAmount,
            )
          : totalSettledFromInvoices + unallocatedAmount;

    // Overall Outstanding of client (Net Payable Amount)
    let candidateOverall = null;
    if (
      vars.overallOutstanding !== undefined &&
      vars.overallOutstanding !== null
    ) {
      candidateOverall = Number(vars.overallOutstanding);
    } else if (
      vars.clientOverallOutstanding !== undefined &&
      vars.clientOverallOutstanding !== null
    ) {
      candidateOverall = Number(vars.clientOverallOutstanding);
    } else if (
      vars.totalOutstanding !== undefined &&
      vars.totalOutstanding !== null
    ) {
      candidateOverall = Number(vars.totalOutstanding);
    } else if (
      props.paymentInfo?.overallOutstanding !== undefined &&
      props.paymentInfo?.overallOutstanding !== null
    ) {
      candidateOverall = Number(props.paymentInfo.overallOutstanding);
    } else if (
      props.paymentInfo?.clientOverallOutstanding !== undefined &&
      props.paymentInfo?.clientOverallOutstanding !== null
    ) {
      candidateOverall = Number(props.paymentInfo.clientOverallOutstanding);
    } else if (
      props.paymentInfo?.totalOutstanding !== undefined &&
      props.paymentInfo?.totalOutstanding !== null
    ) {
      candidateOverall = Number(props.paymentInfo.totalOutstanding);
    } else if (
      vars.netPayableAmount !== undefined &&
      vars.netPayableAmount !== null
    ) {
      candidateOverall = Number(vars.netPayableAmount);
    }

    const accountRemaining =
      vars.totalAccountOutstanding !== undefined &&
      vars.totalAccountOutstanding !== null
        ? Number(vars.totalAccountOutstanding)
        : props.paymentInfo?.totalAccountOutstanding !== undefined &&
            props.paymentInfo?.totalAccountOutstanding !== null
          ? Number(props.paymentInfo.totalAccountOutstanding)
          : vars.remainingOutstanding !== undefined &&
              vars.remainingOutstanding !== null
            ? Number(vars.remainingOutstanding)
            : props.paymentInfo?.remainingOutstanding !== undefined &&
                props.paymentInfo?.remainingOutstanding !== null
              ? Number(props.paymentInfo.remainingOutstanding)
              : null;

    const derivedFromRemaining =
      accountRemaining !== null ? accountRemaining + paymentAmount : null;

    // Net Payable Amount: for a client should be totalNetPayable that is used on clients/[id]/page.js file
    let candidateTotalNetPayable = null;
    if (
      props.clientSummary?.totalNetPayable !== undefined &&
      props.clientSummary?.totalNetPayable !== null
    ) {
      candidateTotalNetPayable = Number(props.clientSummary.totalNetPayable);
    } else if (
      vars.clientSummary?.totalNetPayable !== undefined &&
      vars.clientSummary?.totalNetPayable !== null
    ) {
      candidateTotalNetPayable = Number(vars.clientSummary.totalNetPayable);
    } else if (
      props.paymentInfo?.clientSummary?.totalNetPayable !== undefined &&
      props.paymentInfo?.clientSummary?.totalNetPayable !== null
    ) {
      candidateTotalNetPayable = Number(
        props.paymentInfo.clientSummary.totalNetPayable,
      );
    } else if (
      vars.totalNetPayable !== undefined &&
      vars.totalNetPayable !== null
    ) {
      candidateTotalNetPayable = Number(vars.totalNetPayable);
    } else if (
      props.paymentInfo?.totalNetPayable !== undefined &&
      props.paymentInfo?.totalNetPayable !== null
    ) {
      candidateTotalNetPayable = Number(props.paymentInfo.totalNetPayable);
    } else if (
      vars.netPayableAmount !== undefined &&
      vars.netPayableAmount !== null
    ) {
      candidateTotalNetPayable = Number(vars.netPayableAmount);
    } else if (
      props.paymentInfo?.netPayableAmount !== undefined &&
      props.paymentInfo?.netPayableAmount !== null
    ) {
      candidateTotalNetPayable = Number(props.paymentInfo.netPayableAmount);
    } else if (candidateOverall !== null) {
      candidateTotalNetPayable = candidateOverall;
    }

    const netPayableAmount =
      candidateTotalNetPayable !== null
        ? candidateTotalNetPayable
        : Math.max(
            derivedFromRemaining || 0,
            totalNetPayableFromInvoices,
            totalInvoiceAmount,
          );

    // Rest Due Amount: should be netOutstanding that is used on clients/[id]/page.js
    let candidateNetOutstanding = null;
    if (
      props.clientSummary?.netOutstanding !== undefined &&
      props.clientSummary?.netOutstanding !== null
    ) {
      candidateNetOutstanding = Number(props.clientSummary.netOutstanding);
    } else if (
      vars.clientSummary?.netOutstanding !== undefined &&
      vars.clientSummary?.netOutstanding !== null
    ) {
      candidateNetOutstanding = Number(vars.clientSummary.netOutstanding);
    } else if (
      props.paymentInfo?.clientSummary?.netOutstanding !== undefined &&
      props.paymentInfo?.clientSummary?.netOutstanding !== null
    ) {
      candidateNetOutstanding = Number(
        props.paymentInfo.clientSummary.netOutstanding,
      );
    } else if (
      vars.netOutstanding !== undefined &&
      vars.netOutstanding !== null
    ) {
      candidateNetOutstanding = Number(vars.netOutstanding);
    } else if (
      props.paymentInfo?.netOutstanding !== undefined &&
      props.paymentInfo?.netOutstanding !== null
    ) {
      candidateNetOutstanding = Number(props.paymentInfo.netOutstanding);
    } else if (
      vars.restDueAmount !== undefined &&
      vars.restDueAmount !== null
    ) {
      candidateNetOutstanding = Number(vars.restDueAmount);
    } else if (
      props.paymentInfo?.restDueAmount !== undefined &&
      props.paymentInfo?.restDueAmount !== null
    ) {
      candidateNetOutstanding = Number(props.paymentInfo.restDueAmount);
    }

    const remainingOutstanding =
      candidateNetOutstanding !== null
        ? candidateNetOutstanding
        : Math.max(0, netPayableAmount - paymentAmount);

    const totalOutstanding = netPayableAmount;

    const paymentInfo = {
      amount: paymentAmount,
      settledAmount: totalSettledFromInvoices,
      unallocatedAmount,
      totalNetPayable: netPayableAmount,
      netPayableAmount,
      netOutstanding: remainingOutstanding,
      restDueAmount: remainingOutstanding,
      paymentDate:
        vars.paymentDate ||
        props.paymentInfo?.paymentDate ||
        new Date().toISOString(),
      method:
        vars.paymentMethod ||
        props.paymentInfo?.method ||
        props.paymentInfo?.paymentMethod ||
        "Bank Transfer / RTGS / NEFT",
      reference:
        vars.referenceNumber ||
        props.paymentInfo?.reference ||
        props.paymentInfo?.referenceNumber ||
        "N/A",
      totalAccountOutstanding: remainingOutstanding,
      remainingOutstanding,
      totalOutstanding,
    };

    return renderClientStatementEmail({
      client: props.client || {
        companyName: vars.clientName || props.clientName || "Valued Customer",
        name: vars.clientName || props.clientName || "Valued Customer",
      },
      invoices: [],
      settledInvoices: normalizedSettledInvoices,
      company: props.company ||
        vars.company || {
          companyName: vars.senderCompany || "PAFEX Logistics",
          email: vars.senderEmail || "",
          phone: vars.senderPhone || "",
          logoUrl: vars.senderLogo || "",
        },
      reminderType: "SETTLEMENT",
      customNote: props.customNote || vars.customNote || "",
      body: props.body || "",
      actionUrl: props.actionUrl || "",
      paymentInfo,
      totalDue: totalOutstanding,
      clientSummary: props.clientSummary || null,
    });
  }

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

  // Multi-invoice statement events
  const isMultiInvoiceStatement =
    !isExplicitSingleInvoice &&
    ((Array.isArray(props.invoices) && props.invoices.length > 0) ||
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

    let settledInvoicesList =
      vars.settledInvoices || props.settledInvoices || null;
    if (!settledInvoicesList && isExplicitSettlement && vars.invoiceNumber) {
      const rawGross = Number(vars.invoiceAmount || 0);
      const rawNet = Number(vars.netPayableAmount || 0);
      const invFace = rawGross > 0 ? rawGross : rawNet > 0 ? rawNet : 0;
      const netPayable = rawNet > 0 ? rawNet : invFace;
      const pAmt = Number(vars.paymentAmount || 0);
      const remAmt =
        vars.remainingOutstanding !== undefined &&
        vars.remainingOutstanding !== null
          ? Number(vars.remainingOutstanding)
          : vars.outstandingAmount !== undefined &&
              vars.outstandingAmount !== null
            ? Number(vars.outstandingAmount)
            : vars.due !== undefined && vars.due !== null
              ? Number(vars.due)
              : Math.max(0, (netPayable > 0 ? netPayable : invFace) - pAmt);

      settledInvoicesList = [
        {
          invoiceNumber: vars.invoiceNumber,
          invoiceDate: vars.invoiceDate || "",
          invoiceAmount: invFace > 0 ? invFace : pAmt + remAmt,
          netPayableAmount: netPayable > 0 ? netPayable : invFace,
          settledAmount: pAmt,
          remainingBalance: remAmt,
        },
      ];
    }

    const paymentAmount =
      vars.paymentAmount !== undefined
        ? Number(vars.paymentAmount)
        : props.paymentInfo?.amount !== undefined
          ? Number(props.paymentInfo.amount)
          : null;

    const remainingOutstanding =
      vars.remainingOutstanding !== undefined
        ? Number(vars.remainingOutstanding)
        : vars.totalAccountOutstanding !== undefined
          ? Number(vars.totalAccountOutstanding)
          : props.paymentInfo?.remainingOutstanding !== undefined
            ? Number(props.paymentInfo.remainingOutstanding)
            : props.paymentInfo?.totalAccountOutstanding !== undefined
              ? Number(props.paymentInfo.totalAccountOutstanding)
              : props.totalDue !== undefined && props.totalDue !== null
                ? Number(props.totalDue)
                : null;

    const totalOutstanding =
      vars.totalOutstanding !== undefined
        ? Number(vars.totalOutstanding)
        : props.paymentInfo?.totalOutstanding !== undefined
          ? Number(props.paymentInfo.totalOutstanding)
          : remainingOutstanding !== null && paymentAmount !== null
            ? remainingOutstanding + paymentAmount
            : null;

    const paymentInfo =
      isExplicitSettlement ||
      settledInvoicesList ||
      paymentAmount !== null ||
      props.paymentInfo
        ? {
            amount: paymentAmount,
            paymentDate: vars.paymentDate || props.paymentInfo?.paymentDate,
            method:
              vars.paymentMethod ||
              props.paymentInfo?.method ||
              props.paymentInfo?.paymentMethod,
            reference:
              vars.referenceNumber ||
              props.paymentInfo?.reference ||
              props.paymentInfo?.referenceNumber,
            totalAccountOutstanding: remainingOutstanding,
            remainingOutstanding,
            totalOutstanding,
          }
        : null;

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
      reminderType:
        props.reminderType ||
        props.type ||
        (isExplicitSettlement ? "SETTLEMENT" : "STATEMENT"),
      customNote: props.customNote || vars.customNote || "",
      body: props.body || "",
      actionUrl: props.actionUrl || "",
      settledInvoices: settledInvoicesList,
      paymentInfo,
      totalDue: totalOutstanding ?? remainingOutstanding ?? props.totalDue,
      totalNetPayable:
        vars.totalNetPayable ??
        props.totalNetPayable ??
        props.clientSummary?.totalNetPayable ??
        null,
      netOutstanding:
        vars.netOutstanding ??
        props.netOutstanding ??
        remainingOutstanding ??
        props.clientSummary?.netOutstanding ??
        null,
      paymentsReceived:
        vars.paymentsReceived ??
        props.paymentsReceived ??
        props.clientSummary?.paymentsReceived ??
        null,
      onAccountAmount:
        vars.onAccountAmount ??
        vars.onAccount ??
        props.onAccountAmount ??
        props.paymentInfo?.onAccountAmount ??
        props.clientSummary?.onAccountAmount ??
        null,
      unallocatedAmount:
        vars.unallocatedAmount ??
        props.unallocatedAmount ??
        props.paymentInfo?.unallocatedAmount ??
        props.clientSummary?.unallocatedAmount ??
        null,
      overdueCount:
        vars.overdueCount ??
        props.overdueCount ??
        props.clientSummary?.overdueInvoices ??
        null,
      clientSummary: props.clientSummary || vars.clientSummary || null,
    });
  }

  // Single Invoice Fallback
  return renderSingleInvoiceEmail({
    totalNetPayable:
      vars.totalNetPayable ??
      props.totalNetPayable ??
      props.clientSummary?.totalNetPayable ??
      null,
    netOutstanding:
      vars.netOutstanding ??
      props.netOutstanding ??
      props.clientSummary?.netOutstanding ??
      null,
    paymentsReceived:
      vars.paymentsReceived ??
      props.paymentsReceived ??
      props.clientSummary?.paymentsReceived ??
      null,
    clientSummary: props.clientSummary || vars.clientSummary || null,
    invoice: props.invoice || {
      invoiceNumber: vars.invoiceNumber || "",
      invoiceDate: vars.invoiceDate || "",
      dueDate: vars.dueDate || "",
      invoiceAmount: Number(vars.invoiceAmount || 0),
      netPayableAmount: Number(vars.netPayableAmount || 0),
      paidAmount: Number(vars.paidAmount ?? vars.totalPaid ?? vars.paid ?? 0),
      outstandingAmount: Number(
        vars.outstandingAmount ?? vars.due ?? vars.restDueAmount ?? 0,
      ),
      isOverdue: Boolean(vars.isOverdue),
      dueDays: Number(vars.dueDays || vars.overdueDays || 0),
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
