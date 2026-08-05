export default function ClientSummaryCard({ summary }) {
  if (!summary) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <h3 className="mb-4 text-lg font-semibold">Client Summary</h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryItem label="Invoices" value={summary.totalInvoices} />

        <SummaryItem
          label="Outstanding"
          value={`₹${Number(summary.outstandingAmount).toLocaleString()}`}
        />

        <SummaryItem
          label="Overdue"
          value={`₹${Number(summary.overdueAmount).toLocaleString()}`}
        />

        <SummaryItem label="Overdue Invoices" value={summary.overdueInvoices} />
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>

      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
