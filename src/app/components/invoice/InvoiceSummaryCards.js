export default function InvoiceSummaryCards({ invoices }) {
  // =====================================
  // TOTAL OUTSTANDING
  // =====================================

  const outstandingAmount = invoices.reduce(
    (sum, inv) => sum + Number(inv.due),
    0,
  );

  // =====================================
  // OVERDUE AMOUNT
  // =====================================

  const overdueAmount = invoices
    .filter((inv) => inv.status !== "paid" && inv.dueDays > 0)
    .reduce((sum, inv) => sum + Number(inv.due), 0);

  // =====================================
  // INVOICE COUNT
  // =====================================

  const invoiceCount = invoices.length;

  // =====================================
  // CLIENT COUNT
  // =====================================

  const clientCount = new Set(invoices.map((inv) => inv.companyCode)).size;

  // =====================================
  // FORMATTER
  // =====================================

  const formatCurrency = (amount) =>
    Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });

  return (
    <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Outstanding */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Outstanding Amount</p>

        <h2 className="mt-2 text-3xl font-bold text-zinc-800">
          ₹{formatCurrency(outstandingAmount)}
        </h2>

        <p className="mt-2 text-xs text-zinc-400">Total receivables</p>
      </div>

      {/* Overdue */}
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 shadow-sm">
        <p className="text-sm font-medium text-red-600">Overdue Amount</p>

        <h2 className="mt-2 text-3xl font-bold text-red-700">
          ₹{formatCurrency(overdueAmount)}
        </h2>

        <p className="mt-2 text-xs text-red-500">Past due invoices</p>
      </div>

      {/* Invoices */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Invoices</p>

        <h2 className="mt-2 text-3xl font-bold text-zinc-800">
          {invoiceCount}
        </h2>

        <p className="mt-2 text-xs text-zinc-400">Total invoices</p>
      </div>

      {/* Clients */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Clients</p>

        <h2 className="mt-2 text-3xl font-bold text-zinc-800">{clientCount}</h2>

        <p className="mt-2 text-xs text-zinc-400">Active clients</p>
      </div>
    </div>
  );
}
