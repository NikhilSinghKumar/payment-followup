import { renderEmailLayout } from "./email-layout";
import { renderSignature } from "./email-components";

/**
 * Render an internal summary email with a list of clients facing service suspension
 */
export function renderInternalSuspensionSummaryEmail({
  clients = [],
  company = {},
  summaryTitle = "Internal Report: Clients Eligible for Service Suspension",
  customNote = "",
}) {
  const totalClients = clients.length;
  const totalOverdueAmount = clients.reduce(
    (sum, c) => sum + Number(c.totalOverdue || c.outstandingAmount || 0),
    0,
  );
  const totalOverdueInvoices = clients.reduce(
    (sum, c) => sum + Number(c.overdueInvoiceCount || c.overdueInvoices || 1),
    0,
  );

  const formattedTotalAmount = totalOverdueAmount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  const clientRows = clients
    .map((c, index) => {
      const formattedAmount = Number(
        c.totalOverdue || c.outstandingAmount || 0,
      ).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });

      const oldestDue = c.oldestDueDate
        ? new Date(c.oldestDueDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

      const daysOverdue = c.maxOverdueDays || c.overdueDays || "10+";

      return `
        <tr style="border-bottom: 1px solid #E2E8F0; ${index % 2 === 1 ? "background-color: #F8FAFC;" : ""}">
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #0F172A;">
            ${c.clientName || c.companyName}
            <div style="font-size: 11px; font-weight: normal; color: #64748B; margin-top: 2px;">
              Code: ${c.companyCode || "—"} | Contact: ${c.contactName || "Primary Contact"}
            </div>
          </td>
          <td style="padding: 10px 12px; font-size: 12px; color: #475569;">
            ${c.email || c.clientEmail || "—"}
          </td>
          <td style="padding: 10px 12px; font-size: 12px; text-align: center; font-weight: 600; color: #DC2626;">
            <span style="background: #FEE2E2; color: #991B1B; padding: 2px 8px; border-radius: 9999px; font-size: 11px;">
              ${daysOverdue} days
            </span>
          </td>
          <td style="padding: 10px 12px; font-size: 12px; text-align: center; color: #64748B;">
            ${oldestDue}
          </td>
          <td style="padding: 10px 12px; font-size: 12px; text-align: center; font-weight: 600; color: #0F172A;">
            ${c.overdueInvoiceCount || c.overdueInvoices || 1}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 700; color: #DC2626;">
            ₹${formattedAmount}
          </td>
        </tr>
      `;
    })
    .join("");

  const content = `
    <div style="margin-bottom: 20px;">
      <h2 style="font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 6px 0;">
        ${summaryTitle}
      </h2>
      <p style="font-size: 13px; color: #64748B; margin: 0;">
        Generated for <strong>${company.companyName || "PAFEX Management & Finance Team"}</strong> on ${new Date().toLocaleDateString(
          "en-IN",
          {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        )}
      </p>
    </div>

    <!-- Alert / Action Banner -->
    <div style="background: #FEF2F2; border-left: 4px solid #DC2626; border-radius: 8px; padding: 14px 16px; margin: 18px 0;">
      <div style="font-size: 14px; font-weight: 700; color: #991B1B; margin-bottom: 4px;">
        ⚠️ Service Suspension Action Required (${totalClients} Client${totalClients === 1 ? "" : "s"})
      </div>
      <div style="font-size: 12px; color: #7F1D1D; line-height: 1.5;">
        The following clients have invoices exceeding the allowable credit period (&gt;= 10 days past due date). 
        Review the list below and take appropriate suspension or recovery action.
      </div>
    </div>

    ${
      customNote && customNote.trim()
        ? `
      <div style="background: #F1F5F9; border-left: 4px solid #475569; border-radius: 6px; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #334155;">
        <strong>Internal Note:</strong> ${customNote}
      </div>
    `
        : ""
    }

    <!-- High Level Metrics Overview -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
      <tr>
        <td style="width: 32%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 600;">Defaulter Clients</div>
          <div style="font-size: 20px; font-weight: 800; color: #0F172A; margin-top: 4px;">${totalClients}</div>
        </td>
        <td style="width: 2%;"></td>
        <td style="width: 32%; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 600;">Total Overdue Invoices</div>
          <div style="font-size: 20px; font-weight: 800; color: #EA580C; margin-top: 4px;">${totalOverdueInvoices}</div>
        </td>
        <td style="width: 2%;"></td>
        <td style="width: 32%; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 11px; text-transform: uppercase; color: #991B1B; font-weight: 600;">Total Overdue Exposure</div>
          <div style="font-size: 20px; font-weight: 800; color: #DC2626; margin-top: 4px;">₹${formattedTotalAmount}</div>
        </td>
      </tr>
    </table>

    <!-- Defaulter Client Breakdown Table -->
    <div style="margin: 24px 0 16px 0; font-size: 14px; font-weight: 700; color: #0F172A;">
      Defaulter Breakdown by Client:
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; width: 100%; border: 1px solid #CBD5E1; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #0F172A; color: #FFFFFF;">
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 600; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">Client / Code</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 600; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;">Billing Email</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 600; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Max Overdue</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 600; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Oldest Due</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 600; text-align: center; text-transform: uppercase; letter-spacing: 0.5px;">Invoices</th>
          <th style="padding: 10px 12px; font-size: 11px; font-weight: 600; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">Overdue Amount</th>
        </tr>
      </thead>
      <tbody>
        ${clientRows || '<tr><td colspan="6" style="padding: 16px; text-align: center; color: #64748B;">No defaulter clients matching suspension criteria.</td></tr>'}
      </tbody>
      <tfoot>
        <tr style="background: #F1F5F9; border-top: 2px solid #CBD5E1; font-weight: 700;">
          <td colspan="5" style="padding: 10px 12px; font-size: 12px; color: #0F172A; text-align: right;">Total Overdue Sum:</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #DC2626; text-align: right;">₹${formattedTotalAmount}</td>
        </tr>
      </tfoot>
    </table>

    <div style="margin-top: 24px; padding: 14px; background: #F8FAFC; border-radius: 8px; font-size: 12px; color: #64748B; line-height: 1.5;">
      💡 <strong>Action Recommendation:</strong> Operations & Dispatch desks should be notified to put bookings on hold for clients highlighted in red until payment confirmation / UTR is received.
    </div>

    ${renderSignature({
      senderCompany: company.companyName || "PAFEX Logistics",
      senderEmail: company.email || "accounts@pafex.in",
      senderPhone: company.phone || "",
      senderLogo: company.logo || "",
    })}
  `;

  return renderEmailLayout({
    title: summaryTitle,
    bannerColor: "#DC2626",
    companyName: company.companyName || "PAFEX",
    content,
    senderCompany: company.companyName || "PAFEX",
    senderEmail: company.email || "",
    senderPhone: company.phone || "",
    logoUrl: company.logo || "",
  });
}
