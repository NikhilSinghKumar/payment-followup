"use server";

import { db } from "@/db";
import {
  invoices,
  clients,
  clientSubClients,
  payments,
  paymentAllocations,
  followups,
  invoiceAwbs,
} from "@/db/schema";
import { calculateInvoice } from "@/lib/invoice-calculator";
import { getClientTaxSettings } from "@/lib/client-tax-settings";
import { getFinancialYear } from "@/lib/financial-year";
import { enrichInvoices } from "@/lib/invoice-summary";
import { calculateInvoiceStatus } from "@/lib/invoice-status";
import { eq, sql, ilike, isNull, or, and, ne, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/auth";
import { processInvoiceEvents } from "@/lib/notifications/event-services";
import { updateInvoiceFinancials } from "@/lib/invoice/updateInvoiceFinancials";

export async function createInvoice(formData) {
  // =====================================
  // FORM VALUES
  // =====================================

  const companyCode = formData.get("companyCode")?.trim();

  const subClientIdValue = formData.get("subClientId");

  const subClientId =
    subClientIdValue && subClientIdValue !== ""
      ? Number(subClientIdValue)
      : null;

  const invoiceNumber = formData.get("invoiceNumber")?.trim();
  const notes = formData.get("notes")?.trim();

  const invoiceAmount = parseFloat(formData.get("invoiceAmount"));

  const deductionAmount = parseFloat(formData.get("deductionAmount") || 0);

  const otherCharges = parseFloat(formData.get("otherCharges") || 0);

  const invoiceDate = formData.get("invoiceDate")
    ? new Date(formData.get("invoiceDate"))
    : null;

  const financialYear = invoiceDate ? getFinancialYear(invoiceDate) : null;

  const dueDate = formData.get("dueDate")
    ? new Date(formData.get("dueDate"))
    : null;

  // =====================================
  // CURRENT USER
  // =====================================

  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    throw new Error("Unauthorized");
  }

  if (!currentUser.companyId) {
    throw new Error("User is not associated with a company.");
  }

  const companyId = currentUser.companyId;

  // =====================================
  // BASIC VALIDATION
  // =====================================

  if (
    !companyCode ||
    !invoiceNumber ||
    !financialYear ||
    !invoiceDate ||
    isNaN(invoiceDate.getTime()) ||
    !dueDate ||
    isNaN(dueDate.getTime()) ||
    isNaN(invoiceAmount)
  ) {
    return {
      error: "Invalid input",
    };
  }

  if (
    subClientId !== null &&
    (!Number.isInteger(subClientId) || subClientId <= 0)
  ) {
    return {
      error: "Invalid sub client",
    };
  }

  // =====================================
  // FIND CLIENT
  // =====================================

  const client = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.companyCode, companyCode),
        eq(clients.companyId, companyId),
      ),
    )
    .limit(1);

  if (!client.length) {
    return {
      error: "Client not found",
    };
  }

  const clientId = client[0].id;

  // =====================================
  // SUB CLIENT VALIDATION
  // =====================================

  let selectedSubClient = null;

  if (subClientId !== null) {
    const subClient = await db
      .select()
      .from(clientSubClients)
      .where(
        and(
          eq(clientSubClients.id, subClientId),

          // Very important:
          // selected sub client must belong
          // to the selected parent client.
          eq(clientSubClients.clientId, clientId),

          // Don't allow deleted sub clients.
          isNull(clientSubClients.deletedAt),

          // Only active sub clients.
          eq(clientSubClients.isActive, true),
        ),
      )
      .limit(1);

    if (!subClient.length) {
      return {
        error:
          "Selected sub client does not belong to this client or is inactive.",
      };
    }

    selectedSubClient = subClient[0];
  }

  // =====================================
  // TAX SETTINGS
  // =====================================

  let taxSettings;

  if (selectedSubClient) {
    // Invoice belongs to a sub client.
    // Use the sub client's tax settings.

    taxSettings = {
      gstNumber: selectedSubClient.gstNumber,
      tdsApplicable: selectedSubClient.tdsApplicable,
    };
  } else {
    // Invoice belongs directly to parent client.
    // Use existing parent client tax settings.

    taxSettings = await getClientTaxSettings(clientId);
  }

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
  // INVOICE STATUS
  // =====================================

  const invoiceStatus = calculateInvoiceStatus({
    netPayable: calculatedInvoice.netPayableAmount,
    paid: 0,
    dueDate,
  });

  // =====================================
  // DUPLICATE CHECK
  // =====================================

  // Invoice number remains unique for:
  //
  // Client + Financial Year + Invoice Number
  //
  // subClientId is intentionally NOT included.

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
      error:
        "Invoice number already exists for this client and financial year.",
    };
  }

  // =====================================
  // INSERT INVOICE
  // =====================================

  const [invoice] = await db
    .insert(invoices)
    .values({
      companyId,

      // Parent client is always required.
      clientId,

      // Optional.
      subClientId: selectedSubClient ? selectedSubClient.id : null,

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

      // Snapshot of whichever entity was used:
      // parent client or sub client.
      gstNumberUsed: calculatedInvoice.gstNumberUsed,

      tdsApplicableUsed: calculatedInvoice.tdsApplicableUsed,

      paidAmount: "0",

      outstandingAmount: calculatedInvoice.netPayableAmount,

      status: invoiceStatus?.status || "pending",

      notes,
    })
    .returning({
      id: invoices.id,
    });

  // =====================================
  // PROCESS NOTIFICATIONS
  // =====================================

  await processInvoiceEvents(invoice.id);

  return {
    success: true,
  };
}

export async function getInvoices(
  search,
  status,
  sort = "high",
  aging = "",
  financialYear = "",
  month = "",
  minAmount = "",
  maxAmount = "",
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
      clientId: invoices.clientId,
      invoiceNumber: invoices.invoiceNumber,
      invoiceAmount: invoices.invoiceAmount,

      netPayableAmount: invoices.netPayableAmount,
      invoiceDate: invoices.invoiceDate,
      dueDate: invoices.dueDate,
      financialYear: invoices.financialYear,
      companyName: clients.companyName,
      companyCode: clients.companyCode,
      gstNumber: clients.gstNumber,

      paidAmount: invoices.paidAmount,
      outstandingAmount: invoices.outstandingAmount,
      status: invoices.status,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(and(...conditions));

  const data = await query.orderBy(invoices.id);

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
      if (minAmount && Number(inv.outstandingAmount) < Number(minAmount)) {
        return false;
      }

      if (maxAmount && Number(inv.outstandingAmount) > Number(maxAmount)) {
        return false;
      }

      return true;
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
        return Number(a.outstandingAmount) - Number(b.outstandingAmount);
      }

      return Number(b.outstandingAmount) - Number(a.outstandingAmount);
    });
}

// Get Invoice by ID
export async function getInvoiceById(id) {
  const data = await db
    .select({
      clientId: invoices.clientId,
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
    .where(and(eq(invoices.id, id), isNull(invoices.deletedAt)))
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

  if (!clientId || !invoiceNumber || !invoiceDate || isNaN(invoiceAmount)) {
    return {
      error: "Please fill all required fields.",
    };
  }

  const existingInvoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), isNull(invoices.deletedAt)),
  });

  if (existingInvoice.clientId !== clientId) {
    return {
      error: "Client cannot be changed.",
    };
  }

  if (!existingInvoice) {
    return {
      error: "Invoice not found.",
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

  const duplicateInvoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.invoiceNumber, invoiceNumber), ne(invoices.id, id)),
  });

  if (duplicateInvoice) {
    return {
      error: "Invoice number already exists.",
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

  const allocationResult = await db
    .select({
      total: sql`
      COALESCE(
        SUM(${paymentAllocations.allocatedAmount}),
        0
      )
    `,
    })
    .from(paymentAllocations)
    .where(eq(paymentAllocations.invoiceId, id));

  const paid = Number(allocationResult[0]?.total || 0);

  if (paid > calculatedInvoice.netPayableAmount) {
    return {
      error: "Invoice amount cannot be less than the amount already received.",
    };
  }

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
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id));

  await updateInvoiceFinancials(id);

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath(`/clients/${client.id}`);

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

export async function getMaxOutstandingAmount() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.user || !currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const [result] = await db
    .select({
      maxOutstanding: sql`
        COALESCE(MAX(${invoices.outstandingAmount}), 0)
      `,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, currentUser.companyId),
        isNull(invoices.deletedAt),
      ),
    );

  return Number(result?.maxOutstanding || 0);
}
