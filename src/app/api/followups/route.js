import { db } from "@/db";
import { followups, invoices } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req) {
  try {
    const body = await req.json();

    const { invoiceId, note, followupDate } = body;

    // 🔹 Validation
    if (!invoiceId || !note) {
      return Response.json(
        { error: "invoiceId and note are required" },
        { status: 400 },
      );
    }

    // 🔹 Check invoice exists
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice.length) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 🔹 Insert followup
    await db.insert(followups).values({
      invoiceId,
      note,
      followupDate: followupDate ? new Date(followupDate) : null,
    });

    return Response.json({
      success: true,
      message: "Followup added successfully",
    });
  } catch (err) {
    console.error("Followup Error:", err);

    return Response.json({ error: "Failed to add followup" }, { status: 500 });
  }
}
