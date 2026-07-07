import { db } from "@/db";
import { invoices, clients } from "@/db/schema";
import { parse } from "csv-parse/sync";
import { eq, and } from "drizzle-orm";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();

  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  let inserted = 0;
  let skipped = 0;
  const total = records.length;

  for (const row of records) {
    const invoiceNumber = row.invoice_number?.trim();
    const financialYear = row.financial_year?.trim();
    const notes = row.notes?.trim() || "";
    try {
      // 🔹 Extract
      const companyCode = row.company_code?.trim();

      const rawAmount = row.amount?.toString().trim() || "";
      const cleanedAmount = rawAmount.replace(/,/g, "");
      const amount = parseFloat(cleanedAmount);

      // ✅ NEW DATE FIELDS

      const dueDate = row.due_date ? new Date(row.due_date) : null;

      // 🔹 Validation
      if (!companyCode || !invoiceNumber || !financialYear || isNaN(amount)) {
        skipped++;
        continue;
      }

      // 🔹 Find client
      const client = await db
        .select()
        .from(clients)
        .where(eq(clients.companyCode, companyCode))
        .limit(1);

      if (!client.length) {
        skipped++;
        continue;
      }

      const clientId = client[0].id;

      // 🔥 UPDATED DUPLICATE CHECK
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

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // 🔹 Insert
      await db.insert(invoices).values({
        clientId,
        financialYear,
        invoiceNumber,
        invoiceAmount,
        status: "pending",
        dueDate,
        notes,
      });

      inserted++;
    } catch (err) {
      console.error("❌ Row failed:", row, err);
      skipped++;
    }
  }

  return Response.json({
    inserted,
    skipped,
    total,
    message: `Imported ${inserted}, Skipped ${skipped}, Total ${total}`,
  });
}
