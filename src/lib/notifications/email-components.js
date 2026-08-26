/**
 * ======================================================
 * Greeting
 * ======================================================
 */
export function renderGreeting(clientName) {
  return `
    <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">
      Dear <strong>${clientName}</strong>,
    </p>
  `;
}

/**
 * ======================================================
 * Paragraph
 * ======================================================
 */
export function renderParagraph(text) {
  if (!text) return "";
  const paragraphs = String(text)
    .trim()
    .split(/\n\s*\n/) // split on blank lines into distinct paragraphs
    .map(
      (p) => `
        <p style="
          margin:0 0 16px;
          line-height:1.7;
          color:#334155;
        ">
          ${p.trim().replace(/\n/g, "<br />")}
        </p>
      `,
    )
    .join("");

  return paragraphs;
}

/**
 * ======================================================
 * Status Banner
 * ======================================================
 */
export function renderStatusBanner({
  title,
  color = "#2563EB",
  background = "#DBEAFE",
}) {
  return `
<div
style="
background:${background};
color:${color};
padding:12px 16px;
border-left:4px solid ${color};
border-radius:8px;
margin:18px 0;
font-size:15px;
font-weight:600;
"
>
${title}
</div>
`;
}

/**
 * ======================================================
 * Bank & Payment Details
 * ======================================================
 */
export function renderBankDetails(company) {
  if (!company) return "";
  const hasBank = Boolean(
    company.bankName ||
    company.bankAccountNumber ||
    company.bankIfsc ||
    company.bankUpi,
  );
  if (!hasBank) return "";

  return `
<div
  style="
    margin:20px 0;
    padding:16px 20px;
    background:#F8FAFC;
    border:1px dashed #CBD5E1;
    border-radius:10px;
    font-size:13px;
    color:#334155;
  "
>
  <div
    style="
      font-size:14px;
      font-weight:700;
      color:#0F172A;
      margin-bottom:10px;
      border-bottom:1px solid #E2E8F0;
      padding-bottom:6px;
    "
  >
    Bank & Payment Details
  </div>
  <table
    width="100%"
    cellpadding="4"
    cellspacing="0"
    border="0"
    style="font-size:13px;color:#334155;line-height:1.6;"
  >
    ${
      company.bankName
        ? `<tr><td style="width:130px;color:#64748B;">Bank Name:</td><td><strong style="color:#0F172A;">${company.bankName}</strong></td></tr>`
        : ""
    }
    ${
      company.bankAccountNumber
        ? `<tr><td style="color:#64748B;">Account No:</td><td><strong style="font-family:monospace;font-size:14px;color:#0F172A;">${company.bankAccountNumber}</strong></td></tr>`
        : ""
    }
    ${
      company.bankIfsc
        ? `<tr><td style="color:#64748B;">IFSC Code:</td><td><strong style="font-family:monospace;color:#0F172A;">${company.bankIfsc}</strong></td></tr>`
        : ""
    }
    ${
      company.bankBranch
        ? `<tr><td style="color:#64748B;">Branch:</td><td>${company.bankBranch}</td></tr>`
        : ""
    }
    ${
      company.bankUpi
        ? `<tr><td style="color:#64748B;">UPI ID:</td><td><strong style="font-family:monospace;color:#2563EB;">${company.bankUpi}</strong></td></tr>`
        : ""
    }
  </table>
</div>
`;
}

/**
 * ======================================================
 * Custom Note Box
 * ======================================================
 */
export function renderCustomNote(note, color = "#2563EB") {
  if (!note || !note.trim()) return "";
  return `
<div
  style="
    margin:18px 0;
    padding:12px 16px;
    background:#F8FAFC;
    border-left:4px solid ${color};
    border-radius:6px;
    font-size:13px;
    color:#334155;
    line-height:1.6;
  "
>
  <strong style="color:#0F172A;display:block;margin-bottom:4px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Note from Sender:</strong>
  ${note.trim().replace(/\n/g, "<br/>")}
</div>
`;
}

/**
 * ======================================================
 * Invoice Summary Card
 * ======================================================
 */
export function renderInvoiceSummary({
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
  const awbText =
    Array.isArray(awbs) && awbs.length > 0
      ? awbs
          .map((a) => (typeof a === "object" ? a.awbNumber : a))
          .filter(Boolean)
          .join(", ")
      : "";

  return `
<table
width="100%"
cellpadding="8"
cellspacing="0"
style="
margin:18px 0;
border:1px solid #E2E8F0;
border-radius:10px;
overflow:hidden;
border-collapse:collapse;
"
>

<tr>
<td
  colspan="2"
  style="
    background:#F8FAFC;
    font-size:15px;
    font-weight:bold;
    color:#0F172A;
    border-bottom:1px solid #E2E8F0;
    padding:10px 12px;
  "
>
Invoice Details Summary
</td>
</tr>

<tr>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#64748B;width:150px;"><strong>Invoice Number</strong></td>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-weight:600;color:#0F172A;">${invoiceNumber}</td>
</tr>

${
  invoiceDate
    ? `<tr>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#64748B;"><strong>Invoice Date</strong></td>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#334155;">${invoiceDate}</td>
</tr>`
    : ""
}

<tr>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#64748B;"><strong>Due Date</strong></td>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:${isOverdue ? "#DC2626" : "#334155"};font-weight:${isOverdue ? "700" : "500"};">
  ${dueDate} ${dueDaysText ? `(${dueDaysText})` : ""}
</td>
</tr>

${
  awbText
    ? `<tr>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#64748B;"><strong>AWBs / Dockets</strong></td>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-family:monospace;font-size:12px;color:#334155;">${awbText}</td>
</tr>`
    : ""
}

<tr>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#64748B;"><strong>Invoice Amount</strong></td>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-weight:600;color:#0F172A;">₹${invoiceAmount}</td>
</tr>

${
  showPaymentDetails &&
  paidAmount !== undefined &&
  paidAmount !== null &&
  Number(paidAmount) > 0
    ? `
<tr>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#64748B;"><strong>Paid Amount</strong></td>
<td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#16A34A;font-weight:600;">₹${paidAmount}</td>
</tr>
`
    : ""
}

<tr>
<td style="padding:12px;background:#F8FAFC;font-weight:700;color:#0F172A;font-size:14px;"><strong>Balance Due</strong></td>
<td
style="
padding:12px;
background:#F8FAFC;
font-weight:bold;
font-size:16px;
color:#2563EB;
"
>
₹${outstandingAmount || invoiceAmount}
</td>
</tr>

</table>
`;
}

/**
 * ======================================================
 * Alert Box
 * ======================================================
 */
export function renderAlertBox(message) {
  return `
<div
style="
margin:18px 0;
padding:14px 16px;
background:#FEF3C7;
border-left:4px solid #F59E0B;
border-radius:8px;
color:#92400E;
font-size:14px;
"
>
${message}
</div>
`;
}

/**
 * ======================================================
 * CTA Button
 * ======================================================
 */
export function renderButton(text, url) {
  if (!url) return "";

  return `
<div
style="
text-align:center;
margin:22px 0;
"
>

<a
href="${url}"
style="
background:#2563EB;
padding:12px 24px;
color:#ffffff;
text-decoration:none;
border-radius:8px;
display:inline-block;
font-weight:bold;
font-size:15px;
"
>

${text}

</a>

</div>
`;
}

/**
 * ======================================================
 * Signature
 * ======================================================
 */
export function renderSignature({
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

  return `
<div
style="
margin-top:22px;
line-height:1.6;
color:#334155;
">

Warm Regards,<br><br>

<strong>${senderCompany || "Prakash Air Freight India Pvt Ltd"}</strong><br>

Email: ${senderEmail || "accounts@pafex.in"}<br>

Mobile: ${senderPhone || "9289901837"}<br><br>

${
  logoSrc
    ? `
      <img
        src="${logoSrc}"
        alt="${senderCompany || "PAFEX"}"
        width="140"
        style="
          display:block;
          border:0;
          margin-top:6px;
          max-width:160px;
          height:auto;
        "
      />
    `
    : ""
}

</div>
`;
}

/**
 * ======================================================
 * Client Outstanding Invoice Summary
 * ======================================================
 */
export function renderClientOutstandingInvoices(invoices = []) {
  if (!invoices.length) {
    return "";
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ======================================================
  // TOTALS
  // ======================================================

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

  // ======================================================
  // INVOICE ROWS
  // ======================================================

  const rows = invoices
    .map(
      (invoice) => `
<tr>

<!-- Invoice Number -->
<td
  style="
    padding:10px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#334155;
    font-size:13px;
    white-space:nowrap;
  "
>
  <strong>${invoice.invoiceNumber}</strong>
</td>

<!-- Invoice Date -->
<td
  style="
    padding:10px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:13px;
    white-space:nowrap;
  "
>
  ${formatDate(invoice.invoiceDate)}
</td>

<!-- Due Date -->
<td
  style="
    padding:10px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:13px;
    white-space:nowrap;
  "
>
  ${formatDate(invoice.dueDate)}
</td>

<!-- Invoice Amount -->
<td
  style="
    padding:10px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#334155;
    font-size:13px;
    text-align:right;
    white-space:nowrap;
  "
>
  ${formatCurrency(invoice.invoiceAmount)}
</td>

<!-- Paid Amount -->
<td
  style="
    padding:10px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#16A34A;
    font-size:13px;
    text-align:right;
    white-space:nowrap;
  "
>
  ${formatCurrency(invoice.paidAmount)}
</td>

<!-- Outstanding -->
<td
  style="
    padding:10px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#0F172A;
    font-size:13px;
    font-weight:700;
    text-align:right;
    white-space:nowrap;
  "
>
  ${formatCurrency(invoice.outstandingAmount)}
</td>

<!-- Aging / Status -->
<td
  style="
    padding:10px 8px;
    border-bottom:1px solid #E2E8F0;
    font-size:13px;
    font-weight:600;
    color:${invoice.agingColor || "#334155"};
    white-space:nowrap;
  "
>
  ${invoice.agingStatus || "-"}
</td>

<!-- Credit Days -->
<td
  style="
    padding:10px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:13px;
    text-align:center;
    white-space:nowrap;
  "
>
  ${invoice.creditDays ?? 0} days
</td>

</tr>
`,
    )
    .join("");

  return `
<div style="margin:24px 0;">

<div
  style="
    margin-bottom:8px;
    font-size:16px;
    font-weight:700;
    color:#0F172A;
  "
>
  Outstanding Invoice Summary
</div>

<!-- Mobile Scroll Tip -->
<div style="font-size: 11px; color: #64748b; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; display: inline-block;">
  👉 <em>Swipe horizontally to view full table</em>
</div>

<div class="responsive-table-scroll" style="width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #E2E8F0; border-radius: 10px;">
<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    min-width: 600px;
    border-collapse:collapse;
    background:#ffffff;
  "
>

<thead>

<tr style="background:#F8FAFC;">

<th
  align="left"
  style="
    padding:11px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:12px;
    font-weight:600;
    white-space:nowrap;
  "
>
  Invoice No.
</th>

<th
  align="left"
  style="
    padding:11px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:12px;
    font-weight:600;
    white-space:nowrap;
  "
>
  Invoice Date
</th>

<th
  align="left"
  style="
    padding:11px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:12px;
    font-weight:600;
    white-space:nowrap;
  "
>
  Due Date
</th>

<th
  align="right"
  style="
    padding:11px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:12px;
    font-weight:600;
    white-space:nowrap;
  "
>
  Invoice Amount
</th>

<th
  align="right"
  style="
    padding:11px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:12px;
    font-weight:600;
    white-space:nowrap;
  "
>
  Paid Amount
</th>

<th
  align="right"
  style="
    padding:11px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:12px;
    font-weight:600;
    white-space:nowrap;
  "
>
  Outstanding
</th>

<th
  align="left"
  style="
    padding:11px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:12px;
    font-weight:600;
    white-space:nowrap;
  "
>
  Aging / Status
</th>

<th
  align="center"
  style="
    padding:11px 8px;
    border-bottom:1px solid #E2E8F0;
    color:#475569;
    font-size:12px;
    font-weight:600;
    white-space:nowrap;
  "
>
  Credit Days
</th>

</tr>

</thead>

<tbody>

${rows}

<!-- ====================================================
     TOTAL ROW
     ==================================================== -->

<tr>

<td
  colspan="3"
  style="
    padding:12px 8px;
    background:#F8FAFC;
    color:#0F172A;
    font-size:13px;
    font-weight:700;
    text-align:right;
  "
>
  Total
</td>

<!-- Total Invoice Amount -->
<td
  style="
    padding:12px 8px;
    background:#F8FAFC;
    color:#334155;
    font-size:13px;
    font-weight:700;
    text-align:right;
    white-space:nowrap;
  "
>
  ${formatCurrency(totals.invoiceAmount)}
</td>

<!-- Total Paid -->
<td
  style="
    padding:12px 8px;
    background:#F8FAFC;
    color:#16A34A;
    font-size:13px;
    font-weight:700;
    text-align:right;
    white-space:nowrap;
  "
>
  ${formatCurrency(totals.paidAmount)}
</td>

<!-- Total Outstanding -->
<td
  style="
    padding:12px 8px;
    background:#F8FAFC;
    color:#0F172A;
    font-size:13px;
    font-weight:700;
    text-align:right;
    white-space:nowrap;
  "
>
  ${formatCurrency(totals.outstandingAmount)}
</td>

<td colspan="2" style="background:#F8FAFC;"></td>

</tr>

</tbody>

</table>

</div>
</div>
`;
}

/**
 * ======================================================
 * Client Payment Received Settlement Table (Multi/Single Invoices)
 * Fully responsive with mobile horizontal scrolling support
 * ======================================================
 */
export function renderClientPaymentSettlementTable({
  settledInvoices = [],
  paymentInfo = {},
  totalAccountOutstanding = null,
}) {
  if (!Array.isArray(settledInvoices) || settledInvoices.length === 0) {
    return "";
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(Number(val || 0));

  const formatDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  let totalInvoiceAmount = 0;
  let totalSettledNow = 0;
  let totalRemainingBalance = 0;

  const rows = settledInvoices
    .map((inv, idx) => {
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

      totalInvoiceAmount += invTotal;
      totalSettledNow += settled;
      totalRemainingBalance += remaining;

      const rowBg = idx % 2 === 1 ? "#F8FAFC" : "#FFFFFF";

      return `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 700; color: #0F172A; white-space: nowrap;">
            ${inv.invoiceNumber}
          </td>
          <td style="padding: 10px 10px; font-size: 12px; color: #475569; white-space: nowrap;">
            ${formatDate(inv.invoiceDate)}
          </td>
          <td style="padding: 10px 10px; font-size: 13px; text-align: right; color: #334155; white-space: nowrap;">
            ${formatCurrency(invTotal)}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 700; color: #16A34A; white-space: nowrap;">
            ${formatCurrency(settled)}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 600; color: ${remaining > 0 ? "#DC2626" : "#64748B"}; white-space: nowrap;">
            ${formatCurrency(remaining)}
          </td>
          <td style="padding: 10px 12px; font-size: 12px; text-align: center; white-space: nowrap;">
            ${
              isFullySettled
                ? `<span style="background: #DCFCE7; color: #166534; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; display: inline-block;">Fully Settled</span>`
                : `<span style="background: #FEF3C7; color: #92400E; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; display: inline-block;">Partially Settled</span>`
            }
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="font-size: 15px; font-weight: 700; color: #0F172A;">
          Settlement Breakdown Against Invoices
        </div>
      </div>

      <!-- Mobile Scroll Tip -->
      <div style="font-size: 11px; color: #64748b; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; display: inline-block;">
        👉 <em>Swipe horizontally to view full settlement breakdown</em>
      </div>

      <div style="width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid #E2E8F0; border-radius: 8px;">
        <table style="width: 100%; min-width: 580px; font-size: 12px; border-collapse: collapse; background-color: #ffffff;">
          <thead>
            <tr style="background: #F1F5F9; border-bottom: 1px solid #CBD5E1; color: #475569; font-weight: 700;">
              <th style="padding: 10px 12px; text-align: left; white-space: nowrap;">Invoice #</th>
              <th style="padding: 10px 10px; text-align: left; white-space: nowrap;">Invoice Date</th>
              <th style="padding: 10px 10px; text-align: right; white-space: nowrap;">Invoice Total (₹)</th>
              <th style="padding: 10px 12px; text-align: right; white-space: nowrap; color: #16A34A;">Settled Now (₹)</th>
              <th style="padding: 10px 12px; text-align: right; white-space: nowrap;">Remaining Due (₹)</th>
              <th style="padding: 10px 12px; text-align: center; white-space: nowrap;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="background: #F8FAFC; border-top: 2px solid #E2E8F0; font-weight: 700;">
              <td colspan="2" style="padding: 11px 12px; text-align: right; color: #0F172A; font-size: 13px;">
                Total Settled in This Batch:
              </td>
              <td style="padding: 11px 10px; text-align: right; color: #334155; font-size: 13px; white-space: nowrap;">
                ${formatCurrency(totalInvoiceAmount)}
              </td>
              <td style="padding: 11px 12px; text-align: right; color: #16A34A; font-size: 14px; font-weight: 800; white-space: nowrap;">
                ${formatCurrency(totalSettledNow)}
              </td>
              <td style="padding: 11px 12px; text-align: right; color: ${totalRemainingBalance > 0 ? "#DC2626" : "#0F172A"}; font-size: 13px; font-weight: 700; white-space: nowrap;">
                ${formatCurrency(totalRemainingBalance)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
}
