"use server";

import { db } from "@/db";

import {
  clients,
  invoices,
  clientSubClients,
  payments,
  paymentAllocations,
} from "@/db/schema";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/auth";
import { enrichInvoices } from "@/lib/invoice-summary";
import { calculateClientSummary } from "@/lib/client-summary";
import { updateInvoiceFinancials } from "@/lib/invoice/updateInvoiceFinancials";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * ======================================================
 * GET CLIENT INVOICES FOR PAYMENT
 * ======================================================
 *
 * Returns only invoices that still have an outstanding
 * amount and can therefore receive payment allocation.
 * ======================================================
 */
export async function getInvoicesForPayment(clientId) {
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

  // ------------------------------------------------------
  // Verify client
  // ------------------------------------------------------

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
    throw new Error("Invalid client.");
  }

  // ------------------------------------------------------
  // Get invoices
  // ------------------------------------------------------

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

      subClientId: invoices.subClientId,
      subClientName: clientSubClients.companyName,
    })
    .from(invoices)

    .leftJoin(clientSubClients, eq(invoices.subClientId, clientSubClients.id))

    .where(
      and(
        eq(invoices.companyId, currentUser.companyId),
        eq(invoices.clientId, parsedClientId),
        isNull(invoices.deletedAt),
      ),
    )

    .orderBy(invoices.dueDate);

  const invoiceList = enrichInvoices(data);

  // Summary should represent the entire client
  const clientSummary = calculateClientSummary(invoiceList);

  // Only invoices where money is still due
  const openInvoices = invoiceList
    .filter((invoice) => Number(invoice.due || 0) > 0)

    .sort((a, b) => {
      // Overdue invoices first
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      // Then oldest due date first
      return (
        new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
      );
    });

  return {
    clientSummary,
    invoices: openInvoices,
  };
}

/**
 * ======================================================
 * CREATE GLOBAL PAYMENT
 * ======================================================
 *
 * Payment belongs to CLIENT.
 *
 * Payment may be allocated to:
 *
 * - zero invoices
 * - one invoice
 * - multiple invoices
 *
 * Allocation total must never exceed payment amount.
 * ======================================================
 */
export async function createPayment(formData) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.user || !currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  // ======================================================
  // PAYMENT VALUES
  // ======================================================

  const clientId = Number(formData.get("clientId"));

  const amount = Number(formData.get("amount"));

  const paymentDateValue = formData.get("paymentDate");

  const receiptNumber = formData.get("receiptNumber")?.trim() || null;

  const method = formData.get("method") || null;

  const reference = formData.get("reference")?.trim() || null;

  const notes = formData.get("notes")?.trim() || null;

  // ======================================================
  // BASIC VALIDATION
  // ======================================================

  if (!clientId) {
    throw new Error("Client is required.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const paymentDate = paymentDateValue
    ? new Date(paymentDateValue)
    : new Date();

  if (Number.isNaN(paymentDate.getTime())) {
    throw new Error("Invalid payment date.");
  }

  // ======================================================
  // VERIFY CLIENT
  // ======================================================

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

  // ======================================================
  // READ ALLOCATIONS
  // ======================================================
  //
  // Form will submit:
  //
  // allocationInvoiceId = 101
  // allocationAmount    = 20000
  //
  // allocationInvoiceId = 102
  // allocationAmount    = 50000
  //
  // etc.
  // ======================================================

  const allocationInvoiceIds = formData
    .getAll("allocationInvoiceId")
    .map(Number);

  const allocationAmounts = formData.getAll("allocationAmount").map(Number);

  if (allocationInvoiceIds.length !== allocationAmounts.length) {
    throw new Error("Invalid payment allocation data.");
  }

  // Remove empty / zero allocations
  const allocations = allocationInvoiceIds
    .map((invoiceId, index) => ({
      invoiceId,
      allocatedAmount: allocationAmounts[index],
    }))
    .filter(
      (allocation) =>
        allocation.invoiceId &&
        Number.isFinite(allocation.allocatedAmount) &&
        allocation.allocatedAmount > 0,
    );

  // ======================================================
  // DUPLICATE INVOICE CHECK
  // ======================================================

  const uniqueInvoiceIds = [
    ...new Set(allocations.map((allocation) => allocation.invoiceId)),
  ];

  if (uniqueInvoiceIds.length !== allocations.length) {
    throw new Error("The same invoice cannot be allocated more than once.");
  }

  // ======================================================
  // TOTAL ALLOCATED
  // ======================================================

  const totalAllocated = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.allocatedAmount),
    0,
  );

  if (totalAllocated > amount) {
    throw new Error("Allocated amount cannot exceed the payment amount.");
  }

  // ======================================================
  // VERIFY INVOICES + OUTSTANDING
  // ======================================================

  let validInvoices = [];

  if (uniqueInvoiceIds.length > 0) {
    validInvoices = await db
      .select({
        id: invoices.id,
        clientId: invoices.clientId,
        outstandingAmount: invoices.outstandingAmount,
      })
      .from(invoices)
      .where(
        and(
          inArray(invoices.id, uniqueInvoiceIds),
          eq(invoices.clientId, clientId),
          eq(invoices.companyId, currentUser.companyId),
          isNull(invoices.deletedAt),
        ),
      );

    if (validInvoices.length !== uniqueInvoiceIds.length) {
      throw new Error("One or more selected invoices are invalid.");
    }

    const invoiceMap = new Map(
      validInvoices.map((invoice) => [invoice.id, invoice]),
    );

    for (const allocation of allocations) {
      const invoice = invoiceMap.get(allocation.invoiceId);

      const outstanding = Number(invoice?.outstandingAmount || 0);

      if (allocation.allocatedAmount > outstanding) {
        throw new Error(
          `Allocation cannot exceed the outstanding amount for the selected invoice.`,
        );
      }
    }
  }

  // ======================================================
  // CREATE PAYMENT
  // ======================================================

  let paymentId;

  await db.transaction(async (tx) => {
    const [newPayment] = await tx
      .insert(payments)
      .values({
        companyId: currentUser.companyId,

        // IMPORTANT:
        // New global payments do not belong directly
        // to one invoice.
        invoiceId: null,

        clientId,

        amount: amount.toString(),

        paymentDate,

        receiptNumber,
        method,
        reference,
        notes,

        createdBy: currentUser.user.id,
      })
      .returning({
        id: payments.id,
      });

    paymentId = newPayment.id;

    // ------------------------------------------------------
    // Create allocations
    // ------------------------------------------------------

    if (allocations.length > 0) {
      await tx.insert(paymentAllocations).values(
        allocations.map((allocation) => ({
          paymentId: newPayment.id,

          invoiceId: allocation.invoiceId,

          allocatedAmount: allocation.allocatedAmount.toString(),

          createdBy: currentUser.user.id,
        })),
      );
    }
  });

  // ======================================================
  // UPDATE INVOICE FINANCIALS
  // ======================================================
  //
  // Transaction has committed.
  //
  // Each affected invoice must now recalculate:
  //
  // paidAmount
  // outstandingAmount
  // status
  // ======================================================

  for (const allocation of allocations) {
    await updateInvoiceFinancials(allocation.invoiceId);
  }

  // ======================================================
  // REVALIDATE
  // ======================================================

  revalidatePath("/payments");
  revalidatePath(`/clients/${clientId}`);

  for (const allocation of allocations) {
    revalidatePath(`/invoices/${allocation.invoiceId}`);
  }

  redirect("/payments");
}

/**
 * ======================================================
 * GET GLOBAL PAYMENTS
 * ======================================================
 */
export async function getPayments() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const rows = await db.query.payments.findMany({
    where: and(
      eq(payments.companyId, currentUser.companyId),
      isNull(payments.deletedAt),
      eq(payments.isVoided, false),
    ),

    with: {
      client: {
        columns: {
          id: true,
          companyName: true,
          companyCode: true,
        },
      },

      allocations: {
        with: {
          invoice: {
            columns: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      },
    },

    orderBy: [desc(payments.paymentDate)],
  });

  return rows.map((payment) => {
    const allocatedAmount =
      payment.allocations?.reduce(
        (sum, allocation) => sum + Number(allocation.allocatedAmount || 0),
        0,
      ) ?? 0;

    const paymentAmount = Number(payment.amount || 0);

    return {
      ...payment,

      allocatedAmount,

      unallocatedAmount: Math.max(paymentAmount - allocatedAmount, 0),
    };
  });
}

/**
 * ======================================================
 * GET CLIENT PAYMENTS
 * ======================================================
 */
export async function getPaymentsByClient(clientId) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  const parsedClientId = Number(clientId);

  if (!parsedClientId) {
    return [];
  }

  // ======================================================
  // VERIFY CLIENT
  // ======================================================

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

  // ======================================================
  // GET PAYMENTS
  // ======================================================

  const rows = await db.query.payments.findMany({
    where: and(
      eq(payments.companyId, currentUser.companyId),
      eq(payments.clientId, parsedClientId),
      isNull(payments.deletedAt),
      eq(payments.isVoided, false),
    ),

    with: {
      allocations: {
        with: {
          invoice: {
            columns: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      },
    },

    orderBy: [desc(payments.paymentDate)],
  });

  return rows.map((payment) => {
    const allocatedAmount =
      payment.allocations?.reduce(
        (sum, allocation) => sum + Number(allocation.allocatedAmount || 0),
        0,
      ) ?? 0;

    const paymentAmount = Number(payment.amount || 0);

    return {
      ...payment,

      allocatedAmount,

      unallocatedAmount: Math.max(paymentAmount - allocatedAmount, 0),
    };
  });
}

export async function updatePayment(paymentId, invoiceId, prevState, formData) {
  try {
    // =====================================
    // FORM VALUES
    // =====================================

    const amount = parseFloat(formData.get("amount"));

    const method = formData.get("method");

    const reference = formData.get("reference");

    const notes = formData.get("notes");

    const paymentDate = formData.get("paymentDate")
      ? new Date(formData.get("paymentDate"))
      : null;

    if (isNaN(amount)) {
      return { error: "Invalid amount" };
    }

    // =====================================
    // UPDATE PAYMENT
    // =====================================

    await db
      .update(payments)
      .set({
        amount: String(amount),
        method,
        reference,
        notes,
        paymentDate,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    // =====================================
    // UPDATE PAYMENT ALLOCATION
    // =====================================

    await db
      .update(paymentAllocations)
      .set({
        allocatedAmount: amount.toString(),
      })
      .where(eq(paymentAllocations.paymentId, paymentId))
      .returning();

    // =====================================
    // RECALCULATE INVOICE STATUS
    // =====================================

    const invoiceResult = await db
      .select({
        invoiceAmount: invoices.invoiceAmount,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    const invoiceAmount = Number(invoiceResult[0]?.invoiceAmount || 0);

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
      .where(eq(paymentAllocations.invoiceId, invoiceId));

    const totalPaid = Number(allocationResult[0]?.total || 0);
    const invoiceStatus = calculateInvoiceStatus({
      netPayable: invoiceAmount,
      paid: totalPaid,
      dueDate: invoiceResult[0]?.dueDate,
    });
    // =====================================
    // UPDATE INVOICE
    // =====================================

    await db
      .update(invoices)
      .set({
        status: invoiceStatus.status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    await processPaymentEvents(invoiceId, paymentId);

    // =====================================
    // REFRESH
    // =====================================

    revalidatePath(`/invoices/${invoiceId}`);

    revalidatePath("/invoices");

    return { success: true };
  } catch (err) {
    console.error(err);

    return { error: "Failed to update payment" };
  }
}
