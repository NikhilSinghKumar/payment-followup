import { db } from "@/db";
import { clientSubClients } from "@/db/schema";
import { parse } from "csv-parse/sync";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);

    const clientId = Number(searchParams.get("clientId"));

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required." },
        { status: 400 },
      );
    }

    const formData = await req.formData();

    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const text = await file.text();

    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let imported = 0;
    let restored = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row["Company Name"] || !row["GST Number"]) {
        continue;
      }

      const existing = await db.query.clientSubClients.findFirst({
        where: (clientSubClients, { and, eq }) =>
          and(
            eq(clientSubClients.clientId, clientId),
            eq(clientSubClients.companyName, row["Company Name"]),
          ),
      });

      // Active record already exists
      if (existing && existing.deletedAt === null) {
        skipped++;
        continue;
      }

      const isTdsApplicable =
        row["TDS Applicable"]?.toLowerCase() === "yes" ||
        row["TDS Applicable"]?.toLowerCase() === "true";
      const rawTdsRate = row["TDS Rate"] || row["tds_rate"];
      const parsedTdsRate = rawTdsRate ? parseFloat(rawTdsRate) : 2.0;
      const tdsRate = !isNaN(parsedTdsRate) ? parsedTdsRate.toFixed(2) : "2.00";

      // Restore soft-deleted record
      if (existing && existing.deletedAt) {
        await db
          .update(clientSubClients)
          .set({
            companyName: row["Company Name"],
            companyCode: row["Company Code"] || null,
            gstNumber: row["GST Number"],
            address: row["Address"] || null,
            city: row["City"] || null,
            state: row["State"] || null,
            pincode: row["Pincode"] || null,
            tdsApplicable: isTdsApplicable,
            tdsRate: isTdsApplicable ? tdsRate : "2.00",
            deletedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(clientSubClients.id, existing.id));

        restored++;
        continue;
      }

      // Insert new record
      await db.insert(clientSubClients).values({
        clientId,

        companyName: row["Company Name"],
        companyCode: row["Company Code"],
        gstNumber: row["GST Number"],

        tdsApplicable: isTdsApplicable,
        tdsRate: isTdsApplicable ? tdsRate : "2.00",
      });

      imported++;
    }

    return NextResponse.json({
      success: true,
      imported,
      restored,
      skipped,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Import failed.",
      },
      {
        status: 500,
      },
    );
  }
}
