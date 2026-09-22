import { db } from "@/db";
import { clients, invoices, payments } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth";

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !currentUser.companyId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const companyId = currentUser.companyId;

  // 1. Fetch active clients for current company
  const clientList = await db
    .select()
    .from(clients)
    .where(and(eq(clients.companyId, companyId), isNull(clients.deletedAt)))
    .orderBy(clients.companyName);

  // 2. Fetch existing opening balance debit invoices
  const debitInvoices = await db
    .select({
      clientId: invoices.clientId,
      invoiceAmount: invoices.invoiceAmount,
      netPayableAmount: invoices.netPayableAmount,
      invoiceDate: invoices.invoiceDate,
      notes: invoices.notes,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.isOpeningBalance, true),
        isNull(invoices.deletedAt),
      ),
    );

  // 3. Fetch existing opening balance credit advance payments
  const creditPayments = await db
    .select({
      clientId: payments.clientId,
      amount: payments.amount,
      paymentDate: payments.paymentDate,
      notes: payments.notes,
    })
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        eq(payments.isOpeningBalance, true),
        eq(payments.isVoided, false),
        isNull(payments.deletedAt),
      ),
    );

  // Build lookups
  const debitMap = new Map();
  for (const inv of debitInvoices) {
    if (inv.clientId) {
      debitMap.set(inv.clientId, inv);
    }
  }

  const creditMap = new Map();
  for (const pay of creditPayments) {
    if (pay.clientId) {
      creditMap.set(pay.clientId, pay);
    }
  }

  function formatDate(d) {
    if (!d) return "";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return "";
      return dt.toISOString().split("T")[0];
    } catch {
      return "";
    }
  }

  // Header row - exactly matches import-clients specification
  const headers = [
    "company_name",
    "company_code",
    "gst_number",
    "email",
    "phone",
    "address",
    "tds_applicable",
    "tds_rate",
    "opening_balance",
    "opening_balance_type",
    "opening_balance_date",
    "opening_balance_notes",
  ];

  const rows = [headers];

  // Data rows
  clientList.forEach((client) => {
    const debit = debitMap.get(client.id);
    const credit = creditMap.get(client.id);

    let openingBalance = "0";
    let openingBalanceType = "DEBIT";
    let openingBalanceDate = "";
    let openingBalanceNotes = "";

    if (credit && Number(credit.amount) > 0) {
      openingBalance = Number(credit.amount).toFixed(2);
      openingBalanceType = "CREDIT";
      openingBalanceDate = formatDate(credit.paymentDate);
      openingBalanceNotes = credit.notes || "";
    } else if (
      debit &&
      Number(debit.invoiceAmount || debit.netPayableAmount || 0) > 0
    ) {
      openingBalance = Number(
        debit.invoiceAmount || debit.netPayableAmount || 0,
      ).toFixed(2);
      openingBalanceType = "DEBIT";
      openingBalanceDate = formatDate(debit.invoiceDate);
      openingBalanceNotes = debit.notes || "";
    }

    const tdsRateVal =
      client.tdsRate != null && !isNaN(Number(client.tdsRate))
        ? Number(client.tdsRate).toFixed(2)
        : "2.00";

    rows.push([
      client.companyName ?? "",
      client.companyCode ?? "",
      client.gstNumber ?? "",
      client.email ?? "",
      client.phone ?? "",
      client.address ?? "",
      client.tdsApplicable ? "true" : "false",
      tdsRateVal,
      openingBalance,
      openingBalanceType,
      openingBalanceDate,
      openingBalanceNotes,
    ]);
  });

  // Convert to CSV with standard quoting
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const todayStr = new Date().toISOString().split("T")[0];

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-export-${todayStr}.csv"`,
    },
  });
}
