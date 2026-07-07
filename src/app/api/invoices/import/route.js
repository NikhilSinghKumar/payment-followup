import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { parse } from "csv-parse/sync";
import { and, eq, isNull } from "drizzle-orm";
import { calculateInvoice } from "@/lib/invoice-calculator";
import { getFinancialYear } from "@/lib/financial-year";
import { getClientTaxSettings } from "@/lib/client-tax-settings";

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = Number(searchParams.get("clientId"));

    if (!clientId) {
      return NextResponse.json(
        {
          error: "Client ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        {
          error: "CSV file is required.",
        },
        {
          status: 400,
        },
      );
    }

    const text = await file.text();
    const rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const taxSettings = await getClientTaxSettings(clientId);

    let imported = 0;

    const errors = [];

    const invoicesToInsert = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];

      try {
        const invoiceNumber = row["Invoice Number"]?.trim();
        const invoiceDate = new Date(row["Invoice Date"]);
        const dueDate = new Date(row["Due Date"]);
        const invoiceAmount = Number(row["Invoice Amount"]);
        const deductionAmount = Number(row["Deduction Amount"] || 0);
        const otherCharges = Number(row["Other Charges"] || 0);
        const notes = row["Notes"] || "";

        if (!invoiceNumber || isNaN(invoiceAmount)) {
          throw new Error("Invalid data.");
        }

        const duplicate = await db.query.invoices.findFirst({
          where: and(
            eq(invoices.invoiceNumber, invoiceNumber),
            isNull(invoices.deletedAt),
          ),
        });

        if (duplicate) {
          throw new Error("Invoice number already exists.");
        }

        const financialYear = getFinancialYear(invoiceDate);

        const summary = calculateInvoice({
          invoiceAmount,
          gstNumber: taxSettings.gstNumber,
          tdsApplicable: taxSettings.tdsApplicable,
          deductionAmount,
          otherCharges,
        });

        await db.insert(invoices).values({
          clientId,
          invoiceNumber,
          financialYear,
          invoiceDate,
          dueDate,
          invoiceAmount: summary.invoiceAmount,
          basicAmount: summary.basicAmount,
          cgstAmount: summary.cgstAmount,
          sgstAmount: summary.sgstAmount,
          igstAmount: summary.igstAmount,
          tdsAmount: summary.tdsAmount,
          deductionAmount: summary.deductionAmount,
          otherCharges: summary.otherCharges,
          netPayableAmount: summary.netPayableAmount,
          gstNumberUsed: summary.gstNumberUsed,
          tdsApplicableUsed: summary.tdsApplicableUsed,
          notes,
          status: "pending",
        });

        imported++;
      } catch (err) {
        errors.push({
          row: index + 2,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,

      imported,

      failed: errors.length,

      errors,
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
