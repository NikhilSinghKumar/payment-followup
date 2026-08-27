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
import { renderEmail } from "@/lib/notifications/email-renderer";
import { NOTIFICATION_TYPES } from "@/lib/notifications/notification-types";
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
                  invoiceDate: true,
                  dueDate: true,
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

      if (!clientPayments.length) continue;

      const totalBatchAmount = clientPayments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );

      const formattedTotal = totalBatchAmount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
      });

      // Aggregate settled invoices across payments
      const settledInvoicesMap = new Map();

      for (const payment of clientPayments) {
        for (const alloc of payment.allocations || []) {
          const inv = alloc.invoice;
          if (!inv) continue;
          const invId = inv.id;
          const allocated = Number(alloc.allocatedAmount || 0);
          const totalAmount = Number(
            inv.netPayableAmount || inv.invoiceAmount || 0,
          );

          if (settledInvoicesMap.has(invId)) {
            const existing = settledInvoicesMap.get(invId);
            existing.settledAmount += allocated;
            existing.remainingBalance = Math.max(
              0,
              existing.remainingBalance - allocated,
            );
          } else {
            const remainingBalance = Number(
              inv.outstandingAmount !== null &&
                inv.outstandingAmount !== undefined
                ? inv.outstandingAmount
                : Math.max(0, totalAmount - Number(inv.paidAmount || 0)),
            );

            settledInvoicesMap.set(invId, {
              invoiceId: inv.id,
              invoiceNumber: inv.invoiceNumber || `INV-${inv.id}`,
              invoiceDate: inv.invoiceDate,
              dueDate: inv.dueDate,
              invoiceAmount: totalAmount,
              settledAmount: allocated,
              remainingBalance,
            });
          }
        }
      }

      const settledInvoices = Array.from(settledInvoicesMap.values());

      // Query current total account outstanding
      let totalAccountOutstanding = 0;
      try {
        const clientInvoices = await db
          .select({
            id: invoices.id,
            netPayableAmount: invoices.netPayableAmount,
            invoiceAmount: invoices.invoiceAmount,
            paidAmount: sql`
              COALESCE(
                SUM(${paymentAllocations.allocatedAmount}),
                0
              )
            `,
          })
          .from(invoices)
          .leftJoin(
            paymentAllocations,
            and(
              eq(paymentAllocations.invoiceId, invoices.id),
              isNull(paymentAllocations.deletedAt),
            ),
          )
          .where(
            and(
              eq(invoices.clientId, clientId),
              eq(invoices.companyId, companyId),
              isNull(invoices.deletedAt),
              sql`${invoices.status} != 'cancelled'`,
            ),
          )
          .groupBy(
            invoices.id,
            invoices.netPayableAmount,
            invoices.invoiceAmount,
          );

        for (const inv of clientInvoices) {
          const total = Number(inv.netPayableAmount || inv.invoiceAmount || 0);
          const paid = Number(inv.paidAmount || 0);
          totalAccountOutstanding += Math.max(0, total - paid);
        }
      } catch (err) {
        console.warn(
          "Error calculating totalAccountOutstanding for bulk receipt:",
          err,
        );
      }

      // Collect payment details
      const uniqueMethods = Array.from(
        new Set(clientPayments.map((p) => p.method).filter(Boolean)),
      );
      const paymentMethod =
        uniqueMethods.length > 0
          ? uniqueMethods.join(", ")
          : "Bank Transfer / RTGS / NEFT";

      const uniqueRefs = Array.from(
        new Set(clientPayments.map((p) => p.reference).filter(Boolean)),
      );
      const referenceNumber =
        uniqueRefs.length > 0 ? uniqueRefs.join(", ") : "N/A";

      const latestPaymentDate =
        clientPayments[0]?.paymentDate || new Date().toISOString();

      // Subject
      const defaultSubject = `Payment Received - ${senderCompany}`;
      const emailSubject = subjectTemplate
        ? subjectTemplate
            .replace("{clientName}", clientName)
            .replace("{amount}", `₹${formattedTotal}`)
            .replace("{count}", String(clientPayments.length))
        : defaultSubject;

      // Body text matching the requested standard wording
      const defaultBody =
        settledInvoices.length > 0
          ? `We have received your payment of ₹${formattedTotal}, which has been successfully settled against ${settledInvoices.length} invoice(s).`
          : `We have received your payment of ₹${formattedTotal}, which has been credited to your account ledger.`;

      const finalCustomNote = customNote || customMessage || "";

      // Render standard unified email using renderEmail (with NOTIFICATION_TYPES.PAYMENT_RECEIVED)
      const emailHtml = renderEmail({
        type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
        body: defaultBody,
        variables: {
          clientName: clientName || "Valued Customer",
          paymentAmount: totalBatchAmount,
          paymentDate: latestPaymentDate,
          paymentMethod,
          referenceNumber,
          settledInvoices,
          totalAccountOutstanding,
          customNote: finalCustomNote,
          company: company || {},
          senderCompany,
          senderEmail,
          senderPhone: company?.phone || "",
          senderLogo: company?.logo || company?.logoUrl || "",
          invoiceNumber:
            settledInvoices.length === 1
              ? settledInvoices[0].invoiceNumber
              : settledInvoices.length > 1
                ? `${settledInvoices[0].invoiceNumber} (+${settledInvoices.length - 1} more)`
                : "",
        },
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

          isSuccess = Boolean(
            sendResult?.success ||
            sendResult?.messageId ||
            sendResult?.id ||
            (Array.isArray(sendResult?.accepted) &&
              sendResult.accepted.length > 0),
          );
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
