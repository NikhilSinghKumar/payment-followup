export default function InvoiceSummaryCard({ invoice }) {
  if (!invoice) return null;

  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="mb-4 text-lg font-semibold">Invoice Summary</h3>

      <div className="grid grid-cols-2 gap-4">
        <Info label="Invoice No." value={invoice.invoiceNumber} />

        <Info label="Sub Client" value={invoice.subClientName || "-"} />

        <Info
          label="Invoice Amount"
          value={`₹${Number(invoice.invoiceAmount).toLocaleString()}`}
        />

        <Info
          label="Outstanding"
          value={`₹${Number(invoice.due).toLocaleString()}`}
        />

        <Info label="Due Date" value={invoice.dueDate} />

        <Info label="Due Days" value={invoice.dueDays} />

        <Info label="Status" value={invoice.status} />
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
