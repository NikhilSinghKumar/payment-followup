/**
 * ------------------------------------------------------------------
 * Pafex Email Layout
 * ------------------------------------------------------------------
 * Shared HTML layout for all notification emails.
 *
 * This file should ONLY be responsible for the overall email design.
 * Notification-specific content is injected through the `content`
 * parameter.
 * ------------------------------------------------------------------
 */

export function renderEmailLayout({
  title = "Notification",
  bannerColor = "#143781",
  companyName = "PAFEX",
  logoUrl = "",
  content = "",
  senderCompany = "",
  senderEmail = "",
  senderPhone = "",
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>${title}</title>

<style type="text/css">
  @media only screen and (max-width: 600px) {
    body {
      padding: 8px 4px !important;
    }
    .email-container-table {
      width: 100% !important;
      max-width: 100% !important;
      border-radius: 6px !important;
    }
    .email-content-cell {
      padding: 16px 12px !important;
    }
    .email-header-cell {
      padding: 20px 16px !important;
    }
    .email-footer-cell {
      padding: 14px 16px !important;
    }
    .responsive-table-scroll {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
      display: block !important;
    }
  }
</style>
</head>

<body
  style="
    margin:0;
    padding:20px 12px;
    background:#F3F6FB;
    font-family:Arial,Helvetica,sans-serif;
  "
>

<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
>

<tr>

<td align="center">

<table
  class="email-container-table"
  width="600"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width: 100%;
    max-width: 600px;
    background:#ffffff;
    border-radius:12px;
    box-shadow:0 4px 20px rgba(0,0,0,.08);
  "
>

<!-- ====================================================== -->
<!-- Header -->
<!-- ====================================================== -->

<tr>

<td
  class="email-header-cell"
  style="
    background:${bannerColor};
    padding:24px 28px;
    color:#ffffff;
  "
>

<table width="100%">

<tr>

<td align="left">

${`<div
  style="
  font-size:26px;
  font-weight:bold;
  "
  >
        ${companyName}
  </div>`}

</td>

</tr>

</table>

</td>

</tr>

<!-- ====================================================== -->
<!-- Body -->
<!-- ====================================================== -->

<tr>

<td
  class="email-content-cell"
  style="
    padding:24px 24px;
    color:#334155;
    font-size:15px;
    line-height:1.5;
  "
>

${content}

</td>

</tr>

<!-- ====================================================== -->
<!-- Footer -->
<!-- ====================================================== -->

<tr>

<td
  class="email-footer-cell"
  style="
    padding:18px 24px;
    background:#F8FAFC;
    border-top:1px solid #E2E8F0;
  "
>

<div
  style="
    margin-top:20px;
    font-size:12px;
    color:#94A3B8;
  "
>

This is system generated email.
Please do not reply directly to this email.

</div>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
`;
}
