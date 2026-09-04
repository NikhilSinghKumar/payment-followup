"use server";

import { db } from "@/db";

import {
  clients,
  invoices,
  clientSubClients,
  payments,
  paymentAllocations,
  invoiceAwbs,
} from "@/db/schema";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/auth";
import { enrichInvoices } from "@/lib/invoice-summary";
import { calculateClientSummary } from "@/lib/client-summary";
import { updateInvoiceFinancials } from "@/lib/invoice/updateInvoiceFinancials";
import {
  processPaymentEvents,
  processClientPaymentSettlementEvent,
} from "@/lib/notifications/event-services";

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

  const clientRows = await db
    .select({
      id: clients.id,
    })
    .from(clients)
    .where(
      and(
        eq(clients.id, parsedClientId),
        eq(clients.companyId, currentUser.companyId),
        isNull(clients.deletedAt),
      ),
    )
    .limit(1);

  const client = clientRows[0] || null;

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
      isOpeningBalance: invoices.isOpeningBalance,
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

  // Deduplicate and filter open invoices
  const seenIds = new Set();
  const openInvoices = invoiceList
    .filter((invoice) => Number(invoice.due || 0) > 0)
    .filter((invoice) => {
      if (seenIds.has(invoice.id)) return false;
      seenIds.add(invoice.id);
      return true;
    })
    .sort((a, b) => {
      // Overdue invoices first
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;

      // Then oldest due date first
      return (
        new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
      );
    });

  // Fetch AWBs for open invoices
  const invoiceIds = openInvoices.map((inv) => inv.id);
  const awbMap = {};

  if (invoiceIds.length > 0) {
    const awbRows = await db
      .select({
        id: invoiceAwbs.id,
        invoiceId: invoiceAwbs.invoiceId,
        awbNumber: invoiceAwbs.awbNumber,
        shipmentDate: invoiceAwbs.shipmentDate,
        origin: invoiceAwbs.origin,
        destination: invoiceAwbs.destination,
        weight: invoiceAwbs.weight,
        amount: invoiceAwbs.amount,
        remarks: invoiceAwbs.remarks,
      })
      .from(invoiceAwbs)
      .where(
        and(
          inArray(invoiceAwbs.invoiceId, invoiceIds),
          isNull(invoiceAwbs.deletedAt),
        ),
      );

    for (const row of awbRows) {
      if (!awbMap[row.invoiceId]) {
        awbMap[row.invoiceId] = [];
      }
      if (row.awbNumber) {
        awbMap[row.invoiceId].push(row);
      }
    }
  }

  const invoicesWithAwbs = openInvoices.map((inv) => ({
    ...inv,
    awbs: awbMap[inv.id] || [],
  }));

  const subClients = await db
    .select({
      id: clientSubClients.id,
      companyName: clientSubClients.companyName,
      companyCode: clientSubClients.companyCode,
    })
    .from(clientSubClients)
    .where(
      and(
        eq(clientSubClients.clientId, parsedClientId),
        isNull(clientSubClients.deletedAt),
        eq(clientSubClients.isActive, true),
      ),
    )
    .orderBy(clientSubClients.companyName);

  return {
    clientSummary,
    invoices: invoicesWithAwbs,
    subClients,
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

  const subClientIdRaw = formData.get("subClientId");
  const subClientId =
    subClientIdRaw && subClientIdRaw !== "" && !isNaN(Number(subClientIdRaw))
      ? Number(subClientIdRaw)
      : null;

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

  const clientRows = await db
    .select({
      id: clients.id,
    })
    .from(clients)
    .where(
      and(
        eq(clients.id, clientId),
        eq(clients.companyId, currentUser.companyId),
        isNull(clients.deletedAt),
      ),
    )
    .limit(1);

  const client = clientRows[0] || null;

  if (!client) {
    throw new Error("Invalid client.");
  }

  // ======================================================
  // VERIFY SUBCLIENT (IF PROVIDED)
  // ======================================================

  let verifiedSubClientId = null;
  if (subClientId) {
    const subClientRows = await db
      .select({ id: clientSubClients.id })
      .from(clientSubClients)
      .where(
        and(
          eq(clientSubClients.id, subClientId),
          eq(clientSubClients.clientId, clientId),
          isNull(clientSubClients.deletedAt),
        ),
      )
      .limit(1);

    if (!subClientRows.length) {
      throw new Error("Invalid subclient selected.");
    }

    verifiedSubClientId = subClientRows[0].id;
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
        subClientId: verifiedSubClientId,

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
  // TRIGGER MULTI-INVOICE SETTLEMENT NOTIFICATION
  // ======================================================

  try {
    if (allocations.length > 0) {
      await processClientPaymentSettlementEvent({
        clientId,
        companyId: currentUser.companyId,
        paymentId,
        paymentDetails: {
          amount,
          paymentDate,
          method,
          referenceNumber: reference,
        },
        settledInvoices: allocations.map((a) => ({
          invoiceId: a.invoiceId,
          settledAmount: a.allocatedAmount,
        })),
      });
    }
  } catch (notifErr) {
    console.error(
      "[createPayment] Error triggering payment notification:",
      notifErr,
    );
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
export async function getPayments(
  queryOrOptions = {},
  maybeDate,
  maybeStartDate,
  maybeEndDate,
) {
  const currentUser = await getCurrentUser();

  if (!currentUser?.companyId) {
    throw new Error("Unauthorized");
  }

  let query = "";
  let date = "";
  let startDate = "";
  let endDate = "";

  if (typeof queryOrOptions === "object" && queryOrOptions !== null) {
    query = queryOrOptions.query ?? queryOrOptions.q ?? "";
    date = queryOrOptions.date ?? "";
    startDate = queryOrOptions.startDate ?? "";
    endDate = queryOrOptions.endDate ?? "";
  } else {
    query = queryOrOptions || "";
    date = maybeDate || "";
    startDate = maybeStartDate || "";
    endDate = maybeEndDate || "";
  }

  // 1. Fetch payments with client info
  const paymentRows = await db
    .select({
      id: payments.id,
      companyId: payments.companyId,
      clientId: payments.clientId,
      subClientId: payments.subClientId,
      invoiceId: payments.invoiceId,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      receiptNumber: payments.receiptNumber,
      method: payments.method,
      reference: payments.reference,
      notes: payments.notes,
      isVoided: payments.isVoided,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      client: {
        id: clients.id,
        companyName: clients.companyName,
        companyCode: clients.companyCode,
      },
      subClient: {
        id: clientSubClients.id,
        companyName: clientSubClients.companyName,
        companyCode: clientSubClients.companyCode,
      },
    })
    .from(payments)
    .leftJoin(clients, eq(payments.clientId, clients.id))
    .leftJoin(clientSubClients, eq(payments.subClientId, clientSubClients.id))
    .where(
      and(
        eq(payments.companyId, currentUser.companyId),
        isNull(payments.deletedAt),
        eq(payments.isVoided, false),
      ),
    )
    .orderBy(desc(payments.paymentDate), desc(payments.id));

  if (paymentRows.length === 0) {
    return [];
  }

  const paymentIds = paymentRows.map((p) => p.id);

  // 2. Fetch allocations with invoice numbers
  const allocationRows = await db
    .select({
      id: paymentAllocations.id,
      paymentId: paymentAllocations.paymentId,
      invoiceId: paymentAllocations.invoiceId,
      allocatedAmount: paymentAllocations.allocatedAmount,
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
      },
    })
    .from(paymentAllocations)
    .leftJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
    .where(
      and(
        inArray(paymentAllocations.paymentId, paymentIds),
        isNull(paymentAllocations.deletedAt),
      ),
    );

  const allocationsByPayment = new Map();
  for (const alloc of allocationRows) {
    if (!allocationsByPayment.has(alloc.paymentId)) {
      allocationsByPayment.set(alloc.paymentId, []);
    }
    allocationsByPayment.get(alloc.paymentId).push(alloc);
  }

  let results = paymentRows.map((payment) => {
    const allocations = allocationsByPayment.get(payment.id) || [];
    const allocatedAmount =
      allocations.reduce(
        (sum, allocation) => sum + Number(allocation.allocatedAmount || 0),
        0,
      ) ?? 0;

    const paymentAmount = Number(payment.amount || 0);

    return {
      ...payment,
      allocations,
      allocatedAmount,
      unallocatedAmount: Math.max(paymentAmount - allocatedAmount, 0),
    };
  });

  // Filter by search query (companyName, companyCode, receiptNumber, reference)
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    results = results.filter((payment) => {
      const companyName = payment.client?.companyName?.toLowerCase() || "";
      const companyCode = payment.client?.companyCode?.toLowerCase() || "";
      const receiptNumber = payment.receiptNumber?.toLowerCase() || "";
      const reference = payment.reference?.toLowerCase() || "";

      return (
        companyName.includes(q) ||
        companyCode.includes(q) ||
        receiptNumber.includes(q) ||
        reference.includes(q)
      );
    });
  }

  // Filter by date or date range
  if (date) {
    results = results.filter((payment) => {
      if (!payment.paymentDate) return false;
      const paymentDateStr = new Date(payment.paymentDate)
        .toISOString()
        .slice(0, 10);
      return paymentDateStr === date;
    });
  } else if (startDate || endDate) {
    results = results.filter((payment) => {
      if (!payment.paymentDate) return false;
      const paymentDateStr = new Date(payment.paymentDate)
        .toISOString()
        .slice(0, 10);

      if (startDate && paymentDateStr < startDate) return false;
      if (endDate && paymentDateStr > endDate) return false;
      return true;
    });
  }

  return results;
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

  const clientRows = await db
    .select({
      id: clients.id,
    })
    .from(clients)
    .where(
      and(
        eq(clients.id, parsedClientId),
        eq(clients.companyId, currentUser.companyId),
        isNull(clients.deletedAt),
      ),
    )
    .limit(1);

  const client = clientRows[0] || null;

  if (!client) {
    return [];
  }

  // ======================================================
  // GET PAYMENTS
  // ======================================================

  const paymentRows = await db
    .select({
      id: payments.id,
      companyId: payments.companyId,
      clientId: payments.clientId,
      subClientId: payments.subClientId,
      invoiceId: payments.invoiceId,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      receiptNumber: payments.receiptNumber,
      method: payments.method,
      reference: payments.reference,
      notes: payments.notes,
      isVoided: payments.isVoided,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      subClient: {
        id: clientSubClients.id,
        companyName: clientSubClients.companyName,
        companyCode: clientSubClients.companyCode,
      },
    })
    .from(payments)
    .leftJoin(clientSubClients, eq(payments.subClientId, clientSubClients.id))
    .where(
      and(
        eq(payments.companyId, currentUser.companyId),
        eq(payments.clientId, parsedClientId),
        isNull(payments.deletedAt),
        eq(payments.isVoided, false),
      ),
    )
    .orderBy(desc(payments.paymentDate), desc(payments.id));

  if (paymentRows.length === 0) {
    return [];
  }

  const paymentIds = paymentRows.map((p) => p.id);

  const allocationRows = await db
    .select({
      id: paymentAllocations.id,
      paymentId: paymentAllocations.paymentId,
      invoiceId: paymentAllocations.invoiceId,
      allocatedAmount: paymentAllocations.allocatedAmount,
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
      },
    })
    .from(paymentAllocations)
    .leftJoin(invoices, eq(paymentAllocations.invoiceId, invoices.id))
    .where(
      and(
        inArray(paymentAllocations.paymentId, paymentIds),
        isNull(paymentAllocations.deletedAt),
      ),
    );

  const allocationsByPayment = new Map();
  for (const alloc of allocationRows) {
    if (!allocationsByPayment.has(alloc.paymentId)) {
      allocationsByPayment.set(alloc.paymentId, []);
    }
    allocationsByPayment.get(alloc.paymentId).push(alloc);
  }

  return paymentRows.map((payment) => {
    const allocations = allocationsByPayment.get(payment.id) || [];
    const allocatedAmount =
      allocations.reduce(
        (sum, allocation) => sum + Number(allocation.allocatedAmount || 0),
        0,
      ) ?? 0;

    const paymentAmount = Number(payment.amount || 0);

    return {
      ...payment,
      allocations,
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
