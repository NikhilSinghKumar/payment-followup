"use server";

import { db } from "@/db";
import { invoices, clients, payments, followups } from "@/db/schema";
import { eq, sql, ilike, or, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getInvoices(search, status) {
  let query = db
    .select({
      id: invoices.id,
      amount: invoices.amount,
      dueDate: invoices.dueDate,
      companyName: clients.companyName,
      companyCode: clients.companyCode,
      paid: sql`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id));

  // SEARCH
  if (search) {
    query = query.where(
      or(
        ilike(clients.companyName, `%${search}%`),
        ilike(clients.companyCode, `%${search}%`),
      ),
    );
  }

  const data = await query
    .groupBy(invoices.id, clients.companyName, clients.companyCode)
    .orderBy(invoices.id);

  // 🔥 compute + filter
  return data
    .map((inv) => {
      const amount = Number(inv.amount);
      const paid = Number(inv.paid);
      const due = amount - paid;

      let statusValue = "pending";
      if (paid === 0) statusValue = "pending";
      else if (paid < amount) statusValue = "partial";
      else statusValue = "paid";

      return {
        ...inv,
        paid,
        due,
        status: statusValue,
      };
    })
    .filter((inv) => {
      if (!status) return true;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (status === "overdue") {
        if (!inv.dueDate) return false;
        const due = new Date(inv.dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today && inv.status !== "paid";
      }

      return inv.status === status;
    });
}

export async function createInvoice(formData) {
  // =====================================
  // FORM VALUES
  // =====================================

  const companyCode = formData.get("companyCode")?.trim();
  const invoiceNumber = formData.get("invoiceNumber")?.trim();
  const financialYear = formData.get("financialYear")?.trim();
  const notes = formData.get("notes")?.trim();
  const amount = parseFloat(formData.get("amount"));
  const invoiceFromDate = formData.get("invoiceFromDate")
    ? new Date(formData.get("invoiceFromDate"))
    : null;
  const invoiceToDate = formData.get("invoiceToDate")
    ? new Date(formData.get("invoiceToDate"))
    : null;
  const dueDate = formData.get("dueDate")
    ? new Date(formData.get("dueDate"))
    : null;

  // =====================================
  // VALIDATION
  // =====================================

  if (!companyCode || !invoiceNumber || !financialYear || isNaN(amount)) {
    return {
      error: "Invalid input",
    };
  }

  // =====================================
  // FIND CLIENT
  // =====================================

  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.companyCode, companyCode))
    .limit(1);

  if (!client.length) {
    return {
      error: "Client not found",
    };
  }

  const clientId = client[0].id;

  // =====================================
  // DUPLICATE CHECK
  // =====================================

  const existing = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.clientId, clientId),
        eq(invoices.financialYear, financialYear),
        eq(invoices.invoiceNumber, invoiceNumber),
      ),
    )
    .limit(1);

  if (existing.length) {
    return {
      error: "Invoice number already exists",
    };
  }

  // =====================================
  // INSERT
  // =====================================

  await db.insert(invoices).values({
    clientId,
    financialYear,
    invoiceNumber,
    amount,
    status: "pending",
    invoiceFromDate,
    invoiceToDate,
    dueDate,
    notes,
  });

  return {
    success: true,
  };
}

// Get Invoice by ID
export async function getInvoiceById(id) {
  const data = await db
    .select({
      id: invoices.id,
      amount: invoices.amount,
      dueDate: invoices.dueDate,
      invoiceNumber: invoices.invoiceNumber,
      invoiceFromDate: invoices.invoiceFromDate,
      invoiceToDate: invoices.invoiceToDate,
      companyCode: clients.companyCode,
      notes: invoices.notes,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.id, id))
    .limit(1);

  return data[0];
}

// Update/Edit
export async function updateInvoice(id, formData) {
  const amount = parseFloat(formData.get("amount"));
  const notes = formData.get("notes");

  const invoiceFromDate = formData.get("invoiceFromDate")
    ? new Date(formData.get("invoiceFromDate"))
    : null;

  const invoiceToDate = formData.get("invoiceToDate")
    ? new Date(formData.get("invoiceToDate"))
    : null;

  const dueDate = formData.get("dueDate")
    ? new Date(formData.get("dueDate"))
    : null;

  await db
    .update(invoices)
    .set({
      amount,
      invoiceFromDate,
      invoiceToDate,
      dueDate,
      notes,
    })
    .where(eq(invoices.id, id));

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);

  return { success: true };
}

// DELETE INVOICE
export async function deleteInvoice(id) {
  if (!id) {
    return { error: "Invalid invoice id" };
  }

  try {
    // delete child records first
    await db.delete(payments).where(eq(payments.invoiceId, id));

    await db.delete(followups).where(eq(followups.invoiceId, id));

    // delete invoice
    await db.delete(invoices).where(eq(invoices.id, id));

    // refresh invoice list
    revalidatePath("/invoices");

    return { success: true };
  } catch (err) {
    console.error(err);

    return { error: "Failed to delete invoice" };
  }
}
