import { db } from "@/db";
import { clients } from "@/db/schema";
import { parse } from "csv-parse/sync";
import { inArray } from "drizzle-orm";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    // ✅ File validation
    if (!file || file.size === 0) {
      return Response.json(
        { status: "error", message: "No file uploaded" },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return Response.json(
        { status: "error", message: "Only CSV files are allowed" },
        { status: 400 },
      );
    }

    const text = await file.text();

    // ✅ Parse CSV
    let records;
    try {
      records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      return Response.json(
        { status: "error", message: "Invalid CSV format" },
        { status: 400 },
      );
    }

    if (!records.length) {
      return Response.json(
        { status: "error", message: "CSV is empty" },
        { status: 400 },
      );
    }

    // ✅ Header validation
    const requiredHeaders = ["company_name", "company_code"];
    const headers = Object.keys(records[0]);

    for (const h of requiredHeaders) {
      if (!headers.includes(h)) {
        return Response.json(
          { status: "error", message: `Missing column: ${h}` },
          { status: 400 },
        );
      }
    }

    // ✅ Prepare stats
    let inserted = 0;
    let skipped = 0;
    const errors = [];

    // ✅ Normalize + collect codes
    const codes = records.map((r) => r.company_code?.trim()).filter(Boolean);

    // ✅ Fetch existing clients (single query)
    const existingClients = codes.length
      ? await db
          .select()
          .from(clients)
          .where(inArray(clients.companyCode, codes))
      : [];

    const existingSet = new Set(existingClients.map((c) => c.companyCode));

    const toInsert = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ✅ Validate + filter rows
    for (let i = 0; i < records.length; i++) {
      const row = records[i];

      const companyName = row.company_name?.trim();
      const companyCode = row.company_code?.trim();
      const email = row.email?.trim() || null;
      const phone = row.phone?.trim() || null;
      const gstNumber = row.gst_number?.trim() || null;
      const tdsApplicable =
        row.tds_applicable?.toString().trim().toLowerCase() === "true";

      const rowNum = i + 2; // header = row 1

      // Required validation
      if (!companyName || !companyCode) {
        skipped++;
        errors.push(`Row ${rowNum}: Missing required fields`);
        continue;
      }

      // Email validation
      if (email && !emailRegex.test(email)) {
        skipped++;
        errors.push(`Row ${rowNum}: Invalid email (${email})`);
        continue;
      }

      // Duplicate check (DB + CSV)
      if (existingSet.has(companyCode)) {
        skipped++;
        errors.push(`Row ${rowNum}: Duplicate (${companyCode})`);
        continue;
      }

      toInsert.push({
        companyName,
        email,
        phone,
        companyCode,
        gstNumber,
        tdsApplicable,
      });

      existingSet.add(companyCode);
    }

    // ✅ Insert (safe + fast)
    if (toInsert.length > 0) {
      await db.insert(clients).values(toInsert).onConflictDoNothing(); // extra safety
      inserted = toInsert.length;
    }

    // ✅ Final response
    return Response.json({
      status: "success",
      message: "Import completed",
      summary: {
        total: records.length,
        inserted,
        skipped,
      },
      errors: errors.slice(0, 10), // limit output
    });
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        status: "error",
        message: "Import failed",
        error: err.message,
      },
      { status: 500 },
    );
  }
}
