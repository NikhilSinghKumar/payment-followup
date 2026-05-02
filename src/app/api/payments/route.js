import { db } from "@/db";
import { payments, invoices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req) {
  try {
    const body = await req.json();

    const { invoiceId, amount, method, reference, notes } = body;

    if (!invoiceId || !amount) {
      return Response.json(
        { error: "invoiceId and amount required" },
        { status: 400 },
      );
    }

    // 🔹 Get invoice
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice.length) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 🔹 Get total paid
    const existingPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));

    const totalPaid = existingPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    const totalAmount = Number(invoice[0].amount);
    const due = totalAmount - totalPaid;

    // 🚨 VALIDATION
    if (Number(amount) > due) {
      return Response.json(
        { error: "Payment exceeds due amount" },
        { status: 400 },
      );
    }

    // 🔹 Insert payment
    await db.insert(payments).values({
      invoiceId,
      amount,
      method,
      reference,
      notes,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to add payment" }, { status: 500 });
  }
}
