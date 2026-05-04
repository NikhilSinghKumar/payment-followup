"use server";

import { db } from "@/db";
import { invoices, clients, payments } from "@/db/schema";
import { eq, sql, ilike, or } from "drizzle-orm";

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

  // 🔍 SEARCH
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
