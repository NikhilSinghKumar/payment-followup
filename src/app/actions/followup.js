"use server";

import { db } from "@/db";
import {
  invoices,
  clients,
  clientSubClients,
  payments,
  followups,
} from "@/db/schema";
import { eq, sql, and, isNull, desc } from "drizzle-orm";
import { enrichInvoices } from "@/lib/invoice-summary";
import { calculateClientSummary } from "@/lib/client-summary";
import { getCurrentUser } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function getInvoicesForFollowup(clientId) {
  const data = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      invoiceAmount: invoices.invoiceAmount,
      netPayableAmount: invoices.netPayableAmount,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      financialYear: invoices.financialYear,

      companyName: clients.companyName,
      companyCode: clients.companyCode,

      subClientId: invoices.subClientId,
      subClientName: clientSubClients.companyName,

      paid: sql`
        COALESCE(SUM(${payments.amount}), 0)
      `,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(clientSubClients, eq(invoices.subClientId, clientSubClients.id))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .where(and(eq(invoices.clientId, clientId), isNull(invoices.deletedAt)))
    .groupBy(
      invoices.id,
      clients.companyName,
      clients.companyCode,
      clientSubClients.companyName,
    )
    .orderBy(invoices.dueDate);

  const invoiceList = enrichInvoices(data);

  const clientSummary = calculateClientSummary(invoiceList);

  const followupInvoices = invoiceList
    .filter((inv) => inv.status !== "paid")
    .sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (a.status !== "overdue" && b.status === "overdue") return 1;

      return Number(b.due) - Number(a.due);
    });

  return {
    clientSummary,
    invoices: followupInvoices,
  };
}

export async function createFollowup(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const invoiceId = Number(formData.get("invoiceId"));

  if (!invoiceId) {
    throw new Error("Invalid invoice.");
  }

  const followupDateValue = formData.get("followupDate");
  const nextFollowupDateValue = formData.get("nextFollowupDate");

  if (!followupDateValue) {
    throw new Error("Follow-up date is required.");
  }

  const followupDate = new Date(followupDateValue);

  const nextFollowupDate = nextFollowupDateValue
    ? new Date(nextFollowupDateValue)
    : null;

  const note = formData.get("note");

  const existing = await db.query.followups.findFirst({
    where: and(
      eq(followups.invoiceId, invoiceId),
      eq(followups.followupDate, followupDate),
      isNull(followups.deletedAt),
    ),
  });

  if (existing) {
    return {
      success: false,
      message:
        "A follow-up already exists for this invoice on the selected date.",
    };
  }

  await db.insert(followups).values({
    companyId: currentUser.companyId,
    invoiceId,
    note: note?.trim() || "",
    followupDate,
    nextFollowupDate,
  });

  revalidatePath("/followups");
  redirect("/followups");
}

export async function getFollowups() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const rows = await db
    .select({
      id: followups.id,
      companyName: clients.companyName,
      invoiceNumber: invoices.invoiceNumber,
      followupDate: followups.followupDate,
      nextFollowupDate: followups.nextFollowupDate,
      note: followups.note,
    })
    .from(followups)
    .innerJoin(invoices, eq(followups.invoiceId, invoices.id))
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(
      and(
        eq(followups.companyId, currentUser.companyId),
        isNull(followups.deletedAt),
      ),
    )
    .orderBy(desc(followups.followupDate));

  return rows;
}
