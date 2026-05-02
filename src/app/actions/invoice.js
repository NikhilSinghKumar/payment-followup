"use server";

import { db } from "@/db";
import { invoices, clients, payments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getInvoices() {
  const data = await db
    .select({
      id: invoices.id,
      amount: invoices.amount,
      dueDate: invoices.dueDate,
      companyName: clients.companyName,

      // 🔥 total paid
      paid: sql`COALESCE(SUM(${payments.amount}), 0)`,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(payments, eq(payments.invoiceId, invoices.id))
    .groupBy(invoices.id, clients.companyName);

  // 🔥 compute due + status
  return data.map((inv) => {
    const amount = Number(inv.amount);
    const paid = Number(inv.paid);
    const due = amount - paid;

    let status = "pending";
    if (paid === 0) status = "pending";
    else if (paid < amount) status = "partial";
    else status = "paid";

    return {
      ...inv,
      paid,
      due,
      status,
    };
  });
}
