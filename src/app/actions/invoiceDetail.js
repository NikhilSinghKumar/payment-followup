"use server";

import { db } from "@/db";

import {
  invoices,
  clients,
  invoiceAwbs,
  payments,
  paymentAllocations,
  followups,
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import { calculateInvoiceStatus } from "@/lib/invoice-status";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";

// =====================================
// SUMMARY
// =====================================

export async function getInvoiceSummary(id) {
  // =====================================
  // INVOICE
  // =====================================

  const invoiceResult = await db
    .select({
      id: invoices.id,

      invoiceNumber: invoices.invoiceNumber,

      financialYear: invoices.financialYear,

      invoiceAmount: invoices.invoiceAmount,

      netPayableAmount: invoices.netPayableAmount,

      dueDate: invoices.dueDate,

      status: invoices.status,

      companyName: clients.companyName,
      basicAmount: invoices.basicAmount,

      cgstAmount: invoices.cgstAmount,

      sgstAmount: invoices.sgstAmount,

      igstAmount: invoices.igstAmount,

      tdsAmount: invoices.tdsAmount,

      deductionAmount: invoices.deductionAmount,

      otherCharges: invoices.otherCharges,

      netPayableAmount: invoices.netPayableAmount,

      gstNumberUsed: invoices.gstNumberUsed,
      tdsApplicableUsed: invoices.tdsApplicableUsed,
    })
    .from(invoices)
    .leftJoin(clients, eq(clients.id, invoices.clientId))
    .where(and(eq(invoices.id, id), isNull(invoices.deletedAt)))
    .limit(1);

  if (!invoiceResult.length) {
    return null;
  }

  const invoice = invoiceResult[0];

  // =====================================
  // AWB COUNT
  // =====================================

  const awbResult = await db
    .select({
      count: count(),
    })
    .from(invoiceAwbs)
    .where(and(eq(invoiceAwbs.invoiceId, id), isNull(invoiceAwbs.deletedAt)));

  const awbCount = Number(awbResult[0]?.count || 0);

  // =====================================
  // TOTAL PAID
  // =====================================

  const paymentResult = await db
    .select({
      total: sql`
        COALESCE(
          SUM(${paymentAllocations.allocatedAmount}),
          0
        )
      `,
    })
    .from(paymentAllocations)
    .where(
      and(
        eq(paymentAllocations.invoiceId, id),

        isNull(paymentAllocations.deletedAt),
      ),
    );

  const totalPaid = Number(paymentResult[0]?.total || 0);

  const paymentSummary = calculateInvoiceStatus({
    netPayable: invoice.netPayableAmount,
    paid: totalPaid,
    dueDate: invoice.dueDate,
  });

  // =====================================
  // OUTSTANDING
  // =====================================

  const netPayableAmount = Number(invoice.netPayableAmount);
  const outstanding = Math.max(0, netPayableAmount - totalPaid);

  // =====================================
  // RETURN
  // =====================================

  return {
    ...invoice,
    awbCount,
    ...paymentSummary,
  };
}

// =====================================
// AWBS
// =====================================

export async function getInvoiceAwbs(invoiceId) {
  return await db
    .select()
    .from(invoiceAwbs)
    .where(
      and(eq(invoiceAwbs.invoiceId, invoiceId), isNull(invoiceAwbs.deletedAt)),
    )
    .orderBy(desc(invoiceAwbs.id));
}

// =====================================
// PAYMENTS
// =====================================

export async function getInvoicePayments(invoiceId) {
  return await db
    .select({
      id: payments.id,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      method: payments.method,
      receiptNumber: payments.receiptNumber,
      reference: payments.reference,
      notes: payments.notes,
    })
    .from(paymentAllocations)

    .leftJoin(payments, eq(payments.id, paymentAllocations.paymentId))

    .where(
      and(
        eq(paymentAllocations.invoiceId, invoiceId),
        isNull(paymentAllocations.deletedAt),
      ),
    )

    .orderBy(desc(payments.paymentDate));
}

// =====================================
// FOLLOWUPS
// =====================================

export async function getInvoiceFollowups(invoiceId) {
  return await db
    .select()
    .from(followups)
    .where(and(eq(followups.invoiceId, invoiceId), isNull(followups.deletedAt)))
    .orderBy(desc(followups.createdAt));
}

// =====================================
// ACTIVITIES
// =====================================

export async function getInvoiceActivities(invoiceId) {
  const paymentActivities = await getInvoicePayments(invoiceId);
  const followupActivities = await getInvoiceFollowups(invoiceId);

  return [
    ...paymentActivities.map((item) => ({
      type: "payment",
      message: `Payment received: ₹${Number(item.amount).toLocaleString("en-IN")}`,
      createdAt: item.paymentDate,
    })),

    ...followupActivities.map((item) => ({
      type: "followup",
      message: item.note,
      createdAt: item.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addInvoiceAwb(invoiceId, formData) {
  const awbNumber = formData.get("awbNumber")?.trim();

  const shipmentDate = formData.get("shipmentDate")
    ? new Date(formData.get("shipmentDate"))
    : null;

  const origin = formData.get("origin")?.trim();
  const destination = formData.get("destination")?.trim();
  const remarks = formData.get("remarks")?.trim();
  const weight = formData.get("weight") ? String(formData.get("weight")) : null;
  const amount = formData.get("amount") ? String(formData.get("amount")) : null;

  if (!awbNumber) {
    return {
      error: "AWB number required",
    };
  }

  await db.insert(invoiceAwbs).values({
    invoiceId,
    awbNumber,
    shipmentDate,
    origin,
    destination,
    weight,
    amount,
    remarks,
  });

  revalidatePath(`/invoices/${invoiceId}`);

  return {
    success: true,
  };
}

export async function addInvoicePayment(invoiceId, formData) {
  // =====================================
  // FORM VALUES
  // =====================================

  const receiptNumber = formData.get("receiptNumber")?.trim();
  const method = formData.get("method");
  const reference = formData.get("reference")?.trim();
  const notes = formData.get("notes")?.trim();
  const paymentDate = formData.get("paymentDate")
    ? new Date(formData.get("paymentDate"))
    : new Date();

  const amount = parseFloat(formData.get("amount"));

  // =====================================
  // VALIDATION
  // =====================================

  if (!amount || amount <= 0) {
    return {
      error: "Payment amount required",
    };
  }

  // =====================================
  // GET INVOICE
  // =====================================

  const invoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))
    .limit(1);

  if (!invoice.length) {
    return {
      error: "Invoice not found",
    };
  }

  const invoiceData = invoice[0];

  // =====================================
  // CREATE PAYMENT
  // =====================================

  const insertedPayment = await db
    .insert(payments)
    .values({
      invoiceId,
      clientId: invoiceData.clientId,
      amount: String(amount),
      paymentDate,
      receiptNumber,
      method,
      reference,
      notes,
    })
    .returning({
      id: payments.id,
    });

  const paymentId = insertedPayment[0].id;

  // =====================================
  // CREATE PAYMENT ALLOCATION
  // =====================================

  await db.insert(paymentAllocations).values({
    paymentId,
    invoiceId,
    allocatedAmount: String(amount),
  });

  // =====================================
  // UPDATE INVOICE STATUS
  // =====================================

  const allocations = await db
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

  const totalPaid = Number(allocations[0]?.total || 0);

  const paymentSummary = calculateInvoiceStatus({
    netPayable: invoice.netPayableAmount,
    paid: totalPaid,
    dueDate: invoice.dueDate,
  });

  await db
    .update(invoices)
    .set({
      status: paymentSummary.status,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId));

  // =====================================
  // REFRESH PAGE
  // =====================================

  revalidatePath(`/invoices/${invoiceId}`);

  return {
    ...invoice,
    awbCount,
    ...paymentSummary,
  };
}

export async function addInvoiceFollowup(invoiceId, formData) {
  // =====================================
  // FORM VALUES
  // =====================================

  const note = formData.get("note")?.trim();

  const followupDate = formData.get("followupDate")
    ? new Date(formData.get("followupDate"))
    : null;

  // =====================================
  // VALIDATION
  // =====================================

  if (!note) {
    return {
      error: "Followup note required",
    };
  }

  // =====================================
  // INSERT
  // =====================================

  await db.insert(followups).values({
    invoiceId,
    note,
    followupDate,
  });

  // =====================================
  // REFRESH
  // =====================================

  revalidatePath(`/invoices/${invoiceId}`);

  return {
    success: true,
  };
}
