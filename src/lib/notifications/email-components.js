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
          margin-top:8px;
        "
      />
    `
    : ""
}

</div>
`;
}
