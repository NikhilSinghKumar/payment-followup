import React from "react";
import { Button, Img, Text } from "@react-email/components";

// ======================================================
// Helper formatters
// ======================================================

export const formatMoney = (val) => {
  if (val === undefined || val === null || val === "") return "₹0.00";
  if (typeof val === "number") {
    return `₹${val.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  const str = String(val).trim();
  const cleaned = str.replace(/^(\s|₹|Rs\.?|INR)+/gi, "").trim();
  const num = Number(cleaned.replace(/,/g, ""));
  if (!isNaN(num) && cleaned !== "") {
    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₹${cleaned}`;
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * ======================================================
 * Greeting Component
 * ======================================================
 */
export function Greeting({ clientName = "Valued Customer" }) {
  return (
    <p
      style={{
        margin: "0 0 12px",
        fontSize: "15px",
        color: "#334155",
        lineHeight: 1.6,
      }}
    >
      Dear <strong>{clientName}</strong>,
    </p>
  );
}

/**
 * ======================================================
 * Paragraph Component (handles single or multi-paragraph text)
 * ======================================================
 */
export function Paragraph({ text }) {
  if (!text) return null;
  const paragraphs = String(text)
    .trim()
    .split(/\n\s*\n/);

  return (
    <>
      {paragraphs.map((p, index) => (
        <p
          key={index}
          style={{
            margin: "0 0 16px",
            lineHeight: 1.7,
            color: "#334155",
            fontSize: "15px",
          }}
          dangerouslySetInnerHTML={{
            __html: p.trim().replace(/\n/g, "<br />"),
          }}
        />
      ))}
    </>
  );
}

/**
 * ======================================================
 * Status Banner Component
 * ======================================================
 */
export function StatusBanner({
  title,
  color = "#2563EB",
  background = "#DBEAFE",
}) {
  if (!title) return null;
  return (
    <div
      style={{
        background,
        color,
        padding: "12px 16px",
        borderLeft: `4px solid ${color}`,
        borderRadius: "8px",
        margin: "18px 0",
        fontSize: "15px",
        fontWeight: 600,
      }}
    >
      {title}
    </div>
  );
}

/**
 * ======================================================
 * Bank & Payment Details Component
 * ======================================================
 */
export function BankDetails({ company }) {
  if (!company) return null;
  const hasBank = Boolean(
    company.bankName ||
    company.bankAccountNumber ||
    company.bankIfsc ||
    company.bankUpi,
  );
  if (!hasBank) return null;

  return (
    <div
      style={{
        margin: "20px 0",
        padding: "16px 20px",
        background: "#F8FAFC",
        border: "1px dashed #CBD5E1",
        borderRadius: "10px",
        fontSize: "13px",
        color: "#334155",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#0F172A",
          marginBottom: "10px",
          borderBottom: "1px solid #E2E8F0",
          paddingBottom: "6px",
        }}
      >
        Bank & Payment Details
      </div>
      <table
        width="100%"
        cellPadding="4"
        cellSpacing="0"
        border="0"
        style={{ fontSize: "13px", color: "#334155", lineHeight: 1.6 }}
      >
        <tbody>
          {company.bankName && (
            <tr>
              <td style={{ width: "130px", color: "#64748B" }}>Bank Name:</td>
              <td>
                <strong style={{ color: "#0F172A" }}>{company.bankName}</strong>
              </td>
            </tr>
          )}
          {company.bankAccountNumber && (
            <tr>
              <td style={{ color: "#64748B" }}>Account No:</td>
              <td>
                <strong
                  style={{
                    fontFamily: "monospace",
                    fontSize: "14px",
                    color: "#0F172A",
                  }}
                >
                  {company.bankAccountNumber}
                </strong>
              </td>
            </tr>
          )}
          {company.bankIfsc && (
            <tr>
              <td style={{ color: "#64748B" }}>IFSC Code:</td>
              <td>
                <strong style={{ fontFamily: "monospace", color: "#0F172A" }}>
                  {company.bankIfsc}
                </strong>
              </td>
            </tr>
          )}
          {company.bankBranch && (
            <tr>
              <td style={{ color: "#64748B" }}>Branch:</td>
              <td>{company.bankBranch}</td>
            </tr>
          )}
          {company.bankUpi && (
            <tr>
              <td style={{ color: "#64748B" }}>UPI ID:</td>
              <td>
                <strong style={{ fontFamily: "monospace", color: "#2563EB" }}>
                  {company.bankUpi}
                </strong>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * ======================================================
 * Custom Note Box Component
 * ======================================================
 */
export function CustomNote({ note, color = "#2563EB" }) {
  if (!note || !note.trim()) return null;
  return (
    <div
      style={{
        margin: "18px 0",
        padding: "12px 16px",
        background: "#F8FAFC",
        borderLeft: `4px solid ${color}`,
        borderRadius: "6px",
        fontSize: "13px",
        color: "#334155",
        lineHeight: 1.6,
      }}
    >
      <strong
        style={{
          color: "#0F172A",
          display: "block",
          marginBottom: "4px",
          fontSize: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        Note from Sender:
      </strong>
      <span
        dangerouslySetInnerHTML={{
          __html: note.trim().replace(/\n/g, "<br/>"),
        }}
      />
    </div>
  );
}

/**
 * ======================================================
 * Single Invoice Summary Card Component
 * ======================================================
 */
export function InvoiceSummary({
  invoiceNumber,
  invoiceDate,
  dueDate,
  invoiceAmount,
  paidAmount,
  outstandingAmount,
  showPaymentDetails = true,
  awbs = [],
  isOverdue = false,
  dueDaysText = "",
}) {
  const formattedInvoiceAmount = formatMoney(invoiceAmount);
  const formattedPaidAmount = formatMoney(paidAmount);
  const formattedBalanceDue = formatMoney(
    outstandingAmount !== undefined &&
      outstandingAmount !== null &&
      outstandingAmount !== ""
      ? outstandingAmount
      : invoiceAmount,
  );

  const awbText =
    Array.isArray(awbs) && awbs.length > 0
      ? awbs
          .map((a) => (typeof a === "object" ? a.awbNumber : a))
          .filter(Boolean)
          .join(", ")
      : "";

  const hasPaid =
    showPaymentDetails &&
    paidAmount !== undefined &&
    paidAmount !== null &&
    Number(String(paidAmount).replace(/[^0-9.-]+/g, "")) > 0;

  return (
    <table
      width="100%"
      cellPadding="8"
      cellSpacing="0"
      border="0"
      style={{
        margin: "18px 0",
        border: "1px solid #E2E8F0",
        borderRadius: "10px",
        overflow: "hidden",
        borderCollapse: "collapse",
      }}
    >
      <tbody>
        <tr>
          <td
            colSpan={2}
            style={{
              background: "#F8FAFC",
              fontSize: "15px",
              fontWeight: "bold",
              color: "#0F172A",
              borderBottom: "1px solid #E2E8F0",
              padding: "10px 12px",
            }}
          >
            Invoice Details Summary
          </td>
        </tr>

        <tr>
          <td
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #F1F5F9",
              color: "#64748B",
              width: "150px",
            }}
          >
            <strong>Invoice Number</strong>
          </td>
          <td
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #F1F5F9",
              fontWeight: 600,
              color: "#0F172A",
            }}
          >
            {invoiceNumber}
          </td>
        </tr>

        {invoiceDate && (
          <tr>
            <td
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #F1F5F9",
                color: "#64748B",
              }}
            >
              <strong>Invoice Date</strong>
            </td>
            <td
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #F1F5F9",
                color: "#334155",
              }}
            >
              {invoiceDate}
            </td>
          </tr>
        )}

        <tr>
          <td
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #F1F5F9",
              color: "#64748B",
            }}
          >
            <strong>Due Date</strong>
          </td>
          <td
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #F1F5F9",
              color: isOverdue ? "#DC2626" : "#334155",
              fontWeight: isOverdue ? 700 : 500,
            }}
          >
            {dueDate} {dueDaysText ? `(${dueDaysText})` : ""}
          </td>
        </tr>

        {awbText ? (
          <tr>
            <td
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #F1F5F9",
                color: "#64748B",
              }}
            >
              <strong>AWBs / Dockets</strong>
            </td>
            <td
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #F1F5F9",
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#334155",
              }}
            >
              {awbText}
            </td>
          </tr>
        ) : null}

        <tr>
          <td
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #F1F5F9",
              color: "#64748B",
            }}
          >
            <strong>Invoice Amount</strong>
          </td>
          <td
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #F1F5F9",
              fontWeight: 600,
              color: "#0F172A",
              whiteSpace: "nowrap",
            }}
          >
            {formattedInvoiceAmount}
          </td>
        </tr>

        {hasPaid && (
          <tr>
            <td
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #F1F5F9",
                color: "#64748B",
              }}
            >
              <strong>Paid Amount</strong>
            </td>
            <td
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #F1F5F9",
                color: "#16A34A",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {formattedPaidAmount}
            </td>
          </tr>
        )}

        <tr>
          <td
            style={{
              padding: "12px",
              background: "#F8FAFC",
              fontWeight: 700,
              color: "#0F172A",
              fontSize: "14px",
            }}
          >
            <strong>Balance Due</strong>
          </td>
          <td
            style={{
              padding: "12px",
              background: "#F8FAFC",
              fontWeight: "bold",
              fontSize: "16px",
              color: "#2563EB",
              whiteSpace: "nowrap",
            }}
          >
            {formattedBalanceDue}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * ======================================================
 * Alert Box Component
 * ======================================================
 */
export function AlertBox({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        margin: "18px 0",
        padding: "14px 16px",
        background: "#FEF3C7",
        borderLeft: "4px solid #F59E0B",
        borderRadius: "8px",
        color: "#92400E",
        fontSize: "14px",
      }}
      dangerouslySetInnerHTML={{ __html: message }}
    />
  );
}

/**
 * ======================================================
 * CTA Button Component (React Email Button)
 * ======================================================
 */
export function EmailButton({ text, url }) {
  if (!url) return null;
  return (
    <div style={{ textAlign: "center", margin: "22px 0" }}>
      <Button
        href={url}
        style={{
          background: "#2563EB",
          padding: "12px 24px",
          color: "#ffffff",
          textDecoration: "none",
          borderRadius: "8px",
          display: "inline-block",
          fontWeight: "bold",
          fontSize: "15px",
        }}
      >
        {text}
      </Button>
    </div>
  );
}

/**
 * ======================================================
 * Email Signature Component
 * ======================================================
 */
export function Signature({
  senderCompany,
  senderEmail,
  senderPhone,
  senderLogo,
}) {
  let logoSrc = senderLogo;
  if (
    !logoSrc ||
    logoSrc.includes("payfolo.vercel.app") ||
    logoSrc === "/pafex_logo.png" ||
    logoSrc === "pafex_logo.png" ||
    logoSrc.startsWith("/") ||
    logoSrc.includes("cid:")
  ) {
    logoSrc = "https://pafex.in/assets/img/logo.png";
  }

  return (
    <div
      style={{
        marginTop: "22px",
        lineHeight: 1.6,
        color: "#334155",
      }}
    >
      Warm Regards,
      <br />
      <br />
      <strong>{senderCompany || "Prakash Air Freight India Pvt Ltd"}</strong>
      <br />
      Email: {senderEmail || "accounts@pafex.in"}
      <br />
      Mobile: {senderPhone || "9289901837"}
      <br />
      <br />
      {logoSrc && (
        <Img
          src={logoSrc}
          alt={senderCompany || "PAFEX"}
          width="140"
          style={{
            display: "block",
            border: 0,
            marginTop: "6px",
            maxWidth: "160px",
            height: "auto",
          }}
        />
      )}
    </div>
  );
}

/**
 * ======================================================
 * Client Outstanding Invoices Table Component
 * Multi-invoice statement view with horizontal scrolling
 * ======================================================
 */
export function ClientOutstandingInvoices({
  invoices = [],
  overallDue = null,
  paymentDeduction = null,
  restDueAmount = null,
  totalNetPayable = null,
  paymentsReceived = null,
  netOutstanding = null,
  unallocatedAmount = null,
  onAccountAmount = null,
  clientSummary = null,
  showSummaryCards = true,
}) {
  const invoiceList = Array.isArray(invoices) ? invoices : [];

  const totals = invoiceList.reduce(
    (summary, invoice) => {
      const rawGross = Number(invoice.invoiceAmount || 0);
      const rawNet = Number(invoice.netPayableAmount || 0);
      const invNetPayable =
        rawNet > 0
          ? rawNet
          : rawGross > 0
            ? rawGross
            : Number(invoice.overallDue || 0);
      const paidAmt = Number(
        invoice.paymentDeduction !== undefined &&
          invoice.paymentDeduction !== null
          ? invoice.paymentDeduction
          : (invoice.paidAmount ?? invoice.paid ?? 0),
      );
      const restDue = Number(
        invoice.restDueAmount !== undefined && invoice.restDueAmount !== null
          ? invoice.restDueAmount
          : invoice.outstandingAmount !== undefined &&
              invoice.outstandingAmount !== null
            ? invoice.outstandingAmount
            : invoice.due !== undefined && invoice.due !== null
              ? invoice.due
              : Math.max(0, invNetPayable - paidAmt),
      );

      summary.invoiceAmount += rawGross > 0 ? rawGross : invNetPayable;
      summary.netPayableAmount += invNetPayable;
      summary.paidAmount += paidAmt;
      summary.outstandingAmount += restDue;
      return summary;
    },
    {
      invoiceAmount: 0,
      netPayableAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
    },
  );

  // 1. "Net Payable Amount" for client matches totalNetPayable from clients/[id]/page.js
  const displayOverall =
    totalNetPayable !== null && totalNetPayable !== undefined
      ? Number(totalNetPayable)
      : overallDue !== null && overallDue !== undefined
        ? Number(overallDue)
        : totals.netPayableAmount > 0
          ? totals.netPayableAmount
          : totals.invoiceAmount;

  // 2. "Payment Received" for client matches paymentsReceived from clients/[id]/page.js
  const displayDeduction =
    paymentsReceived !== null && paymentsReceived !== undefined
      ? Number(paymentsReceived)
      : paymentDeduction !== null && paymentDeduction !== undefined
        ? Number(paymentDeduction)
        : totals.paidAmount;

  // 3. "Rest Due Amount" for client matches netOutstanding from clients/[id]/page.js
  const displayRestDue =
    netOutstanding !== null && netOutstanding !== undefined
      ? Number(netOutstanding)
      : restDueAmount !== null && restDueAmount !== undefined
        ? Number(restDueAmount)
        : Math.max(0, displayOverall - displayDeduction);

  // 4. Resolve unallocated on-account payment amount
  const resolvedUnallocated = Math.max(
    0,
    Number(
      unallocatedAmount !== null && unallocatedAmount !== undefined
        ? unallocatedAmount
        : onAccountAmount !== null && onAccountAmount !== undefined
          ? onAccountAmount
          : clientSummary?.onAccountAmount !== undefined &&
              clientSummary?.onAccountAmount !== null
            ? clientSummary.onAccountAmount
            : totals.outstandingAmount > displayRestDue && displayRestDue > 0
              ? totals.outstandingAmount - displayRestDue
              : 0,
    ),
  );

  const hasAnyOverdue = invoiceList.some(
    (inv) =>
      inv.isOverdue ||
      Number(inv.dueDays || inv.agingDays || 0) > 0 ||
      inv.agingStatus?.toLowerCase().includes("overdue"),
  );

  if (!invoiceList.length) {
    return (
      <div style={{ margin: "20px 0" }}>
        {showSummaryCards && (
          <AccountFinancialSummary
            overallDue={displayOverall}
            paymentDeduction={displayDeduction}
            restDueAmount={displayRestDue}
            totalNetPayable={displayOverall}
            paymentsReceived={displayDeduction}
            netOutstanding={displayRestDue}
            onAccountAmount={resolvedUnallocated}
            unallocatedAmount={resolvedUnallocated}
            isOverdue={hasAnyOverdue}
          />
        )}
        <div
          style={{
            padding: "16px",
            border: "1px dashed #CBD5E1",
            borderRadius: "8px",
            backgroundColor: "#F8FAFC",
            textAlign: "center",
            color: "#64748B",
            fontSize: "13px",
          }}
        >
          No pending or overdue invoices found on record.
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: "20px 0" }}>
      {showSummaryCards && (
        <AccountFinancialSummary
          overallDue={displayOverall}
          paymentDeduction={displayDeduction}
          restDueAmount={displayRestDue}
          totalNetPayable={displayOverall}
          paymentsReceived={displayDeduction}
          netOutstanding={displayRestDue}
          onAccountAmount={resolvedUnallocated}
          unallocatedAmount={resolvedUnallocated}
          isOverdue={hasAnyOverdue}
        />
      )}
      <div
        style={{
          marginBottom: "8px",
          fontSize: "15px",
          fontWeight: 700,
          color: "#0F172A",
        }}
      >
        Outstanding Invoices & Ledger Breakdown
      </div>

      <div
        className="responsive-table-scroll"
        style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          border: "1px solid #E2E8F0",
          borderRadius: "10px",
        }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          border="0"
          style={{
            width: "100%",
            minWidth: "600px",
            borderCollapse: "collapse",
            background: "#ffffff",
          }}
        >
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th
                align="left"
                style={{
                  padding: "11px 8px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Invoice #
              </th>
              <th
                align="left"
                style={{
                  padding: "11px 8px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Date
              </th>
              <th
                align="left"
                style={{
                  padding: "11px 8px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Due Date
              </th>
              <th
                align="right"
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Invoice Amount (₹)
              </th>
              <th
                align="right"
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#16A34A",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Payment Received (₹)
              </th>
              <th
                align="right"
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #E2E8F0",
                  color: hasAnyOverdue ? "#DC2626" : "#0F172A",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Rest Due Amount (₹)
              </th>
              <th
                align="left"
                style={{
                  padding: "11px 8px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Aging / Status
              </th>
              <th
                align="center"
                style={{
                  padding: "11px 8px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Credit Days
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceList.map((invoice, index) => {
              let creditDays = Number(invoice.creditDays || 0);
              if (!creditDays && invoice.invoiceDate && invoice.dueDate) {
                const invD = new Date(invoice.invoiceDate);
                const dueD = new Date(invoice.dueDate);
                invD.setHours(0, 0, 0, 0);
                dueD.setHours(0, 0, 0, 0);
                creditDays = Math.max(
                  0,
                  Math.round(
                    (dueD.getTime() - invD.getTime()) / (1000 * 60 * 60 * 24),
                  ),
                );
              }

              const rawGross = Number(invoice.invoiceAmount || 0);
              const rawNet = Number(invoice.netPayableAmount || 0);
              const invOverall =
                rawGross > 0
                  ? rawGross
                  : rawNet > 0
                    ? rawNet
                    : Number(invoice.overallDue || 0);
              const invDeduction = Number(
                invoice.paymentDeduction !== undefined &&
                  invoice.paymentDeduction !== null
                  ? invoice.paymentDeduction
                  : (invoice.paidAmount ?? invoice.paid ?? 0),
              );
              const invRestDue = Number(
                invoice.restDueAmount !== undefined &&
                  invoice.restDueAmount !== null
                  ? invoice.restDueAmount
                  : invoice.outstandingAmount !== undefined &&
                      invoice.outstandingAmount !== null
                    ? invoice.outstandingAmount
                    : invoice.due !== undefined && invoice.due !== null
                      ? invoice.due
                      : Math.max(
                          0,
                          (rawNet > 0 ? rawNet : invOverall) - invDeduction,
                        ),
              );

              const isInvOverdue = Boolean(
                invoice.isOverdue ||
                Number(invoice.dueDays || invoice.agingDays || 0) > 0 ||
                invoice.agingStatus?.toLowerCase().includes("overdue"),
              );

              const rowBg = index % 2 === 1 ? "#F8FAFC" : "#FFFFFF";

              return (
                <tr key={index} style={{ backgroundColor: rowBg }}>
                  <td
                    style={{
                      padding: "10px 10px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#0F172A",
                      fontSize: "13px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {invoice.invoiceNumber || "—"}
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#475569",
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(invoice.invoiceDate)}
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      borderBottom: "1px solid #E2E8F0",
                      color: isInvOverdue ? "#DC2626" : "#475569",
                      fontSize: "12px",
                      fontWeight: isInvOverdue ? 700 : 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#334155",
                      fontSize: "13px",
                      fontWeight: 600,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(invOverall)}
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#16A34A",
                      fontSize: "13px",
                      fontWeight: 600,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(invDeduction)}
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      borderBottom: "1px solid #E2E8F0",
                      color: isInvOverdue ? "#DC2626" : "#0F172A",
                      fontSize: "13px",
                      fontWeight: 700,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(invRestDue)}
                  </td>
                  <td
                    style={{
                      padding: "10px 10px",
                      borderBottom: "1px solid #E2E8F0",
                      fontSize: "12px",
                      fontWeight: 600,
                      color:
                        invoice.agingColor ||
                        (isInvOverdue ? "#DC2626" : "#334155"),
                      whiteSpace: "nowrap",
                    }}
                  >
                    {invoice.agingStatus ||
                      (isInvOverdue
                        ? `${invoice.dueDays || 0}d Overdue`
                        : "Current")}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#64748B",
                      fontSize: "12px",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {creditDays} days
                  </td>
                </tr>
              );
            })}

            {/* Total Row: Handles unallocated/on-account amounts when present */}
            {resolvedUnallocated > 0 ? (
              <>
                {/* 1. Subtotal of open invoices */}
                <tr
                  style={{
                    background: "#F8FAFC",
                    borderTop: "2px solid #CBD5E1",
                    fontWeight: 600,
                  }}
                >
                  <td
                    colSpan={3}
                    style={{
                      padding: "9px 10px",
                      color: "#475569",
                      fontSize: "12px",
                      textAlign: "right",
                    }}
                  >
                    Invoices Balance Subtotal:
                  </td>
                  <td
                    style={{
                      padding: "9px 10px",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 600,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totals.invoiceAmount)}
                  </td>
                  <td
                    style={{
                      padding: "9px 10px",
                      color: "#16A34A",
                      fontSize: "12px",
                      fontWeight: 600,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totals.paidAmount)}
                  </td>
                  <td
                    style={{
                      padding: "9px 10px",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 600,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totals.outstandingAmount)}
                  </td>
                  <td
                    colSpan={2}
                    style={{
                      padding: "9px 8px",
                      color: "#64748B",
                      fontSize: "11px",
                      fontStyle: "italic",
                    }}
                  >
                    Gross Invoices Due
                  </td>
                </tr>

                {/* 2. Unallocated / On-Account credit adjustment row */}
                <tr
                  style={{
                    background: "#F0FDF4",
                    borderTop: "1px dashed #86EFAC",
                    fontWeight: 600,
                  }}
                >
                  <td
                    colSpan={3}
                    style={{
                      padding: "9px 10px",
                      color: "#166534",
                      fontSize: "12px",
                      textAlign: "right",
                    }}
                  >
                    Less: Unallocated Payment (On-Account Credit):
                  </td>
                  <td
                    style={{
                      padding: "9px 10px",
                      color: "#166534",
                      fontSize: "12px",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    —
                  </td>
                  <td
                    style={{
                      padding: "9px 10px",
                      color: "#16A34A",
                      fontSize: "12px",
                      fontWeight: 700,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    +{formatCurrency(resolvedUnallocated)}
                  </td>
                  <td
                    style={{
                      padding: "9px 10px",
                      color: "#16A34A",
                      fontSize: "12px",
                      fontWeight: 700,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    -{formatCurrency(resolvedUnallocated)}
                  </td>
                  <td
                    colSpan={2}
                    style={{
                      padding: "9px 8px",
                      color: "#166534",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Credit Held on Ledger
                  </td>
                </tr>

                {/* 3. Reconciled Net Rest Due Row */}
                <tr
                  style={{
                    background: "#F8FAFC",
                    borderTop: "2px solid #0F172A",
                    fontWeight: 700,
                  }}
                >
                  <td
                    colSpan={3}
                    style={{
                      padding: "11px 10px",
                      color: "#0F172A",
                      fontSize: "13px",
                      textAlign: "right",
                    }}
                  >
                    Total Net Rest Due:
                  </td>
                  <td
                    style={{
                      padding: "11px 10px",
                      color: "#334155",
                      fontSize: "13px",
                      fontWeight: 700,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totals.invoiceAmount)}
                  </td>
                  <td
                    style={{
                      padding: "11px 10px",
                      color: "#16A34A",
                      fontSize: "13px",
                      fontWeight: 700,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(displayDeduction)}
                  </td>
                  <td
                    style={{
                      padding: "11px 10px",
                      color: hasAnyOverdue ? "#DC2626" : "#0F172A",
                      fontSize: "13px",
                      fontWeight: 700,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(displayRestDue)}
                  </td>
                  <td
                    colSpan={2}
                    style={{
                      padding: "11px 8px",
                      color: hasAnyOverdue ? "#DC2626" : "#0F172A",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {hasAnyOverdue ? "Net Overdue" : "Net Due"}
                  </td>
                </tr>
              </>
            ) : (
              /* Standard total row when no unallocated balance */
              <tr
                style={{
                  background: "#F8FAFC",
                  borderTop: "2px solid #CBD5E1",
                  fontWeight: 700,
                }}
              >
                <td
                  colSpan={3}
                  style={{
                    padding: "11px 10px",
                    color: "#0F172A",
                    fontSize: "13px",
                    textAlign: "right",
                  }}
                >
                  Total Account Dues:
                </td>
                <td
                  style={{
                    padding: "11px 10px",
                    color: "#334155",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "right",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(totals.invoiceAmount)}
                </td>
                <td
                  style={{
                    padding: "11px 10px",
                    color: "#16A34A",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "right",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(displayDeduction)}
                </td>
                <td
                  style={{
                    padding: "11px 10px",
                    color: hasAnyOverdue ? "#DC2626" : "#0F172A",
                    fontSize: "13px",
                    fontWeight: 700,
                    textAlign: "right",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(displayRestDue)}
                </td>
                <td
                  colSpan={2}
                  style={{
                    padding: "11px 8px",
                    color: hasAnyOverdue ? "#DC2626" : "#475569",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {hasAnyOverdue ? "Overdue" : "Current"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {resolvedUnallocated > 0 && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderLeft: "4px solid #16A34A",
            borderRadius: "6px",
            padding: "10px 14px",
            marginTop: "12px",
            fontSize: "12px",
            color: "#166534",
            lineHeight: 1.5,
          }}
        >
          <strong>On-Account Credit Applied:</strong> An unallocated payment of{" "}
          <strong>{formatCurrency(resolvedUnallocated)}</strong> is credited on
          your ledger and adjusted against your pending dues, reducing net rest
          due to <strong>{formatCurrency(displayRestDue)}</strong>.
        </div>
      )}
    </div>
  );
}

/**
 * ======================================================
 * Universal 3-Card Financial Summary Strip
 * Displays: Invoice Amount, Payment Received, Rest Due Amount
 * ======================================================
 */
export function AccountFinancialSummary({
  overallDue = 0,
  paymentDeduction = 0,
  restDueAmount = 0,
  totalNetPayable = null,
  paymentsReceived = null,
  netOutstanding = null,
  onAccountAmount = null,
  unallocatedAmount = null,
  overallLabel = "Net Payable Amount",
  deductionLabel = "Payment Received",
  restLabel = "Rest Due Amount",
  overallSubtext = "Total Net Payable",
  deductionSubtext = "Paid / Credited",
  restSubtext = "Net Outstanding",
  isOverdue = false,
  isSettlement = false,
}) {
  const parsedOverall = Math.max(
    0,
    Number(
      totalNetPayable !== null && totalNetPayable !== undefined
        ? totalNetPayable
        : overallDue || 0,
    ),
  );
  const parsedDeduction = Math.max(
    0,
    Number(
      paymentsReceived !== null && paymentsReceived !== undefined
        ? paymentsReceived
        : paymentDeduction || 0,
    ),
  );
  const parsedRest = Math.max(
    0,
    Number(
      netOutstanding !== null && netOutstanding !== undefined
        ? netOutstanding
        : restDueAmount !== undefined && restDueAmount !== null
          ? restDueAmount
          : parsedOverall - parsedDeduction,
    ),
  );
  const parsedOnAccount = Math.max(
    0,
    Number(
      onAccountAmount !== null && onAccountAmount !== undefined
        ? onAccountAmount
        : unallocatedAmount !== null && unallocatedAmount !== undefined
          ? unallocatedAmount
          : 0,
    ),
  );
  const isZeroRest = parsedRest <= 0;

  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      border="0"
      style={{
        margin: "16px 0 16px 0",
        borderCollapse: "separate",
        borderSpacing: "8px 0",
        tableLayout: "fixed",
      }}
    >
      <tbody>
        <tr>
          {/* Card 1: Invoice Amount */}
          <td
            width="33.33%"
            valign="top"
            style={{
              background: "#F8FAFC",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              padding: "12px 10px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                marginBottom: "4px",
              }}
            >
              {overallLabel}
            </div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "#0F172A",
                lineHeight: 1.25,
                marginBottom: "4px",
                wordBreak: "break-word",
              }}
            >
              {formatCurrency(parsedOverall)}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#64748B",
                fontWeight: 500,
              }}
            >
              {overallSubtext}
            </div>
          </td>

          {/* Card 2: Payment Received */}
          <td
            width="33.33%"
            valign="top"
            style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "8px",
              padding: "12px 10px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#166534",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                marginBottom: "4px",
              }}
            >
              {deductionLabel}
            </div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: "#16A34A",
                lineHeight: 1.25,
                marginBottom: "4px",
                wordBreak: "break-word",
              }}
            >
              {formatCurrency(parsedDeduction)}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#15803D",
                fontWeight: 600,
              }}
            >
              {parsedDeduction > 0
                ? parsedOnAccount > 0
                  ? `✓ ${deductionSubtext} (incl. ${formatCurrency(parsedOnAccount)} on-account)`
                  : `✓ ${deductionSubtext}`
                : "Nil / Unpaid"}
            </div>
          </td>

          {/* Card 3: Rest Due Amount */}
          <td
            width="33.33%"
            valign="top"
            style={{
              background: isZeroRest
                ? "#ECFDF5"
                : isOverdue
                  ? "#FEF2F2"
                  : "#FFFBEB",
              border: `1px solid ${isZeroRest ? "#A7F3D0" : isOverdue ? "#FECACA" : "#FED7AA"}`,
              borderRadius: "8px",
              padding: "12px 10px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: isZeroRest
                  ? "#047857"
                  : isOverdue
                    ? "#B91C1C"
                    : "#9A3412",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                marginBottom: "4px",
              }}
            >
              {restLabel}
            </div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: 800,
                color: isZeroRest
                  ? "#059669"
                  : isOverdue
                    ? "#DC2626"
                    : "#C2410C",
                lineHeight: 1.25,
                marginBottom: "4px",
                wordBreak: "break-word",
              }}
            >
              {formatCurrency(parsedRest)}
            </div>
            <div
              style={{
                fontSize: "11px",
                color: isZeroRest
                  ? "#047857"
                  : isOverdue
                    ? "#B91C1C"
                    : "#B45309",
                fontWeight: 600,
              }}
            >
              {isZeroRest
                ? "All Dues Cleared 🎉"
                : isOverdue
                  ? "⚠️ Overdue for Payment"
                  : restSubtext}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * ======================================================
 * Single Invoice Data Table Component (Table Format)
 * Displays structured horizontal table for single invoice with Invoice Amount, Payment Received, Rest Due Amount
 * ======================================================
 */
export function SingleInvoiceDataTable({
  invoice = {},
  overallDue = 0,
  paymentDeduction = 0,
  restDueAmount = 0,
  awbs = [],
  isOverdue = false,
  dueDaysText = "",
}) {
  const rawGross = Number(invoice.invoiceAmount || 0);
  const rawNet = Number(invoice.netPayableAmount || 0);
  const parsedOverall =
    rawGross > 0
      ? rawGross
      : rawNet > 0
        ? rawNet
        : Number(overallDue || invoice.overallDue || 0);

  const parsedDeduction = Number(
    paymentDeduction !== undefined && paymentDeduction !== null
      ? paymentDeduction
      : invoice.paymentDeduction !== undefined &&
          invoice.paymentDeduction !== null
        ? invoice.paymentDeduction
        : (invoice.paidAmount ?? invoice.paid ?? 0),
  );

  const parsedRest = Number(
    restDueAmount !== undefined && restDueAmount !== null
      ? restDueAmount
      : invoice.restDueAmount !== undefined && invoice.restDueAmount !== null
        ? invoice.restDueAmount
        : invoice.outstandingAmount !== undefined &&
            invoice.outstandingAmount !== null
          ? invoice.outstandingAmount
          : invoice.due !== undefined && invoice.due !== null
            ? invoice.due
            : Math.max(
                0,
                (rawNet > 0 ? rawNet : parsedOverall) - parsedDeduction,
              ),
  );

  const awbText =
    Array.isArray(awbs) && awbs.length > 0
      ? awbs
          .map((a) => (typeof a === "object" ? a.awbNumber : a))
          .filter(Boolean)
          .join(", ")
      : "";

  const statusText =
    invoice.agingStatus ||
    (isOverdue
      ? dueDaysText ||
        (invoice.dueDays ? `${invoice.dueDays}d Overdue` : "Overdue")
      : invoice.isDueToday
        ? "Due Today"
        : parsedRest <= 0
          ? "Fully Paid"
          : "Active / Due");

  const statusColor = isOverdue
    ? "#DC2626"
    : invoice.isDueToday
      ? "#D97706"
      : parsedRest <= 0
        ? "#16A34A"
        : "#2563EB";

  const statusBg = isOverdue
    ? "#FEE2E2"
    : invoice.isDueToday
      ? "#FEF3C7"
      : parsedRest <= 0
        ? "#DCFCE7"
        : "#DBEAFE";

  return (
    <div style={{ margin: "20px 0" }}>
      <div
        style={{
          marginBottom: "8px",
          fontSize: "15px",
          fontWeight: 700,
          color: "#0F172A",
        }}
      >
        Invoice Details
      </div>

      <div
        className="responsive-table-scroll"
        style={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          border: "1px solid #CBD5E1",
          borderRadius: "8px",
        }}
      >
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          border="0"
          style={{
            width: "100%",
            minWidth: "600px",
            borderCollapse: "collapse",
            background: "#ffffff",
          }}
        >
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th
                align="left"
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #CBD5E1",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Invoice No.
              </th>
              <th
                align="left"
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #CBD5E1",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Invoice Date
              </th>
              <th
                align="left"
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #CBD5E1",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Due Date
              </th>
              <th
                align="right"
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #CBD5E1",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Invoice Amount (₹)
              </th>
              <th
                align="right"
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #CBD5E1",
                  color: "#16A34A",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Payment Received (₹)
              </th>
              <th
                align="right"
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #CBD5E1",
                  color: isOverdue ? "#DC2626" : "#0F172A",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Rest Due Amount (₹)
              </th>
              <th
                align="center"
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #CBD5E1",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#0F172A",
                  fontSize: "13px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {invoice.invoiceNumber || "—"}
              </td>
              <td
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(invoice.invoiceDate)}
              </td>
              <td
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #E2E8F0",
                  color: isOverdue ? "#DC2626" : "#475569",
                  fontSize: "12px",
                  fontWeight: isOverdue ? 700 : 500,
                  whiteSpace: "nowrap",
                }}
              >
                {formatDate(invoice.dueDate)}
              </td>
              <td
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 600,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(parsedOverall)}
              </td>
              <td
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#16A34A",
                  fontSize: "13px",
                  fontWeight: 600,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(parsedDeduction)}
              </td>
              <td
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #E2E8F0",
                  color: isOverdue ? "#DC2626" : "#0F172A",
                  fontSize: "13px",
                  fontWeight: 700,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(parsedRest)}
              </td>
              <td
                style={{
                  padding: "11px 10px",
                  borderBottom: "1px solid #E2E8F0",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: statusColor,
                    background: statusBg,
                  }}
                >
                  {statusText}
                </span>
              </td>
            </tr>

            {/* Total Row */}
            <tr
              style={{
                background: "#F8FAFC",
                borderTop: "2px solid #CBD5E1",
                fontWeight: 700,
              }}
            >
              <td
                colSpan={3}
                style={{
                  padding: "11px 10px",
                  color: "#0F172A",
                  fontSize: "13px",
                  textAlign: "right",
                }}
              >
                Total Invoice Balance:
              </td>
              <td
                style={{
                  padding: "11px 10px",
                  color: "#334155",
                  fontSize: "13px",
                  fontWeight: 700,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(parsedOverall)}
              </td>
              <td
                style={{
                  padding: "11px 10px",
                  color: "#16A34A",
                  fontSize: "13px",
                  fontWeight: 700,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(parsedDeduction)}
              </td>
              <td
                style={{
                  padding: "11px 10px",
                  color: isOverdue ? "#DC2626" : "#0F172A",
                  fontSize: "13px",
                  fontWeight: 700,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(parsedRest)}
              </td>
              <td style={{ background: "#F8FAFC" }} />
            </tr>

            {/* Optional AWB Details */}
            {awbText ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "9px 12px",
                    background: "#F1F5F9",
                    color: "#475569",
                    fontSize: "12px",
                    borderTop: "1px solid #E2E8F0",
                  }}
                >
                  <strong style={{ color: "#0F172A" }}>AWBs / Dockets: </strong>
                  <span style={{ fontFamily: "monospace", fontSize: "11px" }}>
                    {awbText}
                  </span>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * ======================================================
 * 3-Card Payment & Account Balance Summary Strip
 * Displays Total Outstanding (Invoice Amount), Payment Received, and Remaining Outstanding (Rest Due)
 * ======================================================
 */
export function PaymentAccountBalanceSummary({
  totalOutstanding = 0,
  paymentAmount = 0,
  remainingOutstanding = 0,
  overallLabel = "Invoice Amount",
  deductionLabel = "Payment Received",
  restLabel = "Rest Due Amount",
  overallSubtext = "",
  deductionSubtext = "",
  restSubtext = "",
}) {
  return (
    <AccountFinancialSummary
      overallDue={totalOutstanding}
      paymentDeduction={paymentAmount}
      restDueAmount={remainingOutstanding}
      overallLabel={overallLabel}
      deductionLabel={deductionLabel}
      restLabel={restLabel}
      overallSubtext={overallSubtext}
      deductionSubtext={deductionSubtext}
      restSubtext={restSubtext}
      isSettlement={true}
    />
  );
}

/**
 * ======================================================
 * Client Payment Received Settlement Table Component
 * Multi/single invoice settlement breakdown with 3-card balance summary
 * ======================================================
 */
export function ClientPaymentSettlementTable({
  settledInvoices = [],
  paymentInfo = {},
  totalAccountOutstanding = null,
  totalOutstanding = null,
  remainingOutstanding = null,
}) {
  const hasInvoices =
    Array.isArray(settledInvoices) && settledInvoices.length > 0;

  const rows = (hasInvoices ? settledInvoices : []).map((inv) => {
    const rawGross = Number(inv.invoiceAmount || 0);
    const rawNet = Number(inv.netPayableAmount || 0);
    const settled = Number(
      inv.settledAmount ??
        inv.amountSettled ??
        inv.allocatedAmount ??
        inv.paidAmount ??
        0,
    );
    const rem =
      inv.remainingBalance !== undefined && inv.remainingBalance !== null
        ? Number(inv.remainingBalance)
        : inv.outstandingAmount !== undefined && inv.outstandingAmount !== null
          ? Number(inv.outstandingAmount)
          : inv.due !== undefined && inv.due !== null
            ? Number(inv.due)
            : null;

    let invTotal =
      rawGross > 0
        ? rawGross
        : rawNet > 0
          ? rawNet
          : Number(inv.totalAmount || 0);

    if (invTotal <= 0 && (settled > 0 || (rem !== null && rem > 0))) {
      invTotal = settled + (rem || 0);
    }
    const remaining =
      rem !== null
        ? Math.max(0, rem)
        : Math.max(0, (rawNet > 0 ? rawNet : invTotal) - settled);
    const isFullySettled = remaining <= 0;

    return {
      ...inv,
      invoiceNumber: inv.invoiceNumber || inv.number || "Invoice",
      invoiceDate: inv.invoiceDate || "",
      dueDate: inv.dueDate || "",
      invTotal,
      settled,
      remaining,
      isFullySettled,
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.invoiceAmount += row.invTotal;
      acc.netPayable += row.netPayable;
      acc.settledNow += row.settled;
      acc.remainingBalance += row.remaining;
      return acc;
    },
    { invoiceAmount: 0, netPayable: 0, settledNow: 0, remainingBalance: 0 },
  );

  // 1. Payment Received = Settled against invoice(s) + unallocated amount (OR On Account)
  const settledAgainstInvoices =
    totals.settledNow > 0
      ? totals.settledNow
      : Number(paymentInfo?.settledAmount ?? paymentInfo?.amountSettled ?? 0);

  const unallocatedAmount = Number(
    paymentInfo?.unallocatedAmount ??
      paymentInfo?.onAccount ??
      paymentInfo?.onAccountAmount ??
      paymentInfo?.clientUnallocatedBalance ??
      (paymentInfo?.amount !== undefined &&
      paymentInfo?.amount !== null &&
      Number(paymentInfo.amount) > settledAgainstInvoices
        ? Number(paymentInfo.amount) - settledAgainstInvoices
        : 0),
  );

  // Payment Received = Settled against invoice(s) + unallocated amount (OR On Account)
  const computedPayment = settledAgainstInvoices + unallocatedAmount;
  const parsedPayment =
    paymentInfo?.amount !== undefined && paymentInfo?.amount !== null
      ? Math.max(
          Number(String(paymentInfo.amount).replace(/[^0-9.-]+/g, "")),
          computedPayment,
        )
      : paymentInfo?.paymentAmount !== undefined &&
          paymentInfo?.paymentAmount !== null
        ? Math.max(
            Number(String(paymentInfo.paymentAmount).replace(/[^0-9.-]+/g, "")),
            computedPayment,
          )
        : computedPayment;

  // 1. Overall Outstanding of client (Net Payable Amount)
  // Can be passed via totalOutstanding, overallOutstanding, or derived from (remaining account outstanding + payment)
  let rawAccountRemaining = null;
  if (remainingOutstanding !== null && remainingOutstanding !== undefined) {
    rawAccountRemaining = Number(
      String(remainingOutstanding).replace(/[^0-9.-]+/g, ""),
    );
  } else if (
    totalAccountOutstanding !== null &&
    totalAccountOutstanding !== undefined
  ) {
    rawAccountRemaining = Number(
      String(totalAccountOutstanding).replace(/[^0-9.-]+/g, ""),
    );
  } else if (
    paymentInfo?.remainingOutstanding !== null &&
    paymentInfo?.remainingOutstanding !== undefined
  ) {
    rawAccountRemaining = Number(
      String(paymentInfo.remainingOutstanding).replace(/[^0-9.-]+/g, ""),
    );
  } else if (
    paymentInfo?.totalAccountOutstanding !== null &&
    paymentInfo?.totalAccountOutstanding !== undefined
  ) {
    rawAccountRemaining = Number(
      String(paymentInfo.totalAccountOutstanding).replace(/[^0-9.-]+/g, ""),
    );
  }

  let candidateOverallOutstanding = null;
  if (
    paymentInfo?.totalNetPayable !== null &&
    paymentInfo?.totalNetPayable !== undefined
  ) {
    candidateOverallOutstanding = Number(
      String(paymentInfo.totalNetPayable).replace(/[^0-9.-]+/g, ""),
    );
  } else if (
    paymentInfo?.netPayableAmount !== null &&
    paymentInfo?.netPayableAmount !== undefined
  ) {
    candidateOverallOutstanding = Number(
      String(paymentInfo.netPayableAmount).replace(/[^0-9.-]+/g, ""),
    );
  } else if (
    paymentInfo?.clientSummary?.totalNetPayable !== null &&
    paymentInfo?.clientSummary?.totalNetPayable !== undefined
  ) {
    candidateOverallOutstanding = Number(
      String(paymentInfo.clientSummary.totalNetPayable).replace(
        /[^0-9.-]+/g,
        "",
      ),
    );
  } else if (totalOutstanding !== null && totalOutstanding !== undefined) {
    candidateOverallOutstanding = Number(
      String(totalOutstanding).replace(/[^0-9.-]+/g, ""),
    );
  } else if (
    paymentInfo?.totalOutstanding !== null &&
    paymentInfo?.totalOutstanding !== undefined
  ) {
    candidateOverallOutstanding = Number(
      String(paymentInfo.totalOutstanding).replace(/[^0-9.-]+/g, ""),
    );
  } else if (
    paymentInfo?.overallOutstanding !== null &&
    paymentInfo?.overallOutstanding !== undefined
  ) {
    candidateOverallOutstanding = Number(
      String(paymentInfo.overallOutstanding).replace(/[^0-9.-]+/g, ""),
    );
  } else if (
    paymentInfo?.clientOverallOutstanding !== null &&
    paymentInfo?.clientOverallOutstanding !== undefined
  ) {
    candidateOverallOutstanding = Number(
      String(paymentInfo.clientOverallOutstanding).replace(/[^0-9.-]+/g, ""),
    );
  }

  const derivedFromRemaining =
    rawAccountRemaining !== null ? rawAccountRemaining + parsedPayment : null;

  const invoiceBatchTotal =
    totals.netPayable > 0 ? totals.netPayable : totals.invoiceAmount;

  // 1. "Net Payable Amount" for a client is totalNetPayable from clients/[id]/page.js
  const netPayableAmount =
    candidateOverallOutstanding !== null
      ? candidateOverallOutstanding
      : derivedFromRemaining !== null
        ? derivedFromRemaining
        : invoiceBatchTotal;

  // 2. "Rest Due Amount" is netOutstanding from clients/[id]/page.js
  let parsedRemaining = null;
  if (
    paymentInfo?.netOutstanding !== null &&
    paymentInfo?.netOutstanding !== undefined
  ) {
    parsedRemaining = Number(
      String(paymentInfo.netOutstanding).replace(/[^0-9.-]+/g, ""),
    );
  } else if (
    paymentInfo?.restDueAmount !== null &&
    paymentInfo?.restDueAmount !== undefined
  ) {
    parsedRemaining = Number(
      String(paymentInfo.restDueAmount).replace(/[^0-9.-]+/g, ""),
    );
  } else if (
    paymentInfo?.clientSummary?.netOutstanding !== null &&
    paymentInfo?.clientSummary?.netOutstanding !== undefined
  ) {
    parsedRemaining = Number(
      String(paymentInfo.clientSummary.netOutstanding).replace(
        /[^0-9.-]+/g,
        "",
      ),
    );
  } else if (rawAccountRemaining !== null) {
    parsedRemaining = rawAccountRemaining;
  } else {
    parsedRemaining = Math.max(0, netPayableAmount - parsedPayment);
  }

  // 3. Total Outstanding
  const parsedPriorTotal = Math.max(
    netPayableAmount,
    parsedRemaining + parsedPayment,
  );

  // Card metrics:
  // Card 1: Net Payable Amount (totalNetPayable from clients/[id]/page.js)
  // Card 2: Payment Received (Settled against invoices + unallocated amount)
  // Card 3: Rest Due Amount (netOutstanding from clients/[id]/page.js)
  const card1Value = netPayableAmount;
  const card1Label = "Net Payable Amount";
  const card1Subtext = "Total Net Payable";

  const card2Value = parsedPayment;
  const card2Label = "Payment Received";
  const card2Subtext =
    unallocatedAmount > 0
      ? `Settled: ${formatCurrency(settledAgainstInvoices)} + On Account: ${formatCurrency(unallocatedAmount)}`
      : "Settled against invoice(s)";

  const card3Value = parsedRemaining;
  const card3Label = "Rest Due Amount";
  const card3Subtext = "Current Net Outstanding";

  const hasMeta =
    paymentInfo?.paymentDate ||
    paymentInfo?.method ||
    paymentInfo?.paymentMethod ||
    paymentInfo?.reference ||
    paymentInfo?.referenceNumber;

  return (
    <div style={{ margin: "20px 0" }}>
      {/* 1. The 3-Card Financial Summary Strip */}
      <PaymentAccountBalanceSummary
        totalOutstanding={card1Value}
        paymentAmount={card2Value}
        remainingOutstanding={card3Value}
        overallLabel={card1Label}
        deductionLabel={card2Label}
        restLabel={card3Label}
        overallSubtext={card1Subtext}
        deductionSubtext={card2Subtext}
        restSubtext={card3Subtext}
      />

      {/* 2. Payment Transaction Metadata Bar */}
      {hasMeta && (
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "6px",
            padding: "9px 14px",
            marginBottom: "18px",
            fontSize: "12px",
            color: "#475569",
          }}
        >
          <table width="100%" cellPadding="0" cellSpacing="0" border="0">
            <tbody>
              <tr>
                {paymentInfo?.paymentDate && (
                  <td
                    style={{ padding: "2px 8px 2px 0", whiteSpace: "nowrap" }}
                  >
                    <span style={{ color: "#64748B" }}>Payment Date: </span>
                    <strong style={{ color: "#0F172A" }}>
                      {formatDate(paymentInfo.paymentDate)}
                    </strong>
                  </td>
                )}
                {(paymentInfo?.method || paymentInfo?.paymentMethod) && (
                  <td style={{ padding: "2px 8px", whiteSpace: "nowrap" }}>
                    <span style={{ color: "#64748B" }}>Payment Mode: </span>
                    <strong style={{ color: "#0F172A" }}>
                      {paymentInfo.method || paymentInfo.paymentMethod}
                    </strong>
                  </td>
                )}
                {(paymentInfo?.reference || paymentInfo?.referenceNumber) && (
                  <td
                    style={{ padding: "2px 0 2px 8px", whiteSpace: "nowrap" }}
                  >
                    <span style={{ color: "#64748B" }}>Ref / UTR #: </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#0F172A",
                      }}
                    >
                      {paymentInfo.reference || paymentInfo.referenceNumber}
                    </span>
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Itemized Settlement Table */}
      {hasInvoices && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#0F172A",
              }}
            >
              Invoice Details
            </div>
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "640px",
                fontSize: "12px",
                borderCollapse: "collapse",
                backgroundColor: "#ffffff",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F1F5F9",
                    borderBottom: "1px solid #CBD5E1",
                    color: "#475569",
                    fontWeight: 700,
                  }}
                >
                  <th
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Invoice No.
                  </th>
                  <th
                    style={{
                      padding: "10px 10px",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Invoice Date
                  </th>
                  <th
                    style={{
                      padding: "10px 10px",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Due Date
                  </th>
                  <th
                    style={{
                      padding: "10px 10px",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Invoice Amount (₹)
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      color: "#16A34A",
                    }}
                  >
                    Payment Received (₹)
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Rest Due Amount (₹)
                  </th>
                  <th
                    style={{
                      padding: "10px 12px",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv, idx) => {
                  const rowBg = idx % 2 === 1 ? "#F8FAFC" : "#FFFFFF";

                  return (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: rowBg,
                        borderBottom: "1px solid #E2E8F0",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 12px",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#0F172A",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {inv.invoiceNumber}
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          fontSize: "12px",
                          color: "#475569",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          fontSize: "12px",
                          color: "#475569",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(inv.dueDate)}
                      </td>
                      <td
                        style={{
                          padding: "10px 10px",
                          fontSize: "13px",
                          textAlign: "right",
                          color: "#334155",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(inv.invTotal)}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          fontSize: "13px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#16A34A",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(inv.settled)}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          fontSize: "13px",
                          textAlign: "right",
                          fontWeight: 600,
                          color: inv.remaining > 0 ? "#DC2626" : "#64748B",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(inv.remaining)}
                      </td>
                      <td
                        style={{
                          padding: "10px 12px",
                          fontSize: "12px",
                          textAlign: "center",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {inv.isFullySettled ? (
                          <span
                            style={{
                              background: "#DCFCE7",
                              color: "#166534",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              display: "inline-block",
                            }}
                          >
                            Fully Settled
                          </span>
                        ) : (
                          <span
                            style={{
                              background: "#FEF3C7",
                              color: "#92400E",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              display: "inline-block",
                            }}
                          >
                            Partially Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr
                  style={{
                    background: "#F8FAFC",
                    borderTop: "2px solid #E2E8F0",
                    fontWeight: 700,
                  }}
                >
                  <td
                    colSpan={3}
                    style={{
                      padding: "11px 12px",
                      textAlign: "right",
                      color: "#0F172A",
                      fontSize: "13px",
                    }}
                  >
                    Total Settled in This Batch:
                  </td>
                  <td
                    style={{
                      padding: "11px 10px",
                      textAlign: "right",
                      color: "#334155",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totals.invoiceAmount)}
                  </td>
                  <td
                    style={{
                      padding: "11px 12px",
                      textAlign: "right",
                      color: "#16A34A",
                      fontSize: "14px",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totals.settledNow)}
                  </td>
                  <td
                    style={{
                      padding: "11px 12px",
                      textAlign: "right",
                      color:
                        totals.remainingBalance > 0 ? "#DC2626" : "#0F172A",
                      fontSize: "13px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(totals.remainingBalance)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* 4. On-Account / Unallocated Credit Note if present */}
      {unallocatedAmount > 0 && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderLeft: "4px solid #16A34A",
            borderRadius: "6px",
            padding: "12px 14px",
            marginTop: "16px",
            fontSize: "13px",
            color: "#166534",
            lineHeight: 1.5,
          }}
        >
          💰 <strong>On Account / Unallocated Amount:</strong>{" "}
          <strong>{formatCurrency(unallocatedAmount)}</strong> has been credited
          to your account and will be adjusted against future invoices.
        </div>
      )}

      {/* 5. Dynamic Ledger Position Note */}
      {parsedRemaining > 0 ? (
        <div
          style={{
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            borderLeft: "4px solid #2563EB",
            borderRadius: "6px",
            padding: "12px 14px",
            marginTop: "16px",
            fontSize: "13px",
            color: "#1E40AF",
            lineHeight: 1.5,
          }}
        >
          ℹ️ <strong>Updated Ledger Balance:</strong> After allocating this
          payment of <strong>{formatCurrency(parsedPayment)}</strong>, your
          total remaining account balance is{" "}
          <strong>{formatCurrency(parsedRemaining)}</strong>. Kindly ensure
          timely settlement of the remaining dues as per agreed credit terms.
        </div>
      ) : (
        <div
          style={{
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            borderLeft: "4px solid #10B981",
            borderRadius: "6px",
            padding: "12px 14px",
            marginTop: "16px",
            fontSize: "13px",
            color: "#065F46",
            lineHeight: 1.5,
          }}
        >
          ✅ <strong>Account Fully Cleared:</strong> All outstanding invoices
          have been settled in full. Your account currently has{" "}
          <strong>₹0.00</strong> outstanding dues. Thank you for your prompt
          partnership!
        </div>
      )}
    </div>
  );
}
