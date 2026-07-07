import { NextResponse } from "next/server";

import { db } from "@/db";

import { invoices, clients } from "@/db/schema";

import { and, asc, eq, isNull } from "drizzle-orm";

export async function GET(req) {
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

    const data = await db
      .select({
        invoiceNumber: invoices.invoiceNumber,

        financialYear: invoices.financialYear,

        invoiceDate: invoices.invoiceDate,

        dueDate: invoices.dueDate,

        invoiceAmount: invoices.invoiceAmount,

        basicAmount: invoices.basicAmount,

        cgstAmount: invoices.cgstAmount,

        sgstAmount: invoices.sgstAmount,

        igstAmount: invoices.igstAmount,

        tdsAmount: invoices.tdsAmount,

        deductionAmount: invoices.deductionAmount,

        otherCharges: invoices.otherCharges,

        netPayableAmount: invoices.netPayableAmount,

        status: invoices.status,

        notes: invoices.notes,

        companyName: clients.companyName,
      })
      .from(invoices)
      .leftJoin(clients, eq(clients.id, invoices.clientId))
      .where(and(eq(invoices.clientId, clientId), isNull(invoices.deletedAt)))
      .orderBy(asc(invoices.invoiceDate));

    const rows = [
      [
        "Invoice Number",
        "Financial Year",
        "Invoice Date",
        "Due Date",
        "Invoice Amount",
        "Basic Amount",
        "CGST",
        "SGST",
        "IGST",
        "TDS",
        "Deduction",
        "Other Charges",
        "Net Payable",
        "Status",
        "Notes",
      ],
    ];

    for (const item of data) {
      rows.push([
        item.invoiceNumber,

        item.financialYear,

        item.invoiceDate
          ? new Date(item.invoiceDate).toISOString().split("T")[0]
          : "",

        item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "",

        item.invoiceAmount,

        item.basicAmount,

        item.cgstAmount,

        item.sgstAmount,

        item.igstAmount,

        item.tdsAmount,

        item.deductionAmount,

        item.otherCharges,

        item.netPayableAmount,

        item.status,

        item.notes ?? "",
      ]);
    }

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",

        "Content-Disposition": 'attachment; filename="client-invoices.csv"',
      },
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Failed to export invoices.",
      },
      {
        status: 500,
      },
    );
  }
}
