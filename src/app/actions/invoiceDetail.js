"use server";

import { db } from "@/db";
import { invoices, clients, payments, followups } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getInvoiceDetail(id) {
  // 🔹 Invoice + client
  const invoiceData = await db
    .select({
      id: invoices.id,
      amount: invoices.amount,
      invoiceNumber: invoices.invoiceNumber,
      dueDate: invoices.dueDate,

      companyName: clients.companyName,
      companyCode: clients.companyCode,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.id, id))
    .limit(1);

  if (!invoiceData.length) return null;

  // 🔹 Payments
  const paymentList = await db
    .select()
    .from(payments)
    .where(eq(payments.invoiceId, id))
    .orderBy(desc(payments.paymentDate));

  // 🔹 Followups
  const followupList = await db
    .select()
    .from(followups)
    .where(eq(followups.invoiceId, id))
    .orderBy(desc(followups.createdAt));

  // 🔹 Calculate totals
  const totalPaid = paymentList.reduce((sum, p) => sum + Number(p.amount), 0);

  const totalAmount = Number(invoiceData[0].amount);
  const due = totalAmount - totalPaid;

  let status = "Pending";
  if (totalPaid > 0 && totalPaid < totalAmount) status = "Partial";
  if (totalPaid >= totalAmount) status = "Paid";

  return {
    invoice: invoiceData[0],
    payments: paymentList,
    followups: followupList,
    summary: {
      totalAmount,
      totalPaid,
      due,
      status,
    },
  };
}
