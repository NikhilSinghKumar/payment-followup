import { db } from "@/db";
import { invoices, clients } from "@/db/schema";
import { calculateInvoice } from "@/lib/invoice-calculator";
import { getClientTaxSettings } from "@/lib/client-tax-settings";
import { getFinancialYear } from "@/lib/financial-year";

import { parse } from "csv-parse/sync";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";

export async function POST(req) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!currentUser.companyId) {
      return Response.json(
        { error: "User is not associated with any company." },
        { status: 400 },
      );
    }

    const companyId = currentUser.companyId;

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
      try {
        //------------------------------------
        // Read CSV
        //------------------------------------

        const companyCode = row.company_code?.trim();

        const invoiceNumber = row.invoice_number?.trim();

        const invoiceDate = row.invoice_date
          ? new Date(row.invoice_date)
          : null;

        const dueDate = row.due_date ? new Date(row.due_date) : null;

        const paymentTerms = row.payment_terms
          ? parseInt(row.payment_terms)
          : null;

        const invoiceAmount = parseFloat(
          (row.invoice_amount || "0").replace(/,/g, ""),
        );

        const deductionAmount = parseFloat(
          (row.deduction_amount || "0").replace(/,/g, ""),
        );

        const otherCharges = parseFloat(
          (row.other_charges || "0").replace(/,/g, ""),
        );

        const notes = row.notes?.trim() || "";

        //------------------------------------
        // Validation
        //------------------------------------

        if (
          !companyCode ||
          !invoiceNumber ||
          !invoiceDate ||
          !dueDate ||
          isNaN(invoiceAmount)
        ) {
          skipped++;
          continue;
        }

        //------------------------------------
        // Financial Year
        //------------------------------------

        const financialYear = getFinancialYear(invoiceDate);

        //------------------------------------
        // Find Client
        //------------------------------------

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

        //------------------------------------
        // Duplicate Check
        //------------------------------------

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

        if (existing.length) {
          skipped++;
          continue;
        }

        //------------------------------------
        // Tax Settings
        //------------------------------------

        const taxSettings = await getClientTaxSettings(clientId);

        //------------------------------------
        // Calculate Invoice
        //------------------------------------

        const calculatedInvoice = calculateInvoice({
          invoiceAmount,
          gstNumber: taxSettings.gstNumber,
          tdsApplicable: taxSettings.tdsApplicable,
          deductionAmount,
          otherCharges,
        });

        //------------------------------------
        // Insert
        //------------------------------------

        await db.insert(invoices).values({
          companyId,

          clientId,

          financialYear,

          invoiceNumber,

          invoiceDate,

          dueDate,

          paymentTerms,

          invoiceAmount: calculatedInvoice.invoiceAmount,

          basicAmount: calculatedInvoice.basicAmount,

          cgstAmount: calculatedInvoice.cgstAmount,

          sgstAmount: calculatedInvoice.sgstAmount,

          igstAmount: calculatedInvoice.igstAmount,

          tdsAmount: calculatedInvoice.tdsAmount,

          deductionAmount: calculatedInvoice.deductionAmount,

          otherCharges: calculatedInvoice.otherCharges,

          netPayableAmount: calculatedInvoice.netPayableAmount,

          gstNumberUsed: calculatedInvoice.gstNumberUsed,

          tdsApplicableUsed: calculatedInvoice.tdsApplicableUsed,

          status: "pending",

          notes,
        });

        inserted++;
      } catch (err) {
        console.error("Invoice import failed:", row, err);
        skipped++;
      }
    }

    return Response.json({
      status: "success",
      summary: {
        inserted,
        skipped,
        total,
      },
    });
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        error: "Import failed",
      },
      {
        status: 500,
      },
    );
  }
}
