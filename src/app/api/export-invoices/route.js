import { getInvoices } from "@/app/actions/invoice";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "high";
  const aging = searchParams.get("aging") || "";
  const financialYear = searchParams.get("financialYear") || "";
  const month = searchParams.get("month") || "";
  const minAmount = searchParams.get("minAmount") || "";
  const maxAmount = searchParams.get("maxAmount") || "";
  const alphabet = searchParams.get("alphabet") || "";

  const invoices = await getInvoices(
    query,
    status,
    sort,
    aging,
    financialYear,
    month,
    minAmount,
    maxAmount,
    alphabet,
  );

  // =========================
  // CSV HEADER
  // =========================

  const headers = [
    "Company Name",
    "GST No.",
    "Invoice Number",
    "Amount",
    "Paid",
    "Due",
    "Status",
    "Financial Year",
    "Due Date",
  ];

  // =========================
  // CSV ROWS
  // =========================

  const rows = invoices.map((inv) => [
    inv.companyName,
    inv.gstNumber,
    inv.invoiceNumber,
    inv.invoiceAmount,
    inv.paid,
    inv.due,
    inv.status,
    inv.financialYear,
    inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "",
  ]);

  // =========================
  // CSV CONTENT
  // =========================

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n",
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="invoices.csv"',
    },
  });
}
