import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { parse } from "csv-parse/sync";
import { and, eq, isNull } from "drizzle-orm";
import { calculateInvoice } from "@/lib/invoice-calculator";
import { getFinancialYear } from "@/lib/financial-year";
import { getClientTaxSettings } from "@/lib/client-tax-settings";
import { revalidatePath } from "next/cache";

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
    const csvInvoiceNumbers = new Set();

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

    // Fetch all existing invoice numbers for this client once
    const existingInvoices = await db
      .select({
        invoiceNumber: invoices.invoiceNumber,
      })
      .from(invoices)
      .where(and(eq(invoices.clientId, clientId), isNull(invoices.deletedAt)));

    const existingInvoiceNumbers = new Set(
      existingInvoices.map((i) => i.invoiceNumber),
    );

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

        if (isNaN(invoiceDate.getTime())) {
          throw new Error("Invalid invoice date.");
        }

        if (isNaN(dueDate.getTime())) {
          throw new Error("Invalid due date.");
        }

        if (!invoiceNumber) {
          throw new Error("Invoice number is required.");
        }

        if (existingInvoiceNumbers.has(invoiceNumber)) {
          throw new Error("Invoice number already exists.");
        }

        if (dueDate < invoiceDate) {
          throw new Error("Due date cannot be before invoice date.");
        }

        if (isNaN(invoiceAmount) || invoiceAmount <= 0) {
          throw new Error("Invoice amount must be greater than zero.");
        }

        const financialYear = getFinancialYear(invoiceDate);

        const summary = calculateInvoice({
          invoiceAmount,
          gstNumber: taxSettings.gstNumber,
          tdsApplicable: taxSettings.tdsApplicable,
          deductionAmount,
          otherCharges,
        });

        if (csvInvoiceNumbers.has(invoiceNumber)) {
          throw new Error("Duplicate invoice number found in CSV.");
        }

        csvInvoiceNumbers.add(invoiceNumber);
        existingInvoiceNumbers.add(invoiceNumber);

        invoicesToInsert.push({
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
      } catch (err) {
        errors.push({
          row: index + 2,
          error: err.message,
        });
      }
    }

    if (invoicesToInsert.length) {
      await db.insert(invoices).values(invoicesToInsert);

      imported = invoicesToInsert.length;
      revalidatePath("/invoices");
      revalidatePath(`/clients/${clientId}`);
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
