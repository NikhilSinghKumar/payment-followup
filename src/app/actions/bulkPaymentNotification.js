"use server";

import { db } from "@/db";
import {
  payments,
  paymentAllocations,
  invoices,
  clients,
  clientContacts,
  clientContactEmails,
  companies,
  notificationLogs,
} from "@/db/schema";
import { and, eq, inArray, isNull, sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";
import { sendEmail } from "@/lib/email";
import { renderEmailLayout } from "@/lib/notifications/email-layout";
import {
  renderGreeting,
  renderParagraph,
  renderStatusBanner,
  renderAlertBox,
  renderBankDetails,
  renderSignature,
  renderCustomNote,
} from "@/lib/notifications/email-components";
import { revalidatePath } from "next/cache";

/**
 * Fetch payments for bulk notification with rich filtering by date, month/year, client, or specific payment IDs
 */
export async function getBulkPaymentNotificationsPreview({
  paymentIds = [],
  filterDate = "",
  filterMonth = "", // YYYY-MM
  clientId = null,
} = {}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { error: "Unauthorized" };
    }

    const companyId = currentUser.companyId;

    // Load Sender Company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    // Build filter conditions
    const conditions = [
      eq(payments.companyId, companyId),
      isNull(payments.deletedAt),
      eq(payments.isVoided, false),
    ];

    if (paymentIds && paymentIds.length > 0) {
      const numericIds = paymentIds.map(Number).filter((id) => !isNaN(id));
      if (numericIds.length > 0) {
        conditions.push(inArray(payments.id, numericIds));
      }
    }

    if (clientId) {
      conditions.push(eq(payments.clientId, Number(clientId)));
    }

    // Fetch payments
    const rawPayments = await db.query.payments.findMany({
      where: and(...conditions),
      with: {
        client: {
          columns: {
            id: true,
            companyName: true,
            companyCode: true,
            email: true,
          },
        },
        allocations: {
          with: {
            invoice: {
              columns: {
                id: true,
                invoiceNumber: true,
                invoiceAmount: true,
                netPayableAmount: true,
                paidAmount: true,
                outstandingAmount: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [desc(payments.paymentDate), desc(payments.createdAt)],
    });

    // In-memory filter for date or month if requested
    let filtered = rawPayments;
    if (filterDate) {
      filtered = filtered.filter((p) => {
        if (!p.paymentDate) return false;
        const dateStr = new Date(p.paymentDate).toISOString().slice(0, 10);
        return dateStr === filterDate;
      });
    } else if (filterMonth) {
      filtered = filtered.filter((p) => {
        if (!p.paymentDate) return false;
        const monthStr = new Date(p.paymentDate).toISOString().slice(0, 7);
        return monthStr === filterMonth;
      });
    }

    if (filtered.length === 0) {
      return {
        groups: [],
        totalPayments: 0,
        totalAmount: 0,
        company: company || {},
      };
    }

    // Fetch client contacts for all unique clients in this batch
    const uniqueClientIds = Array.from(
      new Set(filtered.map((p) => p.clientId).filter(Boolean)),
    );

    const clientContactsMap = {};
    if (uniqueClientIds.length > 0) {
      const contacts = await db.query.clientContacts.findMany({
        where: and(
          inArray(clientContacts.clientId, uniqueClientIds),
          isNull(clientContacts.deletedAt),
          eq(clientContacts.status, "active"),
        ),
        with: {
          emails: {
            where: and(
              isNull(clientContactEmails.deletedAt),
              eq(clientContactEmails.isActive, true),
            ),
          },
        },
      });

      for (const contact of contacts) {
        if (!clientContactsMap[contact.clientId]) {
          clientContactsMap[contact.clientId] = [];
        }
        clientContactsMap[contact.clientId].push(contact);
      }
    }

    // Group payments by client
    const groupedMap = new Map();

    for (const payment of filtered) {
      const client = payment.client;
      if (!client) continue;

      if (!groupedMap.has(client.id)) {
        const clientContactsList = clientContactsMap[client.id] || [];
        const availableEmails = [];

        // Add emails from contacts
        for (const contact of clientContactsList) {
          const contactEmails = (contact.emails || [])
            .map((e) => e.email?.trim())
            .filter(Boolean);
          for (const email of contactEmails) {
            if (!availableEmails.includes(email)) {
              availableEmails.push(email);
            }
          }
        }

        // Fallback to client company email if none
        if (availableEmails.length === 0 && client.email) {
          availableEmails.push(client.email.trim());
        }

        groupedMap.set(client.id, {
          clientId: client.id,
          clientName: client.companyName || "Unknown Client",
          clientCode: client.companyCode || "",
          availableEmails,
          selectedEmails: availableEmails.slice(0, 2), // select primary by default
          payments: [],
          totalPaidAmount: 0,
        });
      }

      const clientGroup = groupedMap.get(client.id);
      const paymentAmount = Number(payment.amount || 0);

      const allocatedAmount = (payment.allocations || []).reduce(
        (sum, a) => sum + Number(a.allocatedAmount || 0),
        0,
      );

      const unallocatedAmount = Math.max(paymentAmount - allocatedAmount, 0);

      clientGroup.payments.push({
        id: payment.id,
        receiptNumber: payment.receiptNumber || "",
        reference: payment.reference || "",
        method: payment.method || "bank",
        paymentDate: payment.paymentDate,
        amount: paymentAmount,
        allocatedAmount,
        unallocatedAmount,
        notes: payment.notes || "",
        allocations: (payment.allocations || []).map((a) => ({
          id: a.id,
          invoiceId: a.invoiceId,
          invoiceNumber: a.invoice?.invoiceNumber || "—",
          allocatedAmount: Number(a.allocatedAmount || 0),
          netPayableAmount: Number(a.invoice?.netPayableAmount || 0),
          outstandingAmount: Number(a.invoice?.outstandingAmount || 0),
          status: a.invoice?.status || "unpaid",
        })),
      });

      clientGroup.totalPaidAmount += paymentAmount;
    }

    const groups = Array.from(groupedMap.values());
    const totalPayments = filtered.length;
    const totalAmount = groups.reduce((sum, g) => sum + g.totalPaidAmount, 0);

    return {
      groups,
      totalPayments,
      totalAmount,
      company: company || {},
    };
  } catch (error) {
    console.error("getBulkPaymentNotificationsPreview error:", error);
    return {
      error: error?.message || "Failed to load payment notification preview.",
    };
  }
}

/**
 * Dispatch bulk payment confirmation / receipt emails to selected clients
 */
export async function sendBulkPaymentConfirmationEmails({
  clientBatches = [],
  subjectTemplate = "",
  customMessage = "",
  ccAccounts = true,
  ccEmails = [],
} = {}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const companyId = currentUser.companyId;

    if (!clientBatches || clientBatches.length === 0) {
      return { success: false, error: "No clients selected for dispatch." };
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const senderCompany = company?.companyName || "PAFEX Logistics";
    const senderEmail = company?.email || "billing@pafex.in";

    let totalDispatched = 0;
    let totalFailed = 0;
    const results = [];

    for (const batch of clientBatches) {
      const {
        clientId,
        clientName,
        recipientEmails = [],
        paymentIds = [],
        customNote = "",
      } = batch;

      if (!recipientEmails.length || !paymentIds.length) {
        continue;
      }

      // Query complete payment details for this client
      const clientPayments = await db.query.payments.findMany({
        where: and(
          inArray(payments.id, paymentIds),
          eq(payments.companyId, companyId),
          isNull(payments.deletedAt),
        ),
        with: {
          allocations: {
            with: {
              invoice: {
                columns: {
                  id: true,
                  invoiceNumber: true,
                  netPayableAmount: true,
                  outstandingAmount: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: [desc(payments.paymentDate)],
      });

      if (!clientPayments.length) continue;

      const totalBatchAmount = clientPayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );

      const formattedTotal = totalBatchAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });

      // Build Subject
      const defaultSubject = `Official Payment Acknowledgment & Receipt - PAFEX`;
      const emailSubject = subjectTemplate
        ? subjectTemplate
            .replace("{clientName}", clientName)
            .replace("{amount}", `₹${formattedTotal}`)
            .replace("{count}", String(clientPayments.length))
        : defaultSubject;

      // Render HTML Email
      const emailHtml = renderBulkPaymentReceiptEmailHtml({
        clientName,
        payments: clientPayments,
        company: company || {},
        totalAmount: totalBatchAmount,
        customNote: customNote || customMessage,
      });

      // Send to each recipient email
      for (const email of recipientEmails) {
        let isSuccess = false;
        let errorMsg = null;

        try {
          const sendResult = await sendEmail({
            from: `"${senderCompany}" <${senderEmail}>`,
            to: email,
            cc:
              ccAccounts && company?.email
                ? [company.email, ...ccEmails]
                : ccEmails,
            subject: emailSubject,
            html: emailHtml,
          });

          isSuccess = Boolean(sendResult?.id || sendResult?.success);
          if (!isSuccess && sendResult?.error) {
            errorMsg = sendResult.error;
          }
        } catch (sendErr) {
          isSuccess = false;
          errorMsg = sendErr?.message || "Failed to deliver email.";
        }

        if (isSuccess) {
          totalDispatched++;
        } else {
          totalFailed++;
        }

        // Audit Log
        try {
          await db.insert(notificationLogs).values({
            companyId,
            clientId,
            channel: "EMAIL",
            recipient: email,
            subject: emailSubject,
            status: isSuccess ? "DELIVERED" : "FAILED",
            errorMessage: errorMsg,
            sentAt: new Date(),
          });
        } catch (logErr) {
          console.error("Failed to log payment notification:", logErr);
        }

        results.push({
          clientId,
          clientName,
          email,
          status: isSuccess ? "DELIVERED" : "FAILED",
          error: errorMsg,
        });
      }
    }

    revalidatePath("/payments");
    revalidatePath("/settings?tab=logs");

    return {
      success: true,
      totalDispatched,
      totalFailed,
      results,
      message: `Dispatched ${totalDispatched} payment confirmation email(s) successfully.${
        totalFailed > 0 ? ` (${totalFailed} failed)` : ""
      }`,
    };
  } catch (error) {
    console.error("sendBulkPaymentConfirmationEmails error:", error);
    return {
      success: false,
      error: error?.message || "Failed to dispatch bulk payment confirmations.",
    };
  }
}

/**
 * HTML Renderer for Bulk Payment Receipts
 */
function renderBulkPaymentReceiptEmailHtml({
  clientName,
  payments = [],
  company = {},
  totalAmount = 0,
  customNote = "",
}) {
  const formattedTotal = Number(totalAmount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

  const paymentRowsHtml = payments
    .map((p) => {
      const paymentDate = p.paymentDate
        ? new Date(p.paymentDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";

      const amountFormatted = Number(p.amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });

      const allocationsSummary = (p.allocations || [])
        .map(
          (a) =>
            `<span style="display: inline-block; background: #F1F5F9; color: #334155; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin: 1px 2px;">
              #${a.invoice?.invoiceNumber || a.invoiceId}: ₹${Number(a.allocatedAmount || 0).toLocaleString("en-IN")}
            </span>`,
        )
        .join(" ");

      return `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #0F172A;">
            ${p.receiptNumber || `PAY-${p.id}`}
            ${p.reference ? `<div style="font-size: 11px; color: #64748B; font-weight: normal;">Ref: ${p.reference}</div>` : ""}
          </td>
          <td style="padding: 10px 12px; font-size: 12px; color: #475569;">
            ${paymentDate}
          </td>
          <td style="padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #475569;">
            ${p.method || "Bank"}
          </td>
          <td style="padding: 10px 12px; font-size: 12px; color: #475569;">
            ${allocationsSummary || '<span style="color: #94A3B8; font-size: 11px;">Unallocated Credit</span>'}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; font-weight: 700; color: #059669; text-align: right;">
            ₹${amountFormatted}
          </td>
        </tr>
      `;
    })
    .join("");

  const content = `
    ${renderGreeting(clientName || "Valued Customer")}

    ${renderStatusBanner({
      title: "Payment Receipt Acknowledgment",
      color: "#059669",
      background: "#D1FAE5",
    })}

    ${renderParagraph(
      `We gratefully acknowledge receipt of payment totaling <strong style="color: #059669; font-size: 15px;">₹${formattedTotal}</strong>. The credited amounts have been applied to your ledger and relevant account invoices as itemized below:`,
    )}

    ${customNote ? renderCustomNote(customNote, "#059669") : ""}

    <div style="margin: 20px 0; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: #FFFFFF;">
      <div style="background: #F8FAFC; padding: 10px 14px; font-size: 12px; font-weight: 700; color: #334155; border-bottom: 1px solid #E2E8F0;">
        Received Payment Breakdown (${payments.length} Transaction${payments.length > 1 ? "s" : ""})
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #F1F5F9; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 8px 12px; font-weight: 600;">Receipt / Ref</th>
            <th style="padding: 8px 12px; font-weight: 600;">Date</th>
            <th style="padding: 8px 12px; font-weight: 600;">Mode</th>
            <th style="padding: 8px 12px; font-weight: 600;">Applied Invoices</th>
            <th style="padding: 8px 12px; font-weight: 600; text-align: right;">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${paymentRowsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #F8FAFC; font-weight: 700;">
            <td colspan="4" style="padding: 10px 12px; font-size: 13px; color: #1E293B; text-align: right;">
              Total Payment Received:
            </td>
            <td style="padding: 10px 12px; font-size: 14px; color: #059669; text-align: right;">
              ₹${formattedTotal}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    ${renderParagraph(
      "Your account ledger has been updated accordingly. If you have any questions, pleae contact Pafex accounts team before 48 hours of this email, otherwise this settlement will be considered final.",
    )}

    ${renderBankDetails(company)}

    ${renderSignature({
      senderCompany: company.companyName || "PAFEX",
      senderEmail: company.email || "",
      senderPhone: company.phone || "",
      senderLogo: company.logoUrl || "",
    })}
  `;

  return renderEmailLayout({
    title: `Payment Receipt Acknowledgment - ${company.companyName || "PAFEX"}`,
    bannerColor: "#053896",
    companyName: company.companyName || "PAFEX",
    content,
    senderCompany: company.companyName || "PAFEX",
    senderEmail: company.email || "",
    senderPhone: company.phone || "",
    logoUrl: company.logoUrl || "",
  });
}
