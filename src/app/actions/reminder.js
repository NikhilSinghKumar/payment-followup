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

    // Build unified HTML Email Body using shared automatic layout system
    const htmlBody = renderManualSingleInvoiceReminderEmail({
      invoice,
      client,
      company,
      reminderType,
      customNote,
    });

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
        headerTitle = "Overdue Statement Reminder";
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
      invoices: openInvoices,
      company,
      reminderType,
      customNote,
    });

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
          headerTitle = "Overdue Statement Reminder";
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
        groupInvoices,
        company,
        reminderType,
        customNote,
        totalDue: totalDue || 0,
        overdueCount,
      });

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

    const html = renderManualBulkInvoicesReminderEmail({
      client: { companyName: group.companyName },
      groupInvoices: group.invoices || [],
      company,
      reminderType,
      customNote,
      totalDue: group.totalDue || 0,
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
