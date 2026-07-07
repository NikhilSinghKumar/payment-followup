import { NextResponse } from "next/server";

export async function GET() {
  const rows = [
    [
      "Invoice Number",
      "Invoice Date",
      "Due Date",
      "Invoice Amount",
      "Deduction Amount",
      "Other Charges",
      "Notes",
    ],

    [
      "INV-1001",
      "2026-07-01",
      "2026-07-15",
      "50000",
      "1000",
      "250",
      "July Freight Invoice",
    ],
  ];

  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="invoice-import-sample.csv"',
    },
  });
}
