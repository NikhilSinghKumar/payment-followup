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
  const paragraphs = text
    .trim()
    .split(/\n\s*\n/) // split on blank lines
    .map(
      (p) => `
        <p style="
          margin:0 0 16px;
          line-height:1.7;
          color:#334155;
        ">
          ${p.trim()}
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
}) {
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
    font-size:16px;
    font-weight:bold;
    color:#0F172A;
    border-bottom:1px solid #E2E8F0;
  "
>
Invoice Summary
</td>
</tr>

<tr>
<td><strong>Invoice Number</strong></td>
<td>${invoiceNumber}</td>
</tr>

<tr>
<td><strong>Invoice Date</strong></td>
<td>${invoiceDate}</td>
</tr>

<tr>
<td><strong>Due Date</strong></td>
<td>${dueDate}</td>
</tr>

<tr>
<td><strong>Invoice Amount</strong></td>
<td>₹${invoiceAmount}</td>
</tr>

${
  showPaymentDetails
    ? `
<tr>
<td><strong>Paid Amount</strong></td>
<td>₹${paidAmount}</td>
</tr>

<tr>
<td><strong>Outstanding Amount</strong></td>
<td
style="
font-weight:bold;
color:#DC2626;
"
>
₹${outstandingAmount}
</td>
</tr>
`
    : ""
}

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
  return `
<div
style="
margin-top:22px;
line-height:1.6;
color:#334155;
">

Warm Regards,<br><br>

<strong>${senderCompany}</strong><br>

Email: ${senderEmail}<br>

Mobile: ${senderPhone}<br><br>

${
  senderLogo
    ? `
      <img
        src="${senderLogo}"
        alt="${senderCompany}"
        width="150"
        style="
          display:block;
          border:0;
          margin-top:4px;
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
    margin-bottom:10px;
    font-size:16px;
    font-weight:700;
    color:#0F172A;
  "
>
  Outstanding Invoice Summary
</div>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    border:1px solid #E2E8F0;
    border-radius:10px;
    border-collapse:separate;
    border-spacing:0;
    overflow:hidden;
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
`;
}
