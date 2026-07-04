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
import { calculateInvoice } from "@/lib/invoice-calculator";
import { getClientTaxSettings } from "@/lib/client-tax-settings";
import { getFinancialYear } from "@/lib/financial-year";
import { enrichInvoices } from "@/lib/invoice-summary";
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
  alphabet = "",
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

  if (alphabet) {
    conditions.push(ilike(clients.companyName, `${alphabet}%`));
  }

  const query = db
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
      gstNumber: clients.gstNumber,

      paid: sql`
        COALESCE(SUM(${payments.amount}), 0)
      `,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .where(and(...conditions));

  const data = await query
    .groupBy(
      invoices.id,
      invoices.invoiceDate,
      clients.companyName,
      clients.companyCode,
      clients.gstNumber,
      invoices.financialYear,
    )
    .orderBy(invoices.id);

  const invoiceList = enrichInvoices(data);

  // COMPUTE STATUS
  return invoiceList
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

      return new Date(inv.invoiceDate).getMonth() + 1 === Number(month);
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
  const notes = formData.get("notes")?.trim();
  const invoiceAmount = parseFloat(formData.get("invoiceAmount"));

  const deductionAmount = parseFloat(formData.get("deductionAmount") || 0);

  const otherCharges = parseFloat(formData.get("otherCharges") || 0);

  const invoiceDate = formData.get("invoiceDate")
    ? new Date(formData.get("invoiceDate"))
    : null;

  const financialYear = getFinancialYear(invoiceDate);

  const dueDate = formData.get("dueDate")
    ? new Date(formData.get("dueDate"))
    : null;

  // =====================================
  // VALIDATION
  // =====================================

  if (
    !companyCode ||
    !invoiceNumber ||
    !financialYear ||
    !invoiceDate ||
    isNaN(invoiceAmount)
  ) {
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
  const taxSettings = await getClientTaxSettings(clientId);

  const calculatedInvoice = calculateInvoice({
    invoiceAmount,
    gstNumber: taxSettings.gstNumber,
    tdsApplicable: taxSettings.tdsApplicable,
    deductionAmount,
    otherCharges,
  });

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
    invoiceDate,
    dueDate,

    invoiceAmount: calculatedInvoice.invoiceAmount,

    basicAmount: calculatedInvoice.basicAmount,

    cgstAmount: calculatedInvoice.cgstAmount,
    sgstAmount: calculatedInvoice.sgstAmount,
    igstAmount: calculatedInvoice.igstAmount,

    tdsAmount: calculatedInvoice.tdsAmount,

    deductionAmount: calculatedInvoice.deductionAmount,
    otherCharges: calculatedInvoice.otherCharges,

    netPayableAmount: calculatedInvoice.netPayableAmount,

    gstNumberUsed: calculatedInvoice.gstNumberUsed,
    tdsApplicableUsed: calculatedInvoice.tdsApplicableUsed,

    status: "pending",

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

      invoiceNumber: invoices.invoiceNumber,

      invoiceDate: invoices.invoiceDate,

      dueDate: invoices.dueDate,

      invoiceAmount: invoices.invoiceAmount,

      deductionAmount: invoices.deductionAmount,

      otherCharges: invoices.otherCharges,

      notes: invoices.notes,

      companyCode: clients.companyCode,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.id, id))
    .limit(1);

  return data[0];
}

// Update/Edit
export async function updateInvoice(id, formData) {
  // =====================================
  // FORM DATA
  // =====================================

  const clientId = Number(formData.get("clientId"));
  const invoiceNumber = formData.get("invoiceNumber");

  const invoiceAmount = parseFloat(formData.get("invoiceAmount"));

  const deductionAmount = parseFloat(formData.get("deductionAmount") || 0);

  const otherCharges = parseFloat(formData.get("otherCharges") || 0);

  const notes = formData.get("notes");

  const invoiceDate = formData.get("invoiceDate")
    ? new Date(formData.get("invoiceDate"))
    : null;

  const dueDate = formData.get("dueDate")
    ? new Date(formData.get("dueDate"))
    : null;

  // =====================================
  // VALIDATION
  // =====================================

  if (!companyCode || !invoiceNumber || !invoiceDate || isNaN(invoiceAmount)) {
    return {
      error: "Please fill all required fields.",
    };
  }

  // =====================================
  // FIND CLIENT
  // =====================================

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client) {
    return {
      error: "Client not found.",
    };
  }

  // =====================================
  // FINANCIAL YEAR
  // =====================================

  const financialYear = getFinancialYear(invoiceDate);

  // =====================================
  // GST & TDS
  // =====================================

  const taxSettings = await getClientTaxSettings(client.id);

  // =====================================
  // CALCULATE INVOICE
  // =====================================

  const calculatedInvoice = calculateInvoice({
    invoiceAmount,
    gstNumber: taxSettings.gstNumber,
    tdsApplicable: taxSettings.tdsApplicable,
    deductionAmount,
    otherCharges,
  });

  // =====================================
  // UPDATE
  // =====================================

  await db
    .update(invoices)
    .set({
      clientId: client.id,

      financialYear,

      invoiceNumber,

      invoiceDate,

      dueDate,

      invoiceAmount: calculatedInvoice.invoiceAmount,

      basicAmount: calculatedInvoice.basicAmount,

      cgstAmount: calculatedInvoice.cgstAmount,

      sgstAmount: calculatedInvoice.sgstAmount,

      igstAmount: calculatedInvoice.igstAmount,

      tdsAmount: calculatedInvoice.tdsAmount,

      deductionAmount: calculatedInvoice.deductionAmount,

      otherCharges: calculatedInvoice.otherCharges,

      netPayableAmount: calculatedInvoice.netPayableAmount,

      gstNumberUsed: calculatedInvoice.gstNumberUsed,

      tdsApplicableUsed: calculatedInvoice.tdsApplicableUsed,

      notes,
    })
    .where(eq(invoices.id, id));

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);

  return {
    success: true,
  };
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
