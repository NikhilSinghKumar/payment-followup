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

import { and, eq, inArray, isNull, sql, desc, ne } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";
import { calculateInvoiceStatus } from "@/lib/invoice-status";
import { enrichInvoices } from "@/lib/invoice-summary";
import {
  calculateClientSummary,
  fetchClientFinancialSummary,
} from "@/lib/client-summary";
import { generateClientLedgerPdf } from "@/lib/pdf/generateLedgerPdf";
import { sendEmail } from "@/lib/email";
import {
  renderManualSingleInvoiceReminderEmail,
  renderManualClientStatementReminderEmail,
  renderManualBulkInvoicesReminderEmail,
} from "@/lib/notifications/email-renderer";
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
  const grossInvoiceAmount = Number(invoice.invoiceAmount || 0);
  const deductions =
    Number(invoice.deductionAmount || 0) + Number(invoice.otherCharges || 0);
  const netInvoiceAmount = Math.max(0, grossInvoiceAmount - deductions);
  const isTdsVerified = Boolean(invoice.isTdsVerified);
  const verifiedTds = isTdsVerified
    ? Number(invoice.tdsDeductedAmount || invoice.tdsAmount || 0)
    : 0;

  // In due/overdue emails:
  // If payment is done: net outstanding = (Total Invoice Amount - total payment received - tds verified)
  // If payment is not done: total outstanding = net invoice amount (not net receivable/payable)
  const remainingDue = Number(
    (netInvoiceAmount - totalPaid - verifiedTds).toFixed(2),
  );
  const isSlightRoundoff =
    isTdsVerified && remainingDue <= 0.99 && remainingDue >= -0.99;
  const outstandingAmount = isSlightRoundoff ? 0 : Math.max(0, remainingDue);

  const statusSummary = calculateInvoiceStatus({
    netPayable: netInvoiceAmount,
    paid: totalPaid,
    verifiedTds,
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

  // Fetch client financial summary matching clients/[id]/page.js
  let clientFinancials = null;
  try {
    clientFinancials = await fetchClientFinancialSummary(invoice.clientId);
  } catch (err) {
    console.warn(
      "Failed to fetch client financials for invoice reminder:",
      err?.message,
    );
  }

  return {
    invoice: {
      ...invoice,
      ...statusSummary,
      invoiceAmount: netInvoiceAmount,
      netPayableAmount: netInvoiceAmount,
      outstandingAmount,
      due: outstandingAmount,
      totalPaid,
      paid: totalPaid,
      verifiedTds,
      isTdsVerified,
      awbs,
    },
    client: {
      id: invoice.clientId,
      companyName: invoice.companyName,
      companyCode: invoice.companyCode,
      email: invoice.clientEmail,
    },
    clientSummary: clientFinancials,
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

  // Fetch exact client financial summary matching clients/[id]/page.js (source of truth)
  const clientFinancials = await fetchClientFinancialSummary(parsedClientId);

  const clientSummary = {
    ...clientFinancials,
    // ensure backward compatibility
    outstandingAmount: clientFinancials.netOutstanding,
  };

  const invoiceList = clientFinancials.normalizedInvoices || [];
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

  const { normalizedInvoices, ...compactClientSummary } = clientSummary;

  return {
    client,
    clientSummary: compactClientSummary,
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
        headerColor = "#2654b6";
        break;
      case "DUE_TODAY":
        subject = `Payment Due Today: Invoice #${invoice.invoiceNumber} | ${company.companyName || "PAFEX"}`;
        headerTitle = "Invoice Due Today";
        headerColor = "#2654b6"; // Amber
        break;
      case "FINAL_NOTICE":
        subject = `FINAL NOTICE: Overdue Payment for Invoice #${invoice.invoiceNumber} | Immediate Action Required`;
        headerTitle = "Final Notice / Credit Warning";
        headerColor = "#2654b6"; // Red
        break;
      case "OVERDUE":
      default:
        subject = `Overdue Payment Reminder: Invoice #${invoice.invoiceNumber} (${invoice.dueDaysText || "Overdue"})`;
        headerTitle = "Overdue Payment Reminder";
        headerColor = "#2654b6"; // Orange
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

    // Fetch client financial summary matching clients/[id]/page.js
    let clientFinancials = null;
    try {
      clientFinancials = await fetchClientFinancialSummary(invoice.clientId);
    } catch (err) {
      console.warn(
        "Failed to fetch client financials for invoice reminder:",
        err?.message,
      );
    }

    // Build unified HTML Email Body using shared automatic layout system
    const htmlBody = renderManualSingleInvoiceReminderEmail({
      invoice,
      client,
      company,
      clientSummary: clientFinancials,
      totalNetPayable: clientFinancials?.totalNetPayable,
      netOutstanding: clientFinancials?.netOutstanding,
      paymentsReceived: clientFinancials?.paymentsReceived,
      reminderType,
      customNote,
    });

    // Send email sequentially to each recipient to avoid parallel SMTP auth flooding
    for (const email of recipientEmails) {
      let emailSuccess = false;
      let errorMsg = null;

      try {
        const sendResult = await sendEmail({
          to: email,
          subject,
          html: htmlBody,
        });
        emailSuccess = Boolean(
          sendResult?.success ||
          sendResult?.messageId ||
          sendResult?.id ||
          (Array.isArray(sendResult?.accepted) &&
            sendResult.accepted.length > 0),
        );
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
    }

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
        headerTitle = "Overdue Statement";
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

    // Build unified HTML Email Body using shared automatic layout system
    const htmlBody = renderManualClientStatementReminderEmail({
      client,
      clientSummary,
      totalNetPayable: clientSummary.totalNetPayable,
      netOutstanding: clientSummary.netOutstanding,
      paymentsReceived: clientSummary.paymentsReceived,
      onAccountAmount: clientSummary.onAccountAmount,
      unallocatedAmount: clientSummary.unallocatedAmount,
      invoices: openInvoices,
      company,
      reminderType,
      customNote,
      actionUrl: `/clients/${client.id}`,
    });

    // Generate official statement PDF attachment so recipient gets full itemized ledger
    const attachments = [];
    try {
      const { buffer, filename } = await generateClientLedgerPdf({
        clientId: client.id,
        statementDate: new Date(),
      });
      if (buffer) {
        attachments.push({
          filename:
            filename ||
            `Statement_Account_${client.companyCode || client.id}.pdf`,
          content: buffer,
          contentType: "application/pdf",
        });
      }
    } catch (pdfErr) {
      console.warn(
        "Could not generate statement PDF attachment:",
        pdfErr?.message,
      );
    }

    // Send email sequentially to each recipient to avoid parallel SMTP auth flooding
    for (const email of recipientEmails) {
      let emailSuccess = false;
      let errorMsg = null;

      try {
        const sendResult = await sendEmail({
          to: email,
          subject,
          html: htmlBody,
          attachments,
        });
        emailSuccess = Boolean(
          sendResult?.success ||
          sendResult?.messageId ||
          sendResult?.id ||
          (Array.isArray(sendResult?.accepted) &&
            sendResult.accepted.length > 0),
        );
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
    }

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
        deductionAmount: invoices.deductionAmount,
        otherCharges: invoices.otherCharges,
        tdsAmount: invoices.tdsAmount,
        tdsDeductedAmount: invoices.tdsDeductedAmount,
        isTdsVerified: invoices.isTdsVerified,
        isOpeningBalance: invoices.isOpeningBalance,
        status: invoices.status,
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

    // Fetch financial summaries for all unique clients matching clients/[id]/page.js
    const clientFinancialsMap = {};
    for (const cId of clientIds) {
      try {
        const fullSummary = await fetchClientFinancialSummary(cId);
        if (fullSummary) {
          const { normalizedInvoices, ...compactSummary } = fullSummary;
          clientFinancialsMap[cId] = compactSummary;
        }
      } catch (err) {
        console.error(
          "Failed to fetch client financials for bulk reminder:",
          err,
        );
      }
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

        const fin = clientFinancialsMap[cId];

        clientMap[cId] = {
          clientId: cId,
          companyName: inv.companyName,
          companyCode: inv.companyCode,
          clientGst: inv.clientGst,
          clientEmail: inv.clientEmail,
          invoices: [],
          totalDue: 0,
          totalNetPayable: fin?.totalNetPayable ?? 0,
          netOutstanding: fin?.netOutstanding ?? 0,
          paymentsReceived: fin?.paymentsReceived ?? 0,
          clientSummary: fin || null,
          overdueCount: 0,
          contacts: clientContactsList,
          selectedEmails: [...new Set(defaultEmails)],
          enabled: true,
        };
      }

      let dueDays = Number(inv.dueDays ?? inv.agingDays ?? 0);
      if (!dueDays && inv.dueDate) {
        const dueD = new Date(inv.dueDate);
        if (!isNaN(dueD.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueD.setHours(0, 0, 0, 0);
          const diff = Math.floor(
            (today.getTime() - dueD.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (diff > 0) dueDays = diff;
        }
      }

      const isOverdue = Boolean(inv.isOverdue || dueDays > 0);
      const isDueToday = Boolean(
        inv.isDueToday || (inv.dueDate && !isOverdue && dueDays === 0),
      );
      const agingStatus =
        inv.agingStatus ||
        (isOverdue
          ? `${dueDays}d Overdue`
          : isDueToday
            ? "Due Today"
            : "Current");
      const agingColor =
        inv.agingColor ||
        (isOverdue ? "#DC2626" : isDueToday ? "#D97706" : "#16A34A");

      const invoiceWithAwbs = {
        ...inv,
        dueDays,
        agingDays: dueDays,
        agingStatus,
        agingColor,
        isOverdue,
        isDueToday,
        creditDays: Number(inv.creditDays || 0),
        awbs: awbMap[inv.id] || [],
      };

      clientMap[cId].invoices.push(invoiceWithAwbs);
      clientMap[cId].totalDue += Number(inv.due || 0);
      if (isOverdue) {
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
 * Supports both call conventions:
 * 1. sendBulkGroupedReminders({ clientGroups, groups, reminderType, customNote, channel })
 * 2. sendBulkGroupedReminders(clientGroupsArray, reminderType, customNote, channel)
 */
export async function sendBulkGroupedReminders(arg1, arg2, arg3, arg4) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.companyId) {
      return { success: false, error: "Unauthorized" };
    }

    let rawGroups = [];
    let reminderType = "STATEMENT";
    let customNote = "";
    let channel = "EMAIL";

    if (Array.isArray(arg1)) {
      rawGroups = arg1;
      if (typeof arg2 === "string") reminderType = arg2;
      if (typeof arg3 === "string") customNote = arg3;
      if (typeof arg4 === "string") channel = arg4;
    } else if (arg1 && typeof arg1 === "object") {
      rawGroups =
        arg1.clientGroups || arg1.groups || arg1.sanitizedGroups || [];
      reminderType = arg1.reminderType || "STATEMENT";
      customNote = arg1.customNote || "";
      channel = arg1.channel || "EMAIL";
    }

    if (!Array.isArray(rawGroups) || rawGroups.length === 0) {
      return {
        success: false,
        error: "No clients selected for bulk statement reminders.",
      };
    }

    // Company Info
    const companyRows = await db
      .select()
      .from(companies)
      .where(eq(companies.id, currentUser.companyId))
      .limit(1);

    const company = companyRows[0] || {};

    // Filter and normalize active groups
    const activeGroups = [];

    for (const group of rawGroups) {
      if (!group) continue;

      // If explicitly disabled by unchecked box, skip
      if (
        group.enabled === false ||
        group.enabled === "false" ||
        group.selected === false
      ) {
        continue;
      }

      const clientId = group.clientId || group.id;
      if (!clientId) continue;

      // Resolve recipient emails from all possible sources
      const rawEmails = [];

      // 1. Array or string or map of selectedEmails
      if (Array.isArray(group.selectedEmails)) {
        for (const e of group.selectedEmails) {
          if (typeof e === "string" && e.trim() && e.includes("@")) {
            rawEmails.push(e.trim());
          } else if (
            e &&
            typeof e === "object" &&
            typeof e.email === "string" &&
            e.email.includes("@")
          ) {
            rawEmails.push(e.email.trim());
          }
        }
      } else if (
        typeof group.selectedEmails === "string" &&
        group.selectedEmails.includes("@")
      ) {
        rawEmails.push(
          ...group.selectedEmails
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.includes("@")),
        );
      } else if (
        group.selectedEmails &&
        typeof group.selectedEmails === "object"
      ) {
        for (const k of Object.keys(group.selectedEmails)) {
          if (group.selectedEmails[k] && typeof k === "string" && k.includes("@")) {
            rawEmails.push(k.trim());
          }
        }
      }

      // 2. recipientEmails
      if (Array.isArray(group.recipientEmails)) {
        for (const e of group.recipientEmails) {
          if (typeof e === "string" && e.trim() && e.includes("@")) {
            rawEmails.push(e.trim());
          } else if (
            e?.email &&
            typeof e.email === "string" &&
            e.email.includes("@")
          ) {
            rawEmails.push(e.email.trim());
          }
        }
      }

      // 3. emails or recipients
      if (Array.isArray(group.emails)) {
        for (const e of group.emails) {
          if (typeof e === "string" && e.trim() && e.includes("@"))
            rawEmails.push(e.trim());
          else if (e?.email) rawEmails.push(e.email.trim());
        }
      }
      if (Array.isArray(group.recipients)) {
        for (const e of group.recipients) {
          if (typeof e === "string" && e.trim() && e.includes("@"))
            rawEmails.push(e.trim());
          else if (e?.email) rawEmails.push(e.email.trim());
        }
      }

      // 4. contacts embedded on group
      if (Array.isArray(group.contacts)) {
        for (const c of group.contacts) {
          for (const em of c.emails || []) {
            const emStr = typeof em === "string" ? em : em?.email;
            if (emStr && emStr.includes("@")) {
              rawEmails.push(emStr.trim());
            }
          }
        }
      }

      // 5. clientEmail
      if (
        group.clientEmail &&
        typeof group.clientEmail === "string" &&
        group.clientEmail.includes("@")
      ) {
        rawEmails.push(group.clientEmail.trim());
      }

      // 6. Database fallback if still empty: fetch contact emails from DB
      if (rawEmails.length === 0) {
        try {
          const dbContacts = await db.query.clientContacts.findMany({
            where: and(
              eq(clientContacts.clientId, clientId),
              isNull(clientContacts.deletedAt),
            ),
            with: {
              emails: {
                where: isNull(clientContactEmails.deletedAt),
              },
            },
          });

          for (const c of dbContacts) {
            for (const em of c.emails || []) {
              if (em.email && em.email.includes("@")) {
                rawEmails.push(em.email.trim());
              }
            }
          }

          if (rawEmails.length === 0) {
            const clientRow = await db.query.clients.findFirst({
              where: eq(clients.id, clientId),
            });
            if (clientRow?.email && clientRow.email.includes("@")) {
              rawEmails.push(clientRow.email.trim());
            }
          }
        } catch (dbErr) {
          console.error(
            "Failed to fetch fallback emails for client:",
            clientId,
            dbErr,
          );
        }
      }

      const selectedEmails = [
        ...new Set(rawEmails.map((e) => e.toLowerCase())),
      ];

      if (selectedEmails.length === 0) {
        console.warn(
          `[sendBulkGroupedReminders] Skipping client ${group.companyName || clientId} - no email recipients found.`,
        );
        continue;
      }

      // Resolve invoices if not supplied
      let groupInvoices = Array.isArray(group.invoices) ? group.invoices : [];
      if (groupInvoices.length === 0) {
        try {
          const dbInvoices = await db.query.invoices.findMany({
            where: and(
              eq(invoices.clientId, clientId),
              isNull(invoices.deletedAt),
              ne(invoices.status, "PAID"),
            ),
            orderBy: [desc(invoices.invoiceDate)],
          });
          groupInvoices = enrichInvoices(dbInvoices);
        } catch (invErr) {
          console.error(
            "Failed to fetch fallback invoices for client:",
            clientId,
            invErr,
          );
        }
      }

      // Ensure every invoice has complete aging attributes populated
      const enrichedGroupInvoices = groupInvoices.map((inv) => {
        let dueDays = Number(inv.dueDays ?? inv.agingDays ?? 0);
        if (!dueDays && inv.dueDate) {
          const dueD = new Date(inv.dueDate);
          if (!isNaN(dueD.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueD.setHours(0, 0, 0, 0);
            const diff = Math.floor(
              (today.getTime() - dueD.getTime()) / (1000 * 60 * 60 * 24),
            );
            if (diff > 0) dueDays = diff;
          }
        }
        const isOverdue = Boolean(inv.isOverdue || dueDays > 0);
        const isDueToday = Boolean(
          inv.isDueToday || (inv.dueDate && !isOverdue && dueDays === 0),
        );
        const agingStatus =
          inv.agingStatus ||
          (isOverdue
            ? `${dueDays}d Overdue`
            : isDueToday
              ? "Due Today"
              : "Current");
        const agingColor =
          inv.agingColor ||
          (isOverdue ? "#DC2626" : isDueToday ? "#D97706" : "#16A34A");

        return {
          ...inv,
          dueDays,
          agingDays: dueDays,
          agingStatus,
          agingColor,
          isOverdue,
          isDueToday,
          creditDays: Number(inv.creditDays || 0),
        };
      });

      // Resolve company name if missing
      let companyName = group.companyName;
      let companyCode = group.companyCode;
      if (!companyName) {
        try {
          const clientRow = await db.query.clients.findFirst({
            where: eq(clients.id, clientId),
          });
          if (clientRow) {
            companyName = clientRow.companyName;
            companyCode = clientRow.companyCode;
          }
        } catch (_) {}
      }

      activeGroups.push({
        ...group,
        clientId,
        companyName: companyName || "Valued Client",
        companyCode: companyCode || "",
        selectedEmails,
        invoices: enrichedGroupInvoices,
        totalDue: Number(group.totalDue || 0),
        overdueCount: Number(
          group.overdueCount ||
            enrichedGroupInvoices.filter((i) => i.isOverdue).length ||
            0,
        ),
      });
    }

    if (!activeGroups.length) {
      return {
        success: false,
        error: "No active clients with recipient emails configured.",
      };
    }

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
          headerTitle = "Overdue Statement";
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

      // Build unified HTML Email Body using shared automatic layout system
      const htmlBody = renderManualBulkInvoicesReminderEmail({
        client: { companyName },
        clientSummary: group.clientSummary,
        totalNetPayable: group.totalNetPayable,
        netOutstanding: group.netOutstanding,
        paymentsReceived: group.paymentsReceived,
        groupInvoices,
        company,
        reminderType,
        customNote,
        totalDue: group.netOutstanding || totalDue || 0,
        overdueCount,
        actionUrl: `/clients/${clientId}`,
      });

      // Generate client statement PDF attachment so recipient gets full itemized ledger
      const attachments = [];
      try {
        const { buffer, filename } = await generateClientLedgerPdf({
          clientId,
          statementDate: new Date(),
        });
        if (buffer) {
          attachments.push({
            filename:
              filename || `Statement_Account_${group.companyCode || clientId}.pdf`,
            content: buffer,
            contentType: "application/pdf",
          });
        }
      } catch (pdfErr) {
        console.warn(
          `Could not generate statement PDF for client ${companyName}:`,
          pdfErr?.message,
        );
      }

      // Send to each contact recipient for this client
      for (const email of selectedEmails) {
        let emailSuccess = false;
        let errorMsg = null;

        try {
          const sendResult = await sendEmail({
            to: email,
            subject,
            html: htmlBody,
            attachments,
          });
          emailSuccess = Boolean(
            sendResult?.success ||
            sendResult?.messageId ||
            sendResult?.id ||
            (Array.isArray(sendResult?.accepted) &&
              sendResult.accepted.length > 0),
          );
          if (emailSuccess) {
            totalEmailsSent += 1;
          } else {
            errorMsg = sendResult?.error || "Failed to deliver email.";
            errors.push(`${companyName} (${email}): ${errorMsg}`);
          }
        } catch (err) {
          console.error(
            `Failed to send bulk reminder to ${email} for client ${companyName}:`,
            err,
          );
          errorMsg = err?.message || "Failed to send email";
          errors.push(`${companyName} (${email}): ${errorMsg}`);
        }

        // Log one record per actual email attempt, not one record per invoice.
        // Keep the included invoice IDs/numbers in metadata for audit traceability.
        try {
          await db.insert(notificationLogs).values({
            companyId: currentUser.companyId,
            clientId,
            invoiceId: null,
            channel: "EMAIL",
            recipient: email,
            subject,
            status: emailSuccess ? "DELIVERED" : "FAILED",
            errorMessage: errorMsg,
            sentAt: new Date(),
            metadata: {
              source: "bulk_invoice_reminder",
              reminderType,
              invoiceCount: groupInvoices.length,
              invoiceIds: groupInvoices.map((inv) => inv.id),
              invoiceNumbers: groupInvoices.map((inv) => inv.invoiceNumber),
            },
          });
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

/**
 * Generate live rendered email preview HTML for single invoice reminder
 */
export async function getSingleInvoiceReminderPreviewHtml({
  invoiceId,
  reminderType = "OVERDUE",
  customNote = "",
}) {
  try {
    const data = await getInvoiceReminderData(invoiceId);
    if (data.error) return { error: data.error };

    const html = renderManualSingleInvoiceReminderEmail({
      invoice: data.invoice,
      client: data.client,
      company: data.company,
      clientSummary: data.clientSummary,
      totalNetPayable: data.clientSummary?.totalNetPayable,
      netOutstanding: data.clientSummary?.netOutstanding,
      paymentsReceived: data.clientSummary?.paymentsReceived,
      reminderType,
      customNote,
    });

    let subject = "";
    switch (reminderType) {
      case "DUE_SOON":
        subject = `Upcoming Payment Reminder: Invoice #${data.invoice.invoiceNumber} | ${data.company.companyName || "PAFEX"}`;
        break;
      case "DUE_TODAY":
        subject = `Payment Due Today: Invoice #${data.invoice.invoiceNumber} | ${data.company.companyName || "PAFEX"}`;
        break;
      case "FINAL_NOTICE":
        subject = `FINAL NOTICE: Overdue Payment for Invoice #${data.invoice.invoiceNumber} | Immediate Action Required`;
        break;
      case "OVERDUE":
      default:
        subject = `Overdue Payment Reminder: Invoice #${data.invoice.invoiceNumber} (${data.invoice.dueDaysText || "Overdue"})`;
        break;
    }

    return { success: true, html, subject, company: data.company };
  } catch (err) {
    return { error: err?.message || "Failed to render preview" };
  }
}

/**
 * Generate live rendered email preview HTML for client statement reminder
 */
export async function getClientStatementReminderPreviewHtml({
  clientId,
  reminderType = "STATEMENT",
  customNote = "",
}) {
  try {
    const data = await getClientReminderData(clientId);
    if (data.error) return { error: data.error };

    const html = renderManualClientStatementReminderEmail({
      client: data.client,
      clientSummary: data.clientSummary,
      totalNetPayable: data.clientSummary?.totalNetPayable,
      netOutstanding: data.clientSummary?.netOutstanding,
      paymentsReceived: data.clientSummary?.paymentsReceived,
      onAccountAmount: data.clientSummary?.onAccountAmount,
      unallocatedAmount: data.clientSummary?.unallocatedAmount,
      invoices: data.invoices,
      company: data.company,
      reminderType,
      customNote,
    });

    let subject = "";
    switch (reminderType) {
      case "SUSPENSION_WARNING":
        subject = `URGENT: Outstanding Dues & Service Suspension Warning | ${data.client.companyName}`;
        break;
      case "OVERDUE_NOTICE":
        subject = `Overdue Statement of Account: ${data.clientSummary.overdueInvoices} Overdue Invoices | ${data.client.companyName}`;
        break;
      case "STATEMENT":
      default:
        subject = `Statement of Outstanding Invoices (${data.invoices.length} Invoices) | ${data.client.companyName}`;
        break;
    }

    return { success: true, html, subject, company: data.company };
  } catch (err) {
    return { error: err?.message || "Failed to render preview" };
  }
}

/**
 * Generate live rendered email preview HTML for bulk statement group
 */
export async function getBulkStatementPreviewHtml({
  group,
  reminderType = "STATEMENT",
  customNote = "",
}) {
  try {
    const currentUser = await getCurrentUser();
    let company = {};
    if (currentUser?.companyId) {
      const companyRows = await db
        .select()
        .from(companies)
        .where(eq(companies.id, currentUser.companyId))
        .limit(1);
      if (companyRows.length > 0) company = companyRows[0];
    }

    const rawInvoices = group.invoices || [];
    const enrichedGroupInvoices = rawInvoices.map((inv) => {
      let dueDays = Number(inv.dueDays ?? inv.agingDays ?? 0);
      if (!dueDays && inv.dueDate) {
        const dueD = new Date(inv.dueDate);
        if (!isNaN(dueD.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueD.setHours(0, 0, 0, 0);
          const diff = Math.floor(
            (today.getTime() - dueD.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (diff > 0) dueDays = diff;
        }
      }
      const isOverdue = Boolean(inv.isOverdue || dueDays > 0);
      const isDueToday = Boolean(
        inv.isDueToday || (inv.dueDate && !isOverdue && dueDays === 0),
      );
      const agingStatus =
        inv.agingStatus ||
        (isOverdue
          ? `${dueDays}d Overdue`
          : isDueToday
            ? "Due Today"
            : "Current");
      const agingColor =
        inv.agingColor ||
        (isOverdue ? "#DC2626" : isDueToday ? "#D97706" : "#16A34A");

      return {
        ...inv,
        dueDays,
        agingDays: dueDays,
        agingStatus,
        agingColor,
        isOverdue,
        isDueToday,
        creditDays: Number(inv.creditDays || 0),
      };
    });

    const html = renderManualBulkInvoicesReminderEmail({
      client: { companyName: group.companyName },
      groupInvoices: enrichedGroupInvoices,
      company,
      reminderType,
      customNote,
      totalDue: group.netOutstanding || group.totalDue || 0,
      totalNetPayable: group.totalNetPayable,
      netOutstanding: group.netOutstanding,
      paymentsReceived: group.paymentsReceived,
      clientSummary: group.clientSummary,
      overdueCount: group.overdueCount || 0,
    });

    let subject = "";
    switch (reminderType) {
      case "SUSPENSION_WARNING":
        subject = `URGENT: Outstanding Dues & Service Suspension Warning | ${group.companyName}`;
        break;
      case "OVERDUE_NOTICE":
        subject = `Overdue Statement of Account: ${group.overdueCount} Overdue Invoices | ${group.companyName}`;
        break;
      case "STATEMENT":
      default:
        subject = `Statement of Outstanding Invoices (${group.invoices?.length || 0} Invoices) | ${group.companyName}`;
        break;
    }

    return { success: true, html, subject };
  } catch (err) {
    return { error: err?.message || "Failed to render preview" };
  }
}
