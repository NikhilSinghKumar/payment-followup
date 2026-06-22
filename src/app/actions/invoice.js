"use server";

import { db } from "@/db";
import {
  invoices,
  clients,
  payments,
  paymentAllocations,
  followups,
  invoiceAwbs,
} from "@/db/schema";
import { eq, sql, ilike, isNull, or, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getInvoices(
  search,
  status,
  sort = "high",
  aging = "",
  financialYear = "",
  month = "",
  amountRange,
) {
  const conditions = [isNull(invoices.deletedAt)];
  if (financialYear) {
    conditions.push(eq(invoices.financialYear, financialYear));
  }

  // SEARCH
  if (search) {
    conditions.push(
      or(
        ilike(clients.companyName, `%${search}%`),
        ilike(clients.companyCode, `%${search}%`),
        ilike(invoices.invoiceNumber, `%${search}%`),
      ),
    );
  }

  const query = db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      amount: invoices.amount,
      dueDate: invoices.dueDate,
      companyName: clients.companyName,
      companyCode: clients.companyCode,

      paid: sql`
        COALESCE(SUM(${payments.amount}), 0)
      `,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .where(and(...conditions));

  const data = await query
    .groupBy(invoices.id, clients.companyName, clients.companyCode)
    .orderBy(invoices.id);

  // COMPUTE STATUS
  return data
    .map((inv) => {
      const amount = Number(inv.amount);
      const paid = Number(inv.paid);
      const due = amount - paid;

      let statusValue = "pending";

      if (paid === 0) statusValue = "pending";
      else if (paid < amount) statusValue = "partial";
      else statusValue = "paid";

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let dueDays = 0;
      let dueDaysText = "";

      if (inv.dueDate) {
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        dueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

        if (dueDays > 0) {
          dueDaysText = `${dueDays} days overdue`;
        } else if (dueDays < 0) {
          dueDaysText = `Due in ${Math.abs(dueDays)} days`;
        } else {
          dueDaysText = "Due today";
        }
      }

      return {
        ...inv,
        paid,
        due,
        status: statusValue,
        dueDays,
        dueDaysText,
      };
    })
    .filter((inv) => {
      if (!aging) return true;

      if (inv.dueDays <= 0) return false;

      switch (aging) {
        case "0-30":
          return inv.dueDays <= 30;

        case "31-60":
          return inv.dueDays >= 31 && inv.dueDays <= 60;

        case "61-90":
          return inv.dueDays >= 61 && inv.dueDays <= 90;

        case "91-180":
          return inv.dueDays >= 91 && inv.dueDays <= 180;

        case "180+":
          return inv.dueDays > 180;

        default:
          return true;
      }
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
    })
    .filter((inv) => {
      if (!amountRange) return true;

      switch (amountRange) {
        case "0-10K":
          return inv.due >= 0 && inv.due <= 10000;

        case "10K-50K":
          return inv.due > 10000 && inv.due <= 50000;

        case "50K-1L":
          return inv.due > 50000 && inv.due <= 100000;

        case "1L-5L":
          return inv.due > 100000 && inv.due <= 500000;

        case "5L+":
          return inv.due > 500000;

        default:
          return true;
      }
    })
    .filter((inv) => {
      if (!month) return true;

      if (!inv.dueDate) return false;

      return new Date(inv.dueDate).getMonth() + 1 === Number(month);
    })
    .sort((a, b) => {
      // If aging filter is selected, sort by overdue days (highest → lowest)
      if (aging) {
        return b.dueDays - a.dueDays;
      }

      // Otherwise sort by due amount
      if (sort === "low") {
        return a.due - b.due;
      }

      return b.due - a.due;
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
  try {
    const deletedAt = new Date();

    // =====================================
    // PAYMENT ALLOCATIONS
    // =====================================

    await db
      .update(paymentAllocations)
      .set({ deletedAt })
      .where(eq(paymentAllocations.invoiceId, id));

    // =====================================
    // PAYMENTS
    // =====================================

    await db
      .update(payments)
      .set({ deletedAt })
      .where(eq(payments.invoiceId, id));

    // =====================================
    // FOLLOWUPS
    // =====================================

    await db
      .update(followups)
      .set({ deletedAt })
      .where(eq(followups.invoiceId, id));

    // =====================================
    // AWBS
    // =====================================

    await db
      .update(invoiceAwbs)
      .set({ deletedAt })
      .where(eq(invoiceAwbs.invoiceId, id));

    // =====================================
    // INVOICE
    // =====================================

    await db
      .update(invoices)
      .set({
        deletedAt,
      })
      .where(eq(invoices.id, id));

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Failed to delete invoice",
    };
  }
}

export async function getFinancialYears() {
  const years = await db
    .selectDistinct({ financialYear: invoices.financialYear })
    .from(invoices)
    .where(isNull(invoices.deletedAt));

  return years
    .map((row) => row.financialYear)
    .filter(Boolean)
    .sort()
    .reverse();
}
