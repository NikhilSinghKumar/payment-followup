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
export function ClientOutstandingInvoices({ invoices = [] }) {
  if (!invoices || !invoices.length) {
    return null;
  }

  const totals = invoices.reduce(
    (summary, invoice) => {
      summary.invoiceAmount += Number(invoice.invoiceAmount || 0);
      summary.paidAmount += Number(invoice.paidAmount || 0);
      summary.outstandingAmount += Number(invoice.outstandingAmount || 0);
      return summary;
    },
    {
      invoiceAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
    },
  );

  return (
    <div style={{ margin: "24px 0" }}>
      <div
        style={{
          marginBottom: "8px",
          fontSize: "16px",
          fontWeight: 700,
          color: "#0F172A",
        }}
      >
        Outstanding Invoice Summary
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
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Invoice No.
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
                Invoice Date
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
                  padding: "11px 8px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Invoice Amount
              </th>
              <th
                align="right"
                style={{
                  padding: "11px 8px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Paid Amount
              </th>
              <th
                align="right"
                style={{
                  padding: "11px 8px",
                  borderBottom: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Outstanding
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
            {invoices.map((invoice, index) => {
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

              return (
                <tr key={index}>
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#334155",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <strong>{invoice.invoiceNumber}</strong>
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#475569",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(invoice.invoiceDate)}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#475569",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#334155",
                      fontSize: "13px",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(invoice.invoiceAmount)}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#16A34A",
                      fontSize: "13px",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(invoice.paidAmount)}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#0F172A",
                      fontSize: "13px",
                      fontWeight: 700,
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCurrency(invoice.outstandingAmount)}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #E2E8F0",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: invoice.agingColor || "#334155",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {invoice.agingStatus || "-"}
                  </td>
                  <td
                    style={{
                      padding: "10px 8px",
                      borderBottom: "1px solid #E2E8F0",
                      color: "#475569",
                      fontSize: "13px",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {creditDays} days
                  </td>
                </tr>
              );
            })}

            {/* Total Row */}
            <tr>
              <td
                colSpan={3}
                style={{
                  padding: "12px 8px",
                  background: "#F8FAFC",
                  color: "#0F172A",
                  fontSize: "13px",
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                Total
              </td>
              <td
                style={{
                  padding: "12px 8px",
                  background: "#F8FAFC",
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
                  padding: "12px 8px",
                  background: "#F8FAFC",
                  color: "#16A34A",
                  fontSize: "13px",
                  fontWeight: 700,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(totals.paidAmount)}
              </td>
              <td
                style={{
                  padding: "12px 8px",
                  background: "#F8FAFC",
                  color: "#0F172A",
                  fontSize: "13px",
                  fontWeight: 700,
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(totals.outstandingAmount)}
              </td>
              <td colSpan={2} style={{ background: "#F8FAFC" }} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * ======================================================
 * Client Payment Received Settlement Table Component
 * Multi/single invoice settlement breakdown with badges
 * ======================================================
 */
export function ClientPaymentSettlementTable({
  settledInvoices = [],
  paymentInfo = {},
  totalAccountOutstanding = null,
}) {
  if (!Array.isArray(settledInvoices) || settledInvoices.length === 0) {
    return null;
  }

  const rows = settledInvoices.map((inv) => {
    const invTotal = Number(
      inv.invoiceAmount || inv.totalAmount || inv.netPayableAmount || 0,
    );
    const settled = Number(
      inv.settledAmount || inv.amountSettled || inv.paidAmount || 0,
    );
    const remaining = Math.max(
      0,
      Number(inv.remainingBalance ?? invTotal - settled),
    );
    const isFullySettled = remaining <= 0;

    return {
      ...inv,
      invTotal,
      settled,
      remaining,
      isFullySettled,
    };
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.invoiceAmount += row.invTotal;
      acc.settledNow += row.settled;
      acc.remainingBalance += row.remaining;
      return acc;
    },
    { invoiceAmount: 0, settledNow: 0, remainingBalance: 0 },
  );

  return (
    <div style={{ margin: "20px 0" }}>
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
          Settlement Breakdown Against Invoices
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
            minWidth: "580px",
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
                Invoice #
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
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                Invoice Total (₹)
              </th>
              <th
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  color: "#16A34A",
                }}
              >
                Settled Now (₹)
              </th>
              <th
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}
              >
                Remaining Due (₹)
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
                colSpan={2}
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
                  color: totals.remainingBalance > 0 ? "#DC2626" : "#0F172A",
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
    </div>
  );
}
