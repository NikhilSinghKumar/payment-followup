"use server";

import { db } from "@/db";
import {
  clients,
  invoices,
  creditNotes,
  creditNoteAllocations,
} from "@/db/schema";
import { and, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/auth";

async function getAuthorizedCompany() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.user || !currentUser?.companyId) {
    throw new Error("Unauthorized");
  }
  return { user: currentUser.user, companyId: Number(currentUser.companyId) };
}

export async function getCreditNotes() {
  const { companyId } = await getAuthorizedCompany();

  return db
    .select({
      id: creditNotes.id,
      creditNoteNumber: creditNotes.creditNoteNumber,
      creditNoteDate: creditNotes.creditNoteDate,
      totalAmount: creditNotes.totalAmount,
      reason: creditNotes.reason,
      status: creditNotes.status,
      clientId: creditNotes.clientId,
      clientName: clients.companyName,
      clientCode: clients.companyCode,
    })
    .from(creditNotes)
    .innerJoin(clients, eq(creditNotes.clientId, clients.id))
    .where(
      and(
        eq(creditNotes.companyId, companyId),
        isNull(creditNotes.deletedAt),
        isNull(clients.deletedAt),
      ),
    )
    .orderBy(desc(creditNotes.creditNoteDate), desc(creditNotes.id));
}

export async function getCreditNoteFormData() {
  const { companyId } = await getAuthorizedCompany();

  const [clientRows, invoiceRows] = await Promise.all([
    db
      .select({
        id: clients.id,
        companyName: clients.companyName,
        companyCode: clients.companyCode,
      })
      .from(clients)
      .where(
        and(
          eq(clients.companyId, companyId),
          eq(clients.isActive, true),
          isNull(clients.deletedAt),
        ),
      )
      .orderBy(clients.companyName),
    db
      .select({
        id: invoices.id,
        clientId: invoices.clientId,
        invoiceNumber: invoices.invoiceNumber,
        financialYear: invoices.financialYear,
        invoiceDate: invoices.invoiceDate,
        outstandingAmount: invoices.outstandingAmount,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          isNull(invoices.deletedAt),
        ),
      )
      .orderBy(desc(invoices.invoiceDate), desc(invoices.id)),
  ]);

  return {
    clients: clientRows,
    invoices: invoiceRows.map((invoice) => ({
      ...invoice,
      outstandingAmount: String(invoice.outstandingAmount ?? "0"),
    })),
  };
}

export async function createCreditNote(_prevState, formData) {
  let auth;
  try {
    auth = await getAuthorizedCompany();
  } catch {
    return { success: false, message: "Unauthorized. Please sign in again." };
  }

  const { user, companyId } = auth;
  const clientId = Number(formData.get("clientId"));
  const invoiceIdRaw = String(formData.get("invoiceId") || "").trim();
  const invoiceId = invoiceIdRaw ? Number(invoiceIdRaw) : null;
  const creditNoteNumber = String(formData.get("creditNoteNumber") || "").trim();
  const creditNoteDate = String(formData.get("creditNoteDate") || "").trim();
  const totalAmount = Number(formData.get("totalAmount"));
  const reason = String(formData.get("reason") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!Number.isInteger(clientId) || clientId <= 0) {
    return { success: false, message: "Please select a valid client." };
  }
  if (!creditNoteNumber || creditNoteNumber.length > 100) {
    return { success: false, message: "Enter a valid credit note number (maximum 100 characters)." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(creditNoteDate) || Number.isNaN(Date.parse(creditNoteDate))) {
    return { success: false, message: "Please enter a valid credit note date." };
  }
  if (!Number.isFinite(totalAmount) || totalAmount <= 0 || Math.round(totalAmount * 100) !== totalAmount * 100) {
    return { success: false, message: "Credit note amount must be greater than zero and have no more than two decimal places." };
  }
  if (!reason) {
    return { success: false, message: "Please enter a reason for the credit note." };
  }

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(
      and(
        eq(clients.id, clientId),
        eq(clients.companyId, companyId),
        eq(clients.isActive, true),
        isNull(clients.deletedAt),
      ),
    )
    .limit(1);

  if (!client) {
    return { success: false, message: "The selected client is not available in your company." };
  }

  let selectedInvoice = null;
  if (invoiceId !== null) {
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      return { success: false, message: "Please select a valid invoice." };
    }
    const [invoice] = await db
      .select({
        id: invoices.id,
        clientId: invoices.clientId,
        companyId: invoices.companyId,
        outstandingAmount: invoices.outstandingAmount,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.clientId, clientId),
          eq(invoices.companyId, companyId),
          isNull(invoices.deletedAt),
        ),
      )
      .limit(1);
    if (!invoice) {
      return { success: false, message: "The selected invoice does not belong to this client or company." };
    }
    selectedInvoice = invoice;
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(creditNotes)
        .values({
          companyId,
          clientId,
          creditNoteNumber,
          creditNoteDate,
          totalAmount: totalAmount.toFixed(2),
          reason,
          notes,
          status: "draft",
          createdBy: user.id,
        })
        .returning({ id: creditNotes.id, creditNoteNumber: creditNotes.creditNoteNumber });

      // A selected invoice is a proposed allocation. Never allocate more than
      // the invoice's current outstanding; any excess remains unapplied.
      if (selectedInvoice) {
        const invoiceOutstanding = Math.max(0, Number(selectedInvoice.outstandingAmount || 0));
        const allocationAmount = Math.min(totalAmount, invoiceOutstanding);
        if (allocationAmount > 0) {
          await tx.insert(creditNoteAllocations).values({
            creditNoteId: created.id,
            invoiceId: selectedInvoice.id,
            allocatedAmount: allocationAmount.toFixed(2),
            createdBy: user.id,
          });
        }
      }
      return created;
    });

    revalidatePath("/credit-notes");
    revalidatePath("/invoices");
    revalidatePath("/clients");
    return {
      success: true,
      message: `Credit note ${result.creditNoteNumber} saved as draft. It does not affect receivables until issued.`,
      creditNoteId: result.id,
    };
  } catch (error) {
    if (error?.code === "23505") {
      return {
        success: false,
        message: `Credit note number "${creditNoteNumber}" already exists for this company. Please use a unique number.`,
      };
    }
    console.error("Create Credit Note Error:", error);
    return { success: false, message: "Failed to create the credit note. Please try again." };
  }
}


export async function getCreditNoteById(id) {
  const { companyId } = await getAuthorizedCompany();
  const creditNoteId = Number(id);
  if (!Number.isInteger(creditNoteId) || creditNoteId <= 0) return null;

  const [note] = await db
    .select({
      id: creditNotes.id,
      companyId: creditNotes.companyId,
      clientId: creditNotes.clientId,
      creditNoteNumber: creditNotes.creditNoteNumber,
      creditNoteDate: creditNotes.creditNoteDate,
      totalAmount: creditNotes.totalAmount,
      reason: creditNotes.reason,
      notes: creditNotes.notes,
      status: creditNotes.status,
      createdAt: creditNotes.createdAt,
      issuedAt: creditNotes.issuedAt,
      voidedAt: creditNotes.voidedAt,
      voidReason: creditNotes.voidReason,
      clientName: clients.companyName,
      clientCode: clients.companyCode,
    })
    .from(creditNotes)
    .innerJoin(clients, eq(creditNotes.clientId, clients.id))
    .where(and(
      eq(creditNotes.id, creditNoteId),
      eq(creditNotes.companyId, companyId),
      isNull(creditNotes.deletedAt),
      isNull(clients.deletedAt),
    ))
    .limit(1);

  if (!note) return null;

  const allocations = await db
    .select({
      id: creditNoteAllocations.id,
      invoiceId: creditNoteAllocations.invoiceId,
      allocatedAmount: creditNoteAllocations.allocatedAmount,
      notes: creditNoteAllocations.notes,
      invoiceNumber: invoices.invoiceNumber,
      invoiceDate: invoices.invoiceDate,
      financialYear: invoices.financialYear,
      invoiceOutstanding: invoices.outstandingAmount,
    })
    .from(creditNoteAllocations)
    .innerJoin(invoices, eq(creditNoteAllocations.invoiceId, invoices.id))
    .where(and(
      eq(creditNoteAllocations.creditNoteId, creditNoteId),
      isNull(creditNoteAllocations.deletedAt),
      eq(invoices.companyId, companyId),
      isNull(invoices.deletedAt),
    ));

  const allocatedAmount = allocations.reduce((total, row) => total + Number(row.allocatedAmount || 0), 0);
  return {
    ...note,
    totalAmount: String(note.totalAmount ?? "0"),
    allocatedAmount: allocatedAmount.toFixed(2),
    unappliedAmount: Math.max(0, Number(note.totalAmount || 0) - allocatedAmount).toFixed(2),
    allocations: allocations.map((row) => ({
      ...row,
      allocatedAmount: String(row.allocatedAmount ?? "0"),
      invoiceOutstanding: String(row.invoiceOutstanding ?? "0"),
    })),
  };
}

export async function issueCreditNote(_prevState, formData) {
  let auth;
  try {
    auth = await getAuthorizedCompany();
  } catch {
    return { success: false, message: "Unauthorized. Please sign in again." };
  }

  const id = Number(formData.get("creditNoteId"));
  if (!Number.isInteger(id) || id <= 0) {
    return { success: false, message: "Invalid credit note." };
  }

  try {
    await db.transaction(async (tx) => {
      const [note] = await tx
        .select({ id: creditNotes.id, status: creditNotes.status, totalAmount: creditNotes.totalAmount })
        .from(creditNotes)
        .where(and(
          eq(creditNotes.id, id),
          eq(creditNotes.companyId, auth.companyId),
          isNull(creditNotes.deletedAt),
        ))
        .limit(1);

      if (!note) throw new Error("NOT_FOUND");
      if (note.status !== "draft") throw new Error("NOT_DRAFT");

      const allocationRows = await tx
        .select({ allocatedAmount: creditNoteAllocations.allocatedAmount })
        .from(creditNoteAllocations)
        .where(and(
          eq(creditNoteAllocations.creditNoteId, id),
          isNull(creditNoteAllocations.deletedAt),
        ));
      const allocated = allocationRows.reduce((total, row) => total + Number(row.allocatedAmount || 0), 0);
      const total = Number(note.totalAmount || 0);
      if (allocated > total + 0.005) throw new Error("OVER_ALLOCATED");

      const status = allocated <= 0 ? "issued" : allocated + 0.005 >= total ? "applied" : "partially_applied";
      await tx.update(creditNotes)
        .set({ status, issuedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(creditNotes.id, id), eq(creditNotes.companyId, auth.companyId)));
    });

    revalidatePath("/credit-notes");
    revalidatePath(`/credit-notes/${id}`);
    revalidatePath("/invoices");
    revalidatePath("/clients");
    return { success: true, message: "Credit note issued successfully. It is now eligible to affect Net Receivable." };
  } catch (error) {
    const messages = {
      NOT_FOUND: "Credit note not found in your company.",
      NOT_DRAFT: "Only draft credit notes can be issued.",
      OVER_ALLOCATED: "The allocation total exceeds the credit note amount.",
    };
    if (messages[error?.message]) return { success: false, message: messages[error.message] };
    console.error("Issue Credit Note Error:", error);
    return { success: false, message: "Failed to issue the credit note. Please try again." };
  }
}

export async function voidCreditNote(_prevState, formData) {
  let auth;
  try {
    auth = await getAuthorizedCompany();
  } catch {
    return { success: false, message: "Unauthorized. Please sign in again." };
  }

  const id = Number(formData.get("creditNoteId"));
  const voidReason = String(formData.get("voidReason") || "").trim();
  if (!Number.isInteger(id) || id <= 0) return { success: false, message: "Invalid credit note." };
  if (!voidReason || voidReason.length > 1000) {
    return { success: false, message: "Enter a void reason (maximum 1,000 characters)." };
  }

  try {
    const [note] = await db
      .select({ id: creditNotes.id, status: creditNotes.status })
      .from(creditNotes)
      .where(and(
        eq(creditNotes.id, id),
        eq(creditNotes.companyId, auth.companyId),
        isNull(creditNotes.deletedAt),
      ))
      .limit(1);

    if (!note) return { success: false, message: "Credit note not found in your company." };
    if (note.status === "void") return { success: false, message: "This credit note is already void." };

    await db.update(creditNotes)
      .set({ status: "void", voidedAt: new Date(), voidReason, updatedAt: new Date() })
      .where(and(
        eq(creditNotes.id, id),
        eq(creditNotes.companyId, auth.companyId),
        isNull(creditNotes.deletedAt),
      ));

    revalidatePath("/credit-notes");
    revalidatePath(`/credit-notes/${id}`);
    revalidatePath("/invoices");
    revalidatePath("/clients");
    return { success: true, message: "Credit note voided. It will no longer be included in receivable calculations." };
  } catch (error) {
    console.error("Void Credit Note Error:", error);
    return { success: false, message: "Failed to void the credit note. Please try again." };
  }
}


/**
 * Returns invoices eligible for allocation to this credit note.
 * Capacity is reduced by allocations from other issued, non-void credit notes.
 * The current credit note is excluded so its existing allocation can be edited.
 */
export async function getCreditNoteAllocationData(id) {
  const { companyId } = await getAuthorizedCompany();
  const creditNoteId = Number(id);
  if (!Number.isInteger(creditNoteId) || creditNoteId <= 0) return null;

  const [note] = await db
    .select({
      id: creditNotes.id,
      companyId: creditNotes.companyId,
      clientId: creditNotes.clientId,
      totalAmount: creditNotes.totalAmount,
      status: creditNotes.status,
    })
    .from(creditNotes)
    .where(and(
      eq(creditNotes.id, creditNoteId),
      eq(creditNotes.companyId, companyId),
      isNull(creditNotes.deletedAt),
    ))
    .limit(1);

  if (!note || note.status === "void") return null;

  const [invoiceRows, otherAllocationRows] = await Promise.all([
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        financialYear: invoices.financialYear,
        invoiceDate: invoices.invoiceDate,
        outstandingAmount: invoices.outstandingAmount,
      })
      .from(invoices)
      .where(and(
        eq(invoices.companyId, companyId),
        eq(invoices.clientId, note.clientId),
        isNull(invoices.deletedAt),
      ))
      .orderBy(desc(invoices.invoiceDate), desc(invoices.id)),
    db
      .select({
        invoiceId: creditNoteAllocations.invoiceId,
        allocatedAmount: creditNoteAllocations.allocatedAmount,
      })
      .from(creditNoteAllocations)
      .innerJoin(creditNotes, eq(creditNoteAllocations.creditNoteId, creditNotes.id))
      .where(and(
        eq(creditNotes.companyId, companyId),
        ne(creditNotes.id, creditNoteId),
        ne(creditNotes.status, "draft"),
        ne(creditNotes.status, "void"),
        isNull(creditNotes.deletedAt),
        isNull(creditNoteAllocations.deletedAt),
      )),
  ]);

  const allocatedByInvoice = new Map();
  for (const row of otherAllocationRows) {
    allocatedByInvoice.set(
      row.invoiceId,
      (allocatedByInvoice.get(row.invoiceId) || 0) + Number(row.allocatedAmount || 0),
    );
  }

  return {
    note: {
      id: note.id,
      totalAmount: String(note.totalAmount ?? "0"),
      status: note.status,
    },
    invoices: invoiceRows.map((invoice) => {
      const outstanding = Math.max(0, Number(invoice.outstandingAmount || 0));
      const allocatedByOthers = allocatedByInvoice.get(invoice.id) || 0;
      return {
        ...invoice,
        outstandingAmount: outstanding.toFixed(2),
        availableForCredit: Math.max(0, outstanding - allocatedByOthers).toFixed(2),
      };
    }),
  };
}

async function refreshCreditNoteStatus(tx, creditNoteId, companyId) {
  const [note] = await tx
    .select({
      id: creditNotes.id,
      totalAmount: creditNotes.totalAmount,
      status: creditNotes.status,
    })
    .from(creditNotes)
    .where(and(
      eq(creditNotes.id, creditNoteId),
      eq(creditNotes.companyId, companyId),
      isNull(creditNotes.deletedAt),
    ))
    .limit(1);

  if (!note || note.status === "draft" || note.status === "void") return;

  const rows = await tx
    .select({ allocatedAmount: creditNoteAllocations.allocatedAmount })
    .from(creditNoteAllocations)
    .where(and(
      eq(creditNoteAllocations.creditNoteId, creditNoteId),
      isNull(creditNoteAllocations.deletedAt),
    ));

  const allocated = rows.reduce((sum, row) => sum + Number(row.allocatedAmount || 0), 0);
  const total = Number(note.totalAmount || 0);
  const status = allocated <= 0
    ? "issued"
    : allocated + 0.005 >= total
      ? "applied"
      : "partially_applied";

  await tx.update(creditNotes)
    .set({ status, updatedAt: new Date() })
    .where(and(
      eq(creditNotes.id, creditNoteId),
      eq(creditNotes.companyId, companyId),
    ));
}

/**
 * Add or update one invoice allocation. Amount is explicit: the action rejects
 * amounts beyond the note's remaining amount or invoice's available capacity.
 */
export async function saveCreditNoteAllocation(_prevState, formData) {
  let auth;
  try {
    auth = await getAuthorizedCompany();
  } catch {
    return { success: false, message: "Unauthorized. Please sign in again." };
  }

  const creditNoteId = Number(formData.get("creditNoteId"));
  const invoiceId = Number(formData.get("invoiceId"));
  const allocatedAmount = Number(formData.get("allocatedAmount"));
  const allocationNotes = String(formData.get("allocationNotes") || "").trim() || null;

  if (!Number.isInteger(creditNoteId) || creditNoteId <= 0 ||
      !Number.isInteger(invoiceId) || invoiceId <= 0) {
    return { success: false, message: "Select a valid credit note and invoice." };
  }
  if (!Number.isFinite(allocatedAmount) || allocatedAmount <= 0 ||
      Math.round(allocatedAmount * 100) !== allocatedAmount * 100) {
    return { success: false, message: "Allocation must be greater than zero and have no more than two decimal places." };
  }

  try {
    await db.transaction(async (tx) => {
      const [note] = await tx
        .select({
          id: creditNotes.id,
          clientId: creditNotes.clientId,
          totalAmount: creditNotes.totalAmount,
          status: creditNotes.status,
        })
        .from(creditNotes)
        .where(and(
          eq(creditNotes.id, creditNoteId),
          eq(creditNotes.companyId, auth.companyId),
          isNull(creditNotes.deletedAt),
        ))
        .limit(1);

      if (!note) throw new Error("NOTE_NOT_FOUND");
      if (note.status === "void") throw new Error("NOTE_VOID");

      const [invoice] = await tx
        .select({
          id: invoices.id,
          clientId: invoices.clientId,
          companyId: invoices.companyId,
          outstandingAmount: invoices.outstandingAmount,
        })
        .from(invoices)
        .where(and(
          eq(invoices.id, invoiceId),
          eq(invoices.clientId, note.clientId),
          eq(invoices.companyId, auth.companyId),
          isNull(invoices.deletedAt),
        ))
        .limit(1);

      if (!invoice) throw new Error("INVOICE_INVALID");

      const allNoteAllocations = await tx
        .select({
          invoiceId: creditNoteAllocations.invoiceId,
          allocatedAmount: creditNoteAllocations.allocatedAmount,
        })
        .from(creditNoteAllocations)
        .where(and(
          eq(creditNoteAllocations.creditNoteId, creditNoteId),
          isNull(creditNoteAllocations.deletedAt),
        ));

      const otherNoteAllocated = allNoteAllocations
        .filter((row) => row.invoiceId !== invoiceId)
        .reduce((sum, row) => sum + Number(row.allocatedAmount || 0), 0);

      const existingRows = await tx
        .select({
          id: creditNoteAllocations.id,
          allocatedAmount: creditNoteAllocations.allocatedAmount,
          deletedAt: creditNoteAllocations.deletedAt,
        })
        .from(creditNoteAllocations)
        .where(and(
          eq(creditNoteAllocations.creditNoteId, creditNoteId),
          eq(creditNoteAllocations.invoiceId, invoiceId),
        ))
        .limit(1);
      const existing = existingRows[0];

      const noteRemaining = Math.max(0, Number(note.totalAmount || 0) - otherNoteAllocated);
      if (allocatedAmount > noteRemaining + 0.005) throw new Error("NOTE_CAPACITY");

      const [otherInvoiceAllocationRows] = await tx
        .select({ total: sql`coalesce(sum(${creditNoteAllocations.allocatedAmount}), 0)` })
        .from(creditNoteAllocations)
        .innerJoin(creditNotes, eq(creditNoteAllocations.creditNoteId, creditNotes.id))
        .where(and(
          eq(creditNoteAllocations.invoiceId, invoiceId),
          ne(creditNotes.id, creditNoteId),
          eq(creditNotes.companyId, auth.companyId),
          ne(creditNotes.status, "draft"),
          ne(creditNotes.status, "void"),
          isNull(creditNotes.deletedAt),
          isNull(creditNoteAllocations.deletedAt),
        ));

      const invoiceCapacity = Math.max(
        0,
        Number(invoice.outstandingAmount || 0) - Number(otherInvoiceAllocationRows?.total || 0),
      );
      if (allocatedAmount > invoiceCapacity + 0.005) throw new Error("INVOICE_CAPACITY");

      const values = {
        allocatedAmount: allocatedAmount.toFixed(2),
        notes: allocationNotes,
        createdBy: auth.user.id,
        updatedAt: new Date(),
        deletedAt: null,
      };

      if (existing) {
        await tx.update(creditNoteAllocations)
          .set(values)
          .where(eq(creditNoteAllocations.id, existing.id));
      } else {
        await tx.insert(creditNoteAllocations).values({
          creditNoteId,
          invoiceId,
          ...values,
        });
      }

      await refreshCreditNoteStatus(tx, creditNoteId, auth.companyId);
    });

    revalidatePath(`/credit-notes/${creditNoteId}`);
    revalidatePath("/credit-notes");
    revalidatePath("/invoices");
    revalidatePath("/clients");
    return { success: true, message: "Credit note allocation saved." };
  } catch (error) {
    const messages = {
      NOTE_NOT_FOUND: "Credit note not found in your company.",
      NOTE_VOID: "A void credit note cannot be allocated.",
      INVOICE_INVALID: "Choose an invoice belonging to the same client and company.",
      NOTE_CAPACITY: "This amount exceeds the credit note's remaining unapplied amount.",
      INVOICE_CAPACITY: "This amount exceeds the invoice's available outstanding after other issued credit allocations.",
    };
    if (messages[error?.message]) return { success: false, message: messages[error.message] };
    console.error("Save Credit Note Allocation Error:", error);
    return { success: false, message: "Failed to save the allocation. Please try again." };
  }
}

export async function removeCreditNoteAllocation(_prevState, formData) {
  let auth;
  try {
    auth = await getAuthorizedCompany();
  } catch {
    return { success: false, message: "Unauthorized. Please sign in again." };
  }

  const creditNoteId = Number(formData.get("creditNoteId"));
  const invoiceId = Number(formData.get("invoiceId"));
  if (!Number.isInteger(creditNoteId) || creditNoteId <= 0 ||
      !Number.isInteger(invoiceId) || invoiceId <= 0) {
    return { success: false, message: "Invalid allocation." };
  }

  try {
    await db.transaction(async (tx) => {
      const [note] = await tx
        .select({ id: creditNotes.id, status: creditNotes.status })
        .from(creditNotes)
        .where(and(
          eq(creditNotes.id, creditNoteId),
          eq(creditNotes.companyId, auth.companyId),
          isNull(creditNotes.deletedAt),
        ))
        .limit(1);
      if (!note) throw new Error("NOTE_NOT_FOUND");
      if (note.status === "void") throw new Error("NOTE_VOID");

      const [allocation] = await tx
        .select({ id: creditNoteAllocations.id })
        .from(creditNoteAllocations)
        .where(and(
          eq(creditNoteAllocations.creditNoteId, creditNoteId),
          eq(creditNoteAllocations.invoiceId, invoiceId),
          isNull(creditNoteAllocations.deletedAt),
        ))
        .limit(1);
      if (!allocation) throw new Error("ALLOCATION_NOT_FOUND");

      await tx.update(creditNoteAllocations)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(creditNoteAllocations.id, allocation.id));

      await refreshCreditNoteStatus(tx, creditNoteId, auth.companyId);
    });

    revalidatePath(`/credit-notes/${creditNoteId}`);
    revalidatePath("/credit-notes");
    revalidatePath("/invoices");
    revalidatePath("/clients");
    return { success: true, message: "Invoice allocation removed. The credit remains on the client account as unapplied credit." };
  } catch (error) {
    const messages = {
      NOTE_NOT_FOUND: "Credit note not found in your company.",
      NOTE_VOID: "A void credit note cannot be changed.",
      ALLOCATION_NOT_FOUND: "This invoice allocation no longer exists.",
    };
    if (messages[error?.message]) return { success: false, message: messages[error.message] };
    console.error("Remove Credit Note Allocation Error:", error);
    return { success: false, message: "Failed to remove the allocation. Please try again." };
  }
}
