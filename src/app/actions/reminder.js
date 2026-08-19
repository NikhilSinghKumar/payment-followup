"use server";

import { db } from "@/db";
import {
  invoices,
  clients,
  companies,
  clientContacts,
  clientContactEmails,
  clientContactNumbers,
  invoiceAwbs,
  paymentAllocations,
  notificationLogs,
} from "@/db/schema";

import { and, eq, inArray, isNull, sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";
import { calculateInvoiceStatus } from "@/lib/invoice-status";
import { enrichInvoices } from "@/lib/invoice-summary";
import { calculateClientSummary } from "@/lib/client-summary";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

/**
 * Fetch invoice reminder data (Invoice, Client, Contacts, Company & Bank Details)
 */
export async function getInvoiceReminderData(invoiceId) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.companyId) {
    return { error: "Unauthorized" };
  }

  const invoiceRows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      financialYear: invoices.financialYear,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      invoiceAmount: invoices.invoiceAmount,
      netPayableAmount: invoices.netPayableAmount,
      status: invoices.status,
      clientId: invoices.clientId,
      companyId: invoices.companyId,
      companyName: clients.companyName,
      companyCode: clients.companyCode,
      clientGst: clients.gstNumber,
      clientEmail: clients.email,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(
      and(
        eq(invoices.id, Number(invoiceId)),
        eq(invoices.companyId, currentUser.companyId),
        isNull(invoices.deletedAt),
      ),
    )
    .limit(1);

  if (!invoiceRows.length) {
    return { error: "Invoice not found" };
  }

  const invoice = invoiceRows[0];

  // Get total paid
  const paymentResult = await db
    .select({
      total: sql`COALESCE(SUM(${paymentAllocations.allocatedAmount}), 0)`,
    })
    .from(paymentAllocations)
    .where(
      and(
        eq(paymentAllocations.invoiceId, invoice.id),
        isNull(paymentAllocations.deletedAt),
      ),
    );

  const totalPaid = Number(paymentResult[0]?.total || 0);
  const statusSummary = calculateInvoiceStatus({
    netPayable: invoice.netPayableAmount,
    paid: totalPaid,
    dueDate: invoice.dueDate,
  });

  // Get AWBs
  const awbs = await db
    .select({
      id: invoiceAwbs.id,
      awbNumber: invoiceAwbs.awbNumber,
      shipmentDate: invoiceAwbs.shipmentDate,
      origin: invoiceAwbs.origin,
      destination: invoiceAwbs.destination,
      weight: invoiceAwbs.weight,
      amount: invoiceAwbs.amount,
    })
    .from(invoiceAwbs)
    .where(
      and(eq(invoiceAwbs.invoiceId, invoice.id), isNull(invoiceAwbs.deletedAt)),
    );

  // Get Client Contacts with emails & numbers
  const contacts = await db.query.clientContacts.findMany({
    where: and(
      eq(clientContacts.clientId, invoice.clientId),
      isNull(clientContacts.deletedAt),
    ),
    with: {
      emails: {
        where: isNull(clientContactEmails.deletedAt),
      },
      numbers: {
        where: isNull(clientContactNumbers.deletedAt),
      },
    },
  });

  // Get Sender Company details
  const companyRows = await db
    .select()
    .from(companies)
    .where(eq(companies.id, currentUser.companyId))
    .limit(1);

  const company = companyRows[0] || {};

  return {
    invoice: {
      ...invoice,
      ...statusSummary,
      awbs,
    },
    client: {
      id: invoice.clientId,
      companyName: invoice.companyName,
      companyCode: invoice.companyCode,
      email: invoice.clientEmail,
    },
    contacts,
    company,
  };
}

/**
 * Fetch client reminder data (All open invoices, Client, Contacts, Company & Bank Details)
 */
export async function getClientReminderData(clientId) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.companyId) {
    return { error: "Unauthorized" };
  }

  const parsedClientId = Number(clientId);

  const clientRows = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.id, parsedClientId),
        eq(clients.companyId, currentUser.companyId),
        isNull(clients.deletedAt),
      ),
    )
    .limit(1);

  if (!clientRows.length) {
    return { error: "Client not found" };
  }

  const client = clientRows[0];

  // Get Invoices
  const data = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      financialYear: invoices.financialYear,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      invoiceAmount: invoices.invoiceAmount,
      netPayableAmount: invoices.netPayableAmount,
      paidAmount: invoices.paidAmount,
      outstandingAmount: invoices.outstandingAmount,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, currentUser.companyId),
        eq(invoices.clientId, parsedClientId),
        isNull(invoices.deletedAt),
      ),
    )
    .orderBy(invoices.dueDate);

  const invoiceList = enrichInvoices(data);
  const clientSummary = calculateClientSummary(invoiceList);

  const openInvoices = invoiceList.filter(
    (invoice) => Number(invoice.due || 0) > 0,
  );

  // Fetch AWBs for open invoices
  const invoiceIds = openInvoices.map((inv) => inv.id);
  const awbMap = {};

  if (invoiceIds.length > 0) {
    const awbRows = await db
      .select({
        invoiceId: invoiceAwbs.invoiceId,
        awbNumber: invoiceAwbs.awbNumber,
      })
      .from(invoiceAwbs)
      .where(
        and(
          inArray(invoiceAwbs.invoiceId, invoiceIds),
          isNull(invoiceAwbs.deletedAt),
        ),
      );

    for (const row of awbRows) {
      if (!awbMap[row.invoiceId]) {
        awbMap[row.invoiceId] = [];
      }
      if (row.awbNumber) {
        awbMap[row.invoiceId].push(row.awbNumber);
      }
    }
  }

  const invoicesWithAwbs = openInvoices.map((inv) => ({
    ...inv,
    awbs: awbMap[inv.id] || [],
  }));

  // Get Client Contacts
  const contacts = await db.query.clientContacts.findMany({
    where: and(
      eq(clientContacts.clientId, parsedClientId),
      isNull(clientContacts.deletedAt),
    ),
    with: {
      emails: {
        where: isNull(clientContactEmails.deletedAt),
      },
      numbers: {
        where: isNull(clientContactNumbers.deletedAt),
      },
    },
  });

  // Get Sender Company details
  const companyRows = await db
    .select()
    .from(companies)
    .where(eq(companies.id, currentUser.companyId))
    .limit(1);

  const company = companyRows[0] || {};

  return {
    client,
    clientSummary,
    invoices: invoicesWithAwbs,
    contacts,
    company,
  };
}

/**
 * Send invoice payment reminder
 */
export async function sendInvoiceReminder({
  invoiceId,
  recipientEmails = [],
  reminderType = "OVERDUE",
  customNote = "",
  channel = "EMAIL",
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!recipientEmails.length && channel === "EMAIL") {
      return {
        success: false,
        error: "Please select or provide at least one recipient email address.",
      };
    }

    const data = await getInvoiceReminderData(invoiceId);
    if (data.error) {
      return { success: false, error: data.error };
    }

    const { invoice, client, company } = data;

    // Build subject and title
    let subject = "";
    let headerTitle = "";
    let headerColor = "#2563eb"; // Blue

    switch (reminderType) {
      case "DUE_SOON":
        subject = `Upcoming Payment Reminder: Invoice #${invoice.invoiceNumber} | ${company.companyName || "PAFEX"}`;
        headerTitle = "Payment Due Soon";
        headerColor = "#2563eb";
        break;
      case "DUE_TODAY":
        subject = `Payment Due Today: Invoice #${invoice.invoiceNumber} | ${company.companyName || "PAFEX"}`;
        headerTitle = "Invoice Due Today";
        headerColor = "#d97706"; // Amber
        break;
      case "FINAL_NOTICE":
        subject = `FINAL NOTICE: Overdue Payment for Invoice #${invoice.invoiceNumber} | Immediate Action Required`;
        headerTitle = "Final Notice / Credit Warning";
        headerColor = "#dc2626"; // Red
        break;
      case "OVERDUE":
      default:
        subject = `Overdue Payment Reminder: Invoice #${invoice.invoiceNumber} (${invoice.dueDaysText || "Overdue"})`;
        headerTitle = "Overdue Payment Notice";
        headerColor = "#ea580c"; // Orange
        break;
    }

    // Format Dates & Amounts
    const formattedDue = Number(invoice.due || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });
    const formattedTotal = Number(invoice.invoiceAmount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
      },
    );
    const formattedDueDate = invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

    const awbListText = invoice.awbs?.length
      ? invoice.awbs.map((a) => a.awbNumber).join(", ")
      : "";

    // Build HTML Email Body
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
        <div style="background: ${headerColor}; padding: 20px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700;">${headerTitle}</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">${company.companyName || "PAFEX Logistics"} • Payment Follow-up</p>
        </div>
        
        <div style="padding: 24px; color: #27272a; line-height: 1.6;">
          <p style="margin-top: 0; font-size: 15px;">Dear <strong>${client.companyName}</strong> Team,</p>
          
          <p style="font-size: 14px; color: #3f3f46;">
            This is a friendly reminder regarding the outstanding balance for invoice <strong>#${invoice.invoiceNumber}</strong>. 
            ${reminderType === "FINAL_NOTICE" ? "<strong style='color: #dc2626;'>Please clear the dues immediately to prevent any interruption to your logistics services.</strong>" : "Kindly process the payment at your earliest convenience."}
          </p>

          ${
            customNote
              ? `<div style="margin: 16px 0; padding: 12px 16px; background: #f4f4f5; border-left: 4px solid ${headerColor}; border-radius: 4px; font-size: 13px; color: #3f3f46;">
                  <strong>Note from sender:</strong><br/>${customNote}
                </div>`
              : ""
          }

          <div style="margin: 20px 0; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
            <div style="background: #fafafa; padding: 10px 16px; border-bottom: 1px solid #e4e4e7; font-weight: 600; font-size: 13px; color: #52525b;">
              INVOICE SUMMARY
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 10px 16px; border-bottom: 1px solid #f4f4f5; color: #71717a;">Invoice Number</td>
                <td style="padding: 10px 16px; border-bottom: 1px solid #f4f4f5; font-weight: 600; text-align: right;">#${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; border-bottom: 1px solid #f4f4f5; color: #71717a;">Due Date</td>
                <td style="padding: 10px 16px; border-bottom: 1px solid #f4f4f5; font-weight: 600; text-align: right; color: ${invoice.isOverdue ? "#dc2626" : "#27272a"};">${formattedDueDate} ${invoice.isOverdue ? `(${invoice.dueDaysText})` : ""}</td>
              </tr>
              ${
                awbListText
                  ? `<tr>
                      <td style="padding: 10px 16px; border-bottom: 1px solid #f4f4f5; color: #71717a;">AWBs / Dockets</td>
                      <td style="padding: 10px 16px; border-bottom: 1px solid #f4f4f5; font-weight: 500; text-align: right; font-family: monospace;">${awbListText}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="padding: 10px 16px; border-bottom: 1px solid #f4f4f5; color: #71717a;">Total Amount</td>
                <td style="padding: 10px 16px; border-bottom: 1px solid #f4f4f5; text-align: right;">₹${formattedTotal}</td>
              </tr>
              <tr style="background: #f8fafc;">
                <td style="padding: 12px 16px; font-weight: 700; color: #0f172a; font-size: 14px;">Balance Due</td>
                <td style="padding: 12px 16px; font-weight: 700; color: #2563eb; text-align: right; font-size: 16px;">₹${formattedDue}</td>
              </tr>
            </table>
          </div>

          ${
            company.bankName || company.bankAccountNumber || company.bankUpi
              ? `<div style="margin: 20px 0; padding: 14px 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 12px; color: #334155;">
                  <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 6px;">Bank Payment Details:</strong>
                  ${company.bankName ? `<div><strong>Bank:</strong> ${company.bankName}</div>` : ""}
                  ${company.bankAccountNumber ? `<div><strong>A/C No:</strong> ${company.bankAccountNumber}</div>` : ""}
                  ${company.bankIfsc ? `<div><strong>IFSC:</strong> ${company.bankIfsc}</div>` : ""}
                  ${company.bankUpi ? `<div><strong>UPI:</strong> ${company.bankUpi}</div>` : ""}
                </div>`
              : ""
          }

          <p style="font-size: 13px; color: #71717a; margin-bottom: 0;">
            If you have already made this payment, kindly disregard this email or send us the transaction reference / UTR number for reconciliation.
          </p>
        </div>

        <div style="background: #fafafa; padding: 16px 24px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #71717a; text-align: center;">
          <p style="margin: 0;"><strong>${company.companyName || "PAFEX"}</strong></p>
          <p style="margin: 4px 0 0 0;">${company.email || ""} ${company.phone ? `• ${company.phone}` : ""}</p>
        </div>
      </div>
    `;

    // Send email to each recipient
    const sendPromises = recipientEmails.map(async (email) => {
      let emailSuccess = false;
      let errorMsg = null;

      try {
        await sendEmail({
          to: email,
          subject,
          html: htmlBody,
        });
        emailSuccess = true;
      } catch (err) {
        console.error("Failed to send email to", email, err);
        errorMsg = err?.message || "Failed to send email";
      }

      // Log notification in DB
      try {
        await db.insert(notificationLogs).values({
          companyId: currentUser.companyId,
          clientId: client.id,
          invoiceId: invoice.id,
          channel: "EMAIL",
          recipient: email,
          subject,
          status: emailSuccess ? "DELIVERED" : "FAILED",
          errorMessage: errorMsg,
          sentAt: new Date(),
        });
      } catch (logErr) {
        console.error("Failed to write notification log:", logErr);
      }

      return { email, success: emailSuccess };
    });

    await Promise.all(sendPromises);

    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath(`/clients/${client.id}`);

    return {
      success: true,
      message: `Payment reminder sent successfully to ${recipientEmails.join(", ")}`,
    };
  } catch (error) {
    console.error("sendInvoiceReminder error:", error);
    return {
      success: false,
      error: error?.message || "Failed to dispatch reminder",
    };
  }
}

/**
 * Send consolidated client statement reminder
 */
export async function sendClientReminder({
  clientId,
  recipientEmails = [],
  reminderType = "STATEMENT",
  customNote = "",
  channel = "EMAIL",
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!recipientEmails.length && channel === "EMAIL") {
      return {
        success: false,
        error: "Please select or provide at least one recipient email address.",
      };
    }

    const data = await getClientReminderData(clientId);
    if (data.error) {
      return { success: false, error: data.error };
    }

    const { client, clientSummary, invoices: openInvoices, company } = data;

    let subject = "";
    let headerTitle = "";
    let headerColor = "#2563eb";

    switch (reminderType) {
      case "SUSPENSION_WARNING":
        subject = `URGENT: Outstanding Dues & Service Suspension Warning | ${client.companyName}`;
        headerTitle = "Credit Terms Warning / Final Demand";
        headerColor = "#dc2626";
        break;
      case "OVERDUE_NOTICE":
        subject = `Overdue Statement of Account: ${clientSummary.overdueInvoices} Overdue Invoices | ${client.companyName}`;
        headerTitle = "Overdue Statement Notice";
        headerColor = "#ea580c";
        break;
      case "STATEMENT":
      default:
        subject = `Statement of Outstanding Invoices (${openInvoices.length} Pending) | ${client.companyName}`;
        headerTitle = "Statement of Account";
        headerColor = "#2563eb";
        break;
    }

    const formattedTotalOutstanding = Number(
      clientSummary.outstandingAmount || 0,
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });
    const formattedOverdueAmount = Number(
      clientSummary.overdueAmount || 0,
    ).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });

    // Build invoices table rows
    const rowsHtml = openInvoices
      .map((inv) => {
        const dueFormatted = Number(inv.due || 0).toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        });
        const dueDateFormatted = inv.dueDate
          ? new Date(inv.dueDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—";
        const awbText = inv.awbs?.length
          ? inv.awbs.slice(0, 2).join(", ")
          : "—";

        return `
          <tr style="border-bottom: 1px solid #f4f4f5; font-size: 12px;">
            <td style="padding: 8px 12px; font-weight: 600;">#${inv.invoiceNumber}</td>
            <td style="padding: 8px 12px; color: ${inv.isOverdue ? "#dc2626" : "#52525b"}; font-weight: ${inv.isOverdue ? "600" : "400"};">${dueDateFormatted}</td>
            <td style="padding: 8px 12px; font-family: monospace; color: #71717a;">${awbText}</td>
            <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #0f172a;">₹${dueFormatted}</td>
          </tr>
        `;
      })
      .join("");

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
        <div style="background: ${headerColor}; padding: 20px 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700;">${headerTitle}</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">${company.companyName || "PAFEX Logistics"} • Outstanding Ledger</p>
        </div>
        
        <div style="padding: 24px; color: #27272a; line-height: 1.6;">
          <p style="margin-top: 0; font-size: 15px;">Dear <strong>${client.companyName}</strong> Team,</p>
          
          <p style="font-size: 14px; color: #3f3f46;">
            Please find below the consolidated statement of your pending and overdue invoices. 
            There are currently <strong>${openInvoices.length} outstanding invoices</strong> with a total pending balance of <strong style="color: #2563eb;">₹${formattedTotalOutstanding}</strong>.
          </p>

          ${
            clientSummary.overdueInvoices > 0
              ? `<div style="margin: 12px 0; padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px; color: #991b1b;">
                  ⚠️ <strong>${clientSummary.overdueInvoices} invoices are overdue</strong> totaling <strong>₹${formattedOverdueAmount}</strong>. Please prioritize settling these invoices.
                </div>`
              : ""
          }

          ${
            customNote
              ? `<div style="margin: 16px 0; padding: 12px 16px; background: #f4f4f5; border-left: 4px solid ${headerColor}; border-radius: 4px; font-size: 13px; color: #3f3f46;">
                  <strong>Note from sender:</strong><br/>${customNote}
                </div>`
              : ""
          }

          <div style="margin: 20px 0; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
            <div style="background: #fafafa; padding: 10px 14px; border-bottom: 1px solid #e4e4e7; font-weight: 600; font-size: 13px; color: #52525b;">
              OUTSTANDING INVOICES LIST
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 1px solid #e4e4e7; font-size: 11px; text-transform: uppercase; color: #64748b;">
                  <th style="padding: 8px 12px; text-align: left;">Invoice</th>
                  <th style="padding: 8px 12px; text-align: left;">Due Date</th>
                  <th style="padding: 8px 12px; text-align: left;">AWBs</th>
                  <th style="padding: 8px 12px; text-align: right;">Balance Due</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
              <tfoot>
                <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1;">
                  <td colspan="3" style="padding: 10px 12px; font-weight: 700; font-size: 13px; color: #0f172a;">Total Outstanding</td>
                  <td style="padding: 10px 12px; font-weight: 700; font-size: 15px; color: #2563eb; text-align: right;">₹${formattedTotalOutstanding}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${
            company.bankName || company.bankAccountNumber || company.bankUpi
              ? `<div style="margin: 20px 0; padding: 14px 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 12px; color: #334155;">
                  <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 6px;">Bank Payment Details:</strong>
                  ${company.bankName ? `<div><strong>Bank:</strong> ${company.bankName}</div>` : ""}
                  ${company.bankAccountNumber ? `<div><strong>A/C No:</strong> ${company.bankAccountNumber}</div>` : ""}
                  ${company.bankIfsc ? `<div><strong>IFSC:</strong> ${company.bankIfsc}</div>` : ""}
                  ${company.bankUpi ? `<div><strong>UPI:</strong> ${company.bankUpi}</div>` : ""}
                </div>`
              : ""
          }

          <p style="font-size: 13px; color: #71717a; margin-bottom: 0;">
            Kindly share the payment confirmation / UTR details once processed.
          </p>
        </div>

        <div style="background: #fafafa; padding: 16px 24px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #71717a; text-align: center;">
          <p style="margin: 0;"><strong>${company.companyName || "PAFEX"}</strong></p>
          <p style="margin: 4px 0 0 0;">${company.email || ""} ${company.phone ? `• ${company.phone}` : ""}</p>
        </div>
      </div>
    `;

    // Send email to each recipient
    const sendPromises = recipientEmails.map(async (email) => {
      let emailSuccess = false;
      let errorMsg = null;

      try {
        await sendEmail({
          to: email,
          subject,
          html: htmlBody,
        });
        emailSuccess = true;
      } catch (err) {
        console.error("Failed to send statement to", email, err);
        errorMsg = err?.message || "Failed to send email";
      }

      try {
        await db.insert(notificationLogs).values({
          companyId: currentUser.companyId,
          clientId: client.id,
          channel: "EMAIL",
          recipient: email,
          subject,
          status: emailSuccess ? "DELIVERED" : "FAILED",
          errorMessage: errorMsg,
          sentAt: new Date(),
        });
      } catch (logErr) {
        console.error("Failed to write notification log:", logErr);
      }

      return { email, success: emailSuccess };
    });

    await Promise.all(sendPromises);

    revalidatePath(`/clients/${clientId}`);

    return {
      success: true,
      message: `Statement reminder sent successfully to ${recipientEmails.join(", ")}`,
    };
  } catch (error) {
    console.error("sendClientReminder error:", error);
    return {
      success: false,
      error: error?.message || "Failed to dispatch statement reminder",
    };
  }
}

/**
 * Fetch bulk invoices grouped by client for bulk reminder modal preview
 */
export async function getBulkInvoicesReminderPreview(invoiceIds = []) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { error: "Unauthorized" };
    }

    if (!invoiceIds.length) {
      return { error: "No invoices selected" };
    }

    const numericIds = invoiceIds.map(Number).filter((id) => !isNaN(id));

    // Fetch invoices
    const invoiceRows = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        financialYear: invoices.financialYear,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        invoiceAmount: invoices.invoiceAmount,
        netPayableAmount: invoices.netPayableAmount,
        paidAmount: invoices.paidAmount,
        outstandingAmount: invoices.outstandingAmount,
        clientId: invoices.clientId,
        companyName: clients.companyName,
        companyCode: clients.companyCode,
        clientGst: clients.gstNumber,
        clientEmail: clients.email,
      })
      .from(invoices)
      .innerJoin(clients, eq(clients.id, invoices.clientId))
      .where(
        and(
          inArray(invoices.id, numericIds),
          eq(invoices.companyId, currentUser.companyId),
          isNull(invoices.deletedAt),
        ),
      )
      .orderBy(invoices.dueDate);

    if (!invoiceRows.length) {
      return { error: "No matching invoices found" };
    }

    const enriched = enrichInvoices(invoiceRows);

    // Fetch AWBs for these invoices
    const awbRows = await db
      .select({
        invoiceId: invoiceAwbs.invoiceId,
        awbNumber: invoiceAwbs.awbNumber,
      })
      .from(invoiceAwbs)
      .where(
        and(
          inArray(invoiceAwbs.invoiceId, numericIds),
          isNull(invoiceAwbs.deletedAt),
        ),
      );

    const awbMap = {};
    for (const a of awbRows) {
      if (!awbMap[a.invoiceId]) awbMap[a.invoiceId] = [];
      if (a.awbNumber) awbMap[a.invoiceId].push(a.awbNumber);
    }

    // Get unique Client IDs
    const clientIds = [...new Set(enriched.map((i) => i.clientId))];

    // Fetch contacts for all unique clients
    const contactsRows = await db.query.clientContacts.findMany({
      where: and(
        inArray(clientContacts.clientId, clientIds),
        isNull(clientContacts.deletedAt),
      ),
      with: {
        emails: {
          where: isNull(clientContactEmails.deletedAt),
        },
        numbers: {
          where: isNull(clientContactNumbers.deletedAt),
        },
      },
    });

    const contactsByClient = {};
    for (const c of contactsRows) {
      if (!contactsByClient[c.clientId]) contactsByClient[c.clientId] = [];
      contactsByClient[c.clientId].push(c);
    }

    // Get Sender Company details
    const companyRows = await db
      .select()
      .from(companies)
      .where(eq(companies.id, currentUser.companyId))
      .limit(1);

    const company = companyRows[0] || {};

    // Group invoices by Client
    const clientMap = {};
    for (const inv of enriched) {
      const cId = inv.clientId;
      if (!clientMap[cId]) {
        const clientContactsList = contactsByClient[cId] || [];
        const defaultEmails = [];
        for (const c of clientContactsList) {
          for (const em of c.emails || []) {
            if (
              em.email &&
              (c.receivesInvoice || c.isPrimary || em.isPrimary)
            ) {
              defaultEmails.push(em.email);
            }
          }
        }
        if (defaultEmails.length === 0 && inv.clientEmail) {
          defaultEmails.push(inv.clientEmail);
        }

        clientMap[cId] = {
          clientId: cId,
          companyName: inv.companyName,
          companyCode: inv.companyCode,
          clientGst: inv.clientGst,
          clientEmail: inv.clientEmail,
          invoices: [],
          totalDue: 0,
          overdueCount: 0,
          contacts: clientContactsList,
          selectedEmails: [...new Set(defaultEmails)],
          enabled: true,
        };
      }

      const invoiceWithAwbs = {
        ...inv,
        awbs: awbMap[inv.id] || [],
      };

      clientMap[cId].invoices.push(invoiceWithAwbs);
      clientMap[cId].totalDue += Number(inv.due || 0);
      if (inv.isOverdue) {
        clientMap[cId].overdueCount += 1;
      }
    }

    const clientGroups = Object.values(clientMap);
    const grandTotalDue = clientGroups.reduce((sum, g) => sum + g.totalDue, 0);

    return {
      clientGroups,
      totalInvoices: enriched.length,
      totalClients: clientGroups.length,
      grandTotalDue,
      company,
    };
  } catch (error) {
    console.error("getBulkInvoicesReminderPreview error:", error);
    return { error: error?.message || "Failed to load bulk reminder preview" };
  }
}

/**
 * Dispatch bulk grouped reminders (1 consolidated statement per client)
 */
export async function sendBulkGroupedReminders({
  clientGroups = [],
  reminderType = "STATEMENT",
  customNote = "",
  channel = "EMAIL",
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    const activeGroups = clientGroups.filter(
      (g) =>
        g.enabled !== false && g.selectedEmails && g.selectedEmails.length > 0,
    );

    if (!activeGroups.length) {
      return {
        success: false,
        error: "No active clients with recipient emails configured.",
      };
    }

    // Company Info
    const companyRows = await db
      .select()
      .from(companies)
      .where(eq(companies.id, currentUser.companyId))
      .limit(1);

    const company = companyRows[0] || {};

    let totalEmailsSent = 0;
    let totalInvoicesCovered = 0;
    const errors = [];

    // Dispatch 1 consolidated email per client group
    for (const group of activeGroups) {
      const {
        clientId,
        companyName,
        invoices: groupInvoices,
        selectedEmails,
        totalDue,
        overdueCount,
      } = group;

      let subject = "";
      let headerTitle = "";
      let headerColor = "#2563eb";

      switch (reminderType) {
        case "SUSPENSION_WARNING":
          subject = `URGENT: Outstanding Dues & Service Suspension Warning | ${companyName}`;
          headerTitle = "Credit Terms Warning / Final Demand";
          headerColor = "#dc2626";
          break;
        case "OVERDUE_NOTICE":
          subject = `Overdue Statement of Account: ${overdueCount} Overdue Invoices | ${companyName}`;
          headerTitle = "Overdue Statement Notice";
          headerColor = "#ea580c";
          break;
        case "STATEMENT":
        default:
          subject = `Statement of Outstanding Invoices (${groupInvoices.length} Invoices) | ${companyName}`;
          headerTitle = "Statement of Account";
          headerColor = "#2563eb";
          break;
      }

      const formattedTotalDue = Number(totalDue || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });

      const rowsHtml = groupInvoices
        .map((inv) => {
          const dueFormatted = Number(inv.due || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          });
          const dueDateFormatted = inv.dueDate
            ? new Date(inv.dueDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—";
          const awbText = inv.awbs?.length
            ? inv.awbs.slice(0, 2).join(", ")
            : "—";

          return `
            <tr style="border-bottom: 1px solid #f4f4f5; font-size: 12px;">
              <td style="padding: 8px 12px; font-weight: 600;">#${inv.invoiceNumber}</td>
              <td style="padding: 8px 12px; color: ${inv.isOverdue ? "#dc2626" : "#52525b"}; font-weight: ${inv.isOverdue ? "600" : "400"};">${dueDateFormatted}</td>
              <td style="padding: 8px 12px; font-family: monospace; color: #71717a;">${awbText}</td>
              <td style="padding: 8px 12px; text-align: right; font-weight: 600; color: #0f172a;">₹${dueFormatted}</td>
            </tr>
          `;
        })
        .join("");

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden;">
          <div style="background: ${headerColor}; padding: 20px 24px; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 700;">${headerTitle}</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">${company.companyName || "PAFEX Logistics"} • Outstanding Ledger</p>
          </div>
          
          <div style="padding: 24px; color: #27272a; line-height: 1.6;">
            <p style="margin-top: 0; font-size: 15px;">Dear <strong>${companyName}</strong> Team,</p>
            
            <p style="font-size: 14px; color: #3f3f46;">
              Please find below the consolidated statement of your outstanding invoices. 
              There are currently <strong>${groupInvoices.length} pending invoices</strong> totaling <strong style="color: #2563eb;">₹${formattedTotalDue}</strong>.
            </p>

            ${
              overdueCount > 0
                ? `<div style="margin: 12px 0; padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 13px; color: #991b1b;">
                    ⚠️ <strong>${overdueCount} of these invoices are past due</strong>. Please arrange settlement at your earliest convenience.
                  </div>`
                : ""
            }

            ${
              customNote
                ? `<div style="margin: 16px 0; padding: 12px 16px; background: #f4f4f5; border-left: 4px solid ${headerColor}; border-radius: 4px; font-size: 13px; color: #3f3f46;">
                    <strong>Note from sender:</strong><br/>${customNote}
                  </div>`
                : ""
            }

            <div style="margin: 20px 0; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
              <div style="background: #fafafa; padding: 10px 14px; border-bottom: 1px solid #e4e4e7; font-weight: 600; font-size: 13px; color: #52525b;">
                OUTSTANDING INVOICES (${groupInvoices.length})
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #e4e4e7; font-size: 11px; text-transform: uppercase; color: #64748b;">
                    <th style="padding: 8px 12px; text-align: left;">Invoice</th>
                    <th style="padding: 8px 12px; text-align: left;">Due Date</th>
                    <th style="padding: 8px 12px; text-align: left;">AWBs</th>
                    <th style="padding: 8px 12px; text-align: right;">Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
                <tfoot>
                  <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1;">
                    <td colspan="3" style="padding: 10px 12px; font-weight: 700; font-size: 13px; color: #0f172a;">Total Balance</td>
                    <td style="padding: 10px 12px; font-weight: 700; font-size: 15px; color: #2563eb; text-align: right;">₹${formattedTotalDue}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            ${
              company.bankName || company.bankAccountNumber || company.bankUpi
                ? `<div style="margin: 20px 0; padding: 14px 16px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 12px; color: #334155;">
                    <strong style="color: #0f172a; font-size: 13px; display: block; margin-bottom: 6px;">Bank Payment Details:</strong>
                    ${company.bankName ? `<div><strong>Bank:</strong> ${company.bankName}</div>` : ""}
                    ${company.bankAccountNumber ? `<div><strong>A/C No:</strong> ${company.bankAccountNumber}</div>` : ""}
                    ${company.bankIfsc ? `<div><strong>IFSC:</strong> ${company.bankIfsc}</div>` : ""}
                    ${company.bankUpi ? `<div><strong>UPI:</strong> ${company.bankUpi}</div>` : ""}
                  </div>`
                : ""
            }

            <p style="font-size: 13px; color: #71717a; margin-bottom: 0;">
              Kindly share transaction details / UTR number once payment is initiated.
            </p>
          </div>

          <div style="background: #fafafa; padding: 16px 24px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #71717a; text-align: center;">
            <p style="margin: 0;"><strong>${company.companyName || "PAFEX"}</strong></p>
            <p style="margin: 4px 0 0 0;">${company.email || ""} ${company.phone ? `• ${company.phone}` : ""}</p>
          </div>
        </div>
      `;

      // Send to each contact recipient for this client
      for (const email of selectedEmails) {
        let emailSuccess = false;
        let errorMsg = null;

        try {
          await sendEmail({
            to: email,
            subject,
            html: htmlBody,
          });
          emailSuccess = true;
          totalEmailsSent += 1;
        } catch (err) {
          console.error(
            `Failed to send bulk reminder to ${email} for client ${companyName}:`,
            err,
          );
          errorMsg = err?.message || "Failed to send email";
          errors.push(`${companyName} (${email}): ${errorMsg}`);
        }

        // Log notification in DB for this client and each invoice
        try {
          for (const inv of groupInvoices) {
            await db.insert(notificationLogs).values({
              companyId: currentUser.companyId,
              clientId,
              invoiceId: inv.id,
              channel: "EMAIL",
              recipient: email,
              subject,
              status: emailSuccess ? "DELIVERED" : "FAILED",
              errorMessage: errorMsg,
              sentAt: new Date(),
            });
          }
        } catch (logErr) {
          console.error("Failed to write notification log:", logErr);
        }
      }

      totalInvoicesCovered += groupInvoices.length;
    }

    revalidatePath("/invoices");
    revalidatePath("/clients");

    return {
      success: true,
      clientsCount: activeGroups.length,
      emailsSent: totalEmailsSent,
      invoicesCovered: totalInvoicesCovered,
      errors: errors.length > 0 ? errors : null,
      message: `Dispatched ${activeGroups.length} consolidated statement(s) covering ${totalInvoicesCovered} invoice(s) across ${totalEmailsSent} email recipient(s).`,
    };
  } catch (error) {
    console.error("sendBulkGroupedReminders error:", error);
    return {
      success: false,
      error: error?.message || "Failed to dispatch bulk reminders",
    };
  }
}
