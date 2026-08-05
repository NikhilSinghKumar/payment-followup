"use server";

import { db } from "@/db";
import {
  invoices,
  clients,
  clientSubClients,
  followups,
  followupInvoices,
} from "@/db/schema";

import { eq, and, isNull, desc, inArray } from "drizzle-orm";

import { enrichInvoices } from "@/lib/invoice-summary";
import { calculateClientSummary } from "@/lib/client-summary";
import { getCurrentUser } from "@/lib/auth/auth";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * ======================================================
 * GET CLIENT INVOICES FOR FOLLOW-UP
 * ======================================================
 */
export async function getInvoicesForFollowup(clientId) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const parsedClientId = Number(clientId);

  if (!parsedClientId) {
    return {
      clientSummary: null,
      invoices: [],
    };
  }

  const data = await db
    .select({
      id: invoices.id,

      invoiceNumber: invoices.invoiceNumber,
      invoiceAmount: invoices.invoiceAmount,
      netPayableAmount: invoices.netPayableAmount,

      // Payment summary stored on invoice
      paidAmount: invoices.paidAmount,
      outstandingAmount: invoices.outstandingAmount,

      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      financialYear: invoices.financialYear,

      companyName: clients.companyName,
      companyCode: clients.companyCode,

      subClientId: invoices.subClientId,
      subClientName: clientSubClients.companyName,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(clientSubClients, eq(invoices.subClientId, clientSubClients.id))
    .where(
      and(
        eq(invoices.companyId, currentUser.companyId),
        eq(invoices.clientId, parsedClientId),
        isNull(invoices.deletedAt),
      ),
    )
    .orderBy(invoices.dueDate);

  // Calculate status, due, overdue etc.
  const invoiceList = enrichInvoices(data);

  // Client summary should include all invoices
  const clientSummary = calculateClientSummary(invoiceList);

  // Only invoices having an outstanding balance
  const followupInvoices = invoiceList
    .filter((invoice) => Number(invoice.due || 0) > 0)
    .sort((a, b) => {
      // Overdue first
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      // Then highest outstanding first
      return Number(b.due || 0) - Number(a.due || 0);
    });

  return {
    clientSummary,
    invoices: followupInvoices,
  };
}

/**
 * ======================================================
 * CREATE FOLLOW-UP
 * ======================================================
 *
 * A follow-up belongs to a CLIENT.
 *
 * Related invoices are optional and may contain
 * zero, one, or multiple invoices.
 * ======================================================
 */
export async function createFollowup(formData) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const clientId = Number(formData.get("clientId"));

  if (!clientId) {
    throw new Error("Invalid client.");
  }

  /**
   * Multiple hidden/form inputs can use:
   *
   * name="invoiceIds"
   *
   * Therefore getAll() returns all selected invoices.
   */
  const invoiceIds = formData.getAll("invoiceIds").map(Number).filter(Boolean);

  const followupDateValue = formData.get("followupDate");
  const nextFollowupDateValue = formData.get("nextFollowupDate");

  if (!followupDateValue) {
    throw new Error("Follow-up date is required.");
  }

  const followupDate = new Date(followupDateValue);

  const nextFollowupDate = nextFollowupDateValue
    ? new Date(nextFollowupDateValue)
    : null;

  const note = formData.get("note")?.trim() || "";

  /**
   * ------------------------------------------------------
   * Verify client belongs to current company
   * ------------------------------------------------------
   */
  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, clientId),
      eq(clients.companyId, currentUser.companyId),
      isNull(clients.deletedAt),
    ),
    columns: {
      id: true,
    },
  });

  if (!client) {
    throw new Error("Invalid client.");
  }

  /**
   * ------------------------------------------------------
   * Verify selected invoices
   * ------------------------------------------------------
   *
   * Every selected invoice must:
   * - belong to this client
   * - belong to this company
   * - not be deleted
   */
  if (invoiceIds.length > 0) {
    const validInvoices = await db
      .select({
        id: invoices.id,
      })
      .from(invoices)
      .where(
        and(
          inArray(invoices.id, invoiceIds),
          eq(invoices.clientId, clientId),
          eq(invoices.companyId, currentUser.companyId),
          isNull(invoices.deletedAt),
        ),
      );

    if (validInvoices.length !== invoiceIds.length) {
      throw new Error("One or more selected invoices are invalid.");
    }
  }

  /**
   * ------------------------------------------------------
   * Create follow-up + invoice associations atomically
   * ------------------------------------------------------
   */
  await db.transaction(async (tx) => {
    const [newFollowup] = await tx
      .insert(followups)
      .values({
        companyId: currentUser.companyId,
        clientId,
        note,
        followupDate,
        nextFollowupDate,
      })
      .returning({
        id: followups.id,
      });

    if (invoiceIds.length > 0) {
      await tx.insert(followupInvoices).values(
        invoiceIds.map((invoiceId) => ({
          followupId: newFollowup.id,
          invoiceId,
        })),
      );
    }
  });

  revalidatePath("/followups");
  revalidatePath(`/clients/${clientId}`);

  redirect("/followups");
}

/**
 * ======================================================
 * GET ALL FOLLOW-UPS
 * ======================================================
 *
 * Used by global /followups page.
 * ======================================================
 */
export async function getFollowups() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const rows = await db.query.followups.findMany({
    where: and(
      eq(followups.companyId, currentUser.companyId),
      isNull(followups.deletedAt),
    ),

    with: {
      client: {
        columns: {
          id: true,
          companyName: true,
          companyCode: true,
        },
      },

      followupInvoices: {
        with: {
          invoice: {
            columns: {
              id: true,
              invoiceNumber: true,
              dueDate: true,
            },
          },
        },
      },
    },

    orderBy: [desc(followups.followupDate)],
  });

  return rows;
}

/**
 * ======================================================
 * GET FOLLOW-UPS BY CLIENT
 * ======================================================
 *
 * Used by:
 *
 * /clients/[id]?tab=followups
 * ======================================================
 */
export async function getFollowupsByClient(clientId) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const parsedClientId = Number(clientId);

  if (!parsedClientId) {
    return [];
  }

  /**
   * Also ensures users cannot request another
   * company's client's follow-ups.
   */
  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, parsedClientId),
      eq(clients.companyId, currentUser.companyId),
      isNull(clients.deletedAt),
    ),
    columns: {
      id: true,
    },
  });

  if (!client) {
    return [];
  }

  const rows = await db.query.followups.findMany({
    where: and(
      eq(followups.companyId, currentUser.companyId),
      eq(followups.clientId, parsedClientId),
      isNull(followups.deletedAt),
    ),

    with: {
      followupInvoices: {
        with: {
          invoice: {
            columns: {
              id: true,
              invoiceNumber: true,
              dueDate: true,
            },
          },
        },
      },
    },

    orderBy: [desc(followups.followupDate)],
  });

  return rows;
}
