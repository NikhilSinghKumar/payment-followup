"use server";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server.edge";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  clients,
  clientContacts,
  clientContactEmails,
  companies,
  notificationLogs,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/auth";
import { sendEmail } from "@/lib/email";
import { EmailLayout } from "@/lib/notifications/email-layout";
import { Paragraph, Signature } from "@/lib/notifications/email-components";

const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || "accounts@pafex.in";

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function renderCustomEmail({ subject, body, company }) {
  const safeBody = escapeHtml(body).replace(/\r?\n/g, "<br />");
  const markup = renderToStaticMarkup(
    <EmailLayout
      title={subject}
      previewText={subject}
      companyName={company?.companyName || "PAFEX"}
      senderCompany="Prakash Air Freight India Pvt Ltd"
      senderEmail={FROM_EMAIL}
      senderPhone={company?.phone || ""}
      logoUrl={company?.logo || ""}
      showSystemGeneratedNotice={false}
    >
      <Paragraph text={safeBody} />
      <Signature
        senderCompany="Prakash Air Freight India Pvt Ltd"
        senderEmail={FROM_EMAIL}
        senderPhone={company?.phone || ""}
        senderLogo={company?.logo || ""}
      />
    </EmailLayout>,
  );
  return `<!DOCTYPE html>${markup}`;
}

async function getAuthorizedContext() {
  const auth = await getCurrentUser();
  if (!auth?.companyId) throw new Error("Unauthorized");
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, auth.companyId))
    .limit(1);
  return { companyId: auth.companyId, company };
}

export async function getCustomBulkEmailClients() {
  try {
    const { companyId } = await getAuthorizedContext();
    const rows = await db
      .select({
        clientId: clients.id,
        clientName: clients.companyName,
        contactId: clientContacts.id,
        contactName: clientContacts.name,
        contactPrimary: clientContacts.isPrimary,
        contactStatus: clientContacts.status,
        emailId: clientContactEmails.id,
        email: clientContactEmails.email,
        emailPrimary: clientContactEmails.isPrimary,
        emailActive: clientContactEmails.isActive,
      })
      .from(clients)
      .innerJoin(clientContacts, eq(clientContacts.clientId, clients.id))
      .innerJoin(
        clientContactEmails,
        eq(clientContactEmails.contactId, clientContacts.id),
      )
      .where(
        and(
          eq(clients.companyId, companyId),
          eq(clients.isActive, true),
          isNull(clients.deletedAt),
          isNull(clientContacts.deletedAt),
          eq(clientContacts.status, "active"),
          isNull(clientContactEmails.deletedAt),
          eq(clientContactEmails.isActive, true),
        ),
      )
      .orderBy(
        asc(clients.companyName),
        asc(clientContacts.isPrimary),
        asc(clientContactEmails.isPrimary),
      );

    const grouped = new Map();
    for (const row of rows) {
      const key = row.clientId;
      if (!grouped.has(key))
        grouped.set(key, {
          id: key,
          name: row.clientName,
          contacts: [],
          emailSet: new Set(),
        });
      const client = grouped.get(key);
      if (!client.emailSet.has(row.email.toLowerCase())) {
        client.emailSet.add(row.email.toLowerCase());
        client.contacts.push({
          contactId: row.contactId,
          contactName: row.contactName,
          isPrimaryContact: Boolean(row.contactPrimary),
          emailId: row.emailId,
          email: row.email,
          isPrimaryEmail: Boolean(row.emailPrimary),
        });
      }
    }
    return {
      success: true,
      clients: [...grouped.values()].map(
        ({ emailSet, contacts, ...client }) => {
          const sorted = contacts.sort(
            (a, b) =>
              Number(b.isPrimaryContact) - Number(a.isPrimaryContact) ||
              Number(b.isPrimaryEmail) - Number(a.isPrimaryEmail),
          );
          const primary =
            sorted.find((c) => c.isPrimaryContact && c.isPrimaryEmail) ||
            sorted.find((c) => c.isPrimaryContact) ||
            sorted.find((c) => c.isPrimaryEmail) ||
            sorted[0];
          return {
            ...client,
            recipients: sorted.map((c) => ({
              ...c,
              isPrimary: c.emailId === primary?.emailId,
            })),
          };
        },
      ),
    };
  } catch (error) {
    console.error("Custom bulk email clients error:", error);
    return {
      success: false,
      error: error.message || "Unable to load clients.",
    };
  }
}

export async function previewCustomBulkEmail({ clientId, subject, body } = {}) {
  try {
    const { companyId, company } = await getAuthorizedContext();
    if (!clientId || !subject?.trim() || !body?.trim())
      return {
        success: false,
        error: "Client, subject and email body are required.",
      };
    const clientRows = await db
      .select({
        id: clients.id,
        name: clients.companyName,
        email: clientContactEmails.email,
      })
      .from(clients)
      .leftJoin(
        clientContacts,
        and(
          eq(clientContacts.clientId, clients.id),
          isNull(clientContacts.deletedAt),
          eq(clientContacts.status, "active"),
        ),
      )
      .leftJoin(
        clientContactEmails,
        and(
          eq(clientContactEmails.contactId, clientContacts.id),
          isNull(clientContactEmails.deletedAt),
          eq(clientContactEmails.isActive, true),
        ),
      )
      .where(
        and(
          eq(clients.id, Number(clientId)),
          eq(clients.companyId, companyId),
          eq(clients.isActive, true),
          isNull(clients.deletedAt),
        ),
      );
    const client = clientRows[0];
    if (!client)
      return { success: false, error: "Selected client was not found." };
    const finalSubject = subject.trim();
    return {
      success: true,
      subject: finalSubject,
      html: renderCustomEmail({
        subject: finalSubject,
        body: body.trim(),
        company,
      }),
    };
  } catch (error) {
    console.error("Custom bulk email preview error:", error);
    return {
      success: false,
      error: error.message || "Unable to create preview.",
    };
  }
}

export async function sendCustomBulkEmail({
  clientIds = [],
  subject = "",
  body = "",
} = {}) {
  try {
    const { companyId, company } = await getAuthorizedContext();
    const ids = [
      ...new Set(
        clientIds.map(Number).filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];
    if (!ids.length)
      return { success: false, error: "Select at least one client." };
    if (!subject.trim() || !body.trim())
      return { success: false, error: "Subject and email body are required." };
    if (subject.trim().length > 250)
      return { success: false, error: "Subject cannot exceed 250 characters." };

    // Re-fetch all recipients on the server. Never trust recipient addresses supplied by the browser.
    const rows = await db
      .select({
        clientId: clients.id,
        clientName: clients.companyName,
        contactId: clientContacts.id,
        contactName: clientContacts.name,
        contactPrimary: clientContacts.isPrimary,
        emailId: clientContactEmails.id,
        email: clientContactEmails.email,
        emailPrimary: clientContactEmails.isPrimary,
      })
      .from(clients)
      .innerJoin(clientContacts, eq(clientContacts.clientId, clients.id))
      .innerJoin(
        clientContactEmails,
        eq(clientContactEmails.contactId, clientContacts.id),
      )
      .where(
        and(
          eq(clients.companyId, companyId),
          inArray(clients.id, ids),
          eq(clients.isActive, true),
          isNull(clients.deletedAt),
          isNull(clientContacts.deletedAt),
          eq(clientContacts.status, "active"),
          isNull(clientContactEmails.deletedAt),
          eq(clientContactEmails.isActive, true),
        ),
      );

    const byClient = new Map();
    for (const row of rows) {
      if (!byClient.has(row.clientId))
        byClient.set(row.clientId, {
          id: row.clientId,
          name: row.clientName,
          contacts: [],
          seen: new Set(),
        });
      const group = byClient.get(row.clientId);
      const normalized = row.email.trim().toLowerCase();
      if (normalized && !group.seen.has(normalized)) {
        group.seen.add(normalized);
        group.contacts.push({
          contactId: row.contactId,
          contactName: row.contactName,
          contactPrimary: Boolean(row.contactPrimary),
          emailId: row.emailId,
          email: row.email.trim(),
          emailPrimary: Boolean(row.emailPrimary),
        });
      }
    }

    const results = [];
    for (const clientId of ids) {
      const group = byClient.get(clientId);
      if (!group?.contacts.length) {
        results.push({
          clientId,
          clientName: group?.name || `Client #${clientId}`,
          status: "SKIPPED",
          error: "No active contact email addresses found.",
        });
        continue;
      }
      const contacts = group.contacts.sort(
        (a, b) =>
          Number(b.contactPrimary) - Number(a.contactPrimary) ||
          Number(b.emailPrimary) - Number(a.emailPrimary),
      );
      const primary =
        contacts.find((c) => c.contactPrimary && c.emailPrimary) ||
        contacts.find((c) => c.contactPrimary) ||
        contacts.find((c) => c.emailPrimary) ||
        contacts[0];
      const to = primary.email;
      const cc = contacts.filter((c) => c.email !== to).map((c) => c.email);
      const finalSubject = subject.trim();
      const finalBody = body.trim();
      try {
        const html = renderCustomEmail({
          subject: finalSubject,
          body: finalBody,
          company,
        });
        const sent = await sendEmail({
          to,
          cc,
          subject: finalSubject,
          html,
          from: `"PAFEX Accounts" <${FROM_EMAIL}>`,
          replyTo: FROM_EMAIL,
        });
        const rejected = sent.rejected || [];
        const status = rejected.length ? "FAILED" : "SENT";
        await db.insert(notificationLogs).values({
          companyId,
          clientId: group.id,
          channel: "EMAIL",
          recipient: [to, ...cc].join(", "),
          subject: finalSubject,
          status,
          sentAt: status === "SENT" ? new Date() : null,
          provider: "SMTP",
          providerMessageId: sent.messageId || null,
          errorMessage: rejected.length
            ? `Rejected recipients: ${rejected.join(", ")}`
            : null,
          metadata: {
            source: "custom_bulk_email",
            to,
            cc,
            recipientCount: 1 + cc.length,
          },
        });
        results.push({
          clientId,
          clientName: group.name,
          status,
          recipientCount: 1 + cc.length,
          to,
          cc,
        });
      } catch (error) {
        await db.insert(notificationLogs).values({
          companyId,
          clientId: group.id,
          channel: "EMAIL",
          recipient: [to, ...cc].join(", "),
          subject: finalSubject,
          status: "FAILED",
          errorMessage: error.message || "SMTP send failed",
          provider: "SMTP",
          metadata: {
            source: "custom_bulk_email",
            to,
            cc,
            recipientCount: 1 + cc.length,
          },
        });
        results.push({
          clientId,
          clientName: group.name,
          status: "FAILED",
          recipientCount: 1 + cc.length,
          error: error.message || "SMTP send failed",
        });
      }
    }
    return {
      success: true,
      results,
      sent: results.filter((r) => r.status === "SENT").length,
      failed: results.filter((r) => r.status === "FAILED").length,
      skipped: results.filter((r) => r.status === "SKIPPED").length,
    };
  } catch (error) {
    console.error("Custom bulk email send error:", error);
    return {
      success: false,
      error: error.message || "Unable to send bulk emails.",
    };
  }
}
