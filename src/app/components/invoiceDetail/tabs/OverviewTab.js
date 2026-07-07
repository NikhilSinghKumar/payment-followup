export default function OverviewTab({ invoice }) {
  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="space-y-6">
      {/* Invoice Information */}
      <section className="rounded-xl border border-zinc-200">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3">
          <h3 className="font-semibold text-zinc-800">Invoice Information</h3>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2 lg:grid-cols-4">
          <InfoItem label="Invoice Number" value={invoice.invoiceNumber} />

          <InfoItem label="Financial Year" value={invoice.financialYear} />

          <InfoItem label="Client" value={invoice.companyName} />

          <InfoItem label="GST Number" value={invoice.gstNumber || "-"} />

          <InfoItem
            label="Invoice Date"
            value={formatDate(invoice.invoiceDate)}
          />

          <InfoItem
            label="From Date"
            value={formatDate(invoice.invoiceFromDate)}
          />

          <InfoItem label="To Date" value={formatDate(invoice.invoiceToDate)} />

          <InfoItem label="Due Date" value={formatDate(invoice.dueDate)} />

          <InfoItem label="Status" value={invoice.status} />
        </div>
      </section>

      {/* Amount Breakdown */}
      <section className="rounded-xl border border-zinc-200">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3">
          <h3 className="font-semibold text-zinc-800">Amount Breakdown</h3>
        </div>

        <div className="p-5">
          <AmountRow
            label="Invoice Amount"
            value={money(invoice.invoiceAmount)}
          />

          <AmountRow
            label={`GST (${invoice.gstPercentage || 0}%)`}
            value={money(invoice.gstAmount)}
            positive
          />

          <AmountRow
            label={`TDS (${invoice.tdsPercentage || 0}%)`}
            value={money(invoice.tdsAmount)}
            negative
          />

          <AmountRow
            label="Deduction"
            value={money(invoice.deductionAmount)}
            negative
          />

          <AmountRow
            label="Other Charges"
            value={money(invoice.otherCharges)}
            positive
          />

          <div className="my-3 border-t border-dashed border-zinc-300" />

          <AmountRow
            label="Net Payable"
            value={money(invoice.netPayableAmount)}
            total
          />
        </div>
      </section>

      {/* Payment Summary */}
      <section className="rounded-xl border border-zinc-200">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3">
          <h3 className="font-semibold text-zinc-800">Payment Summary</h3>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-3">
          <InfoItem label="Paid Amount" value={money(invoice.paid)} />

          <InfoItem label="Outstanding" value={money(invoice.due)} />

          <InfoItem
            label="Payment %"
            value={`${Number(invoice.paymentPercentage || 0).toFixed(2)}%`}
          />
        </div>

        <div className="px-5 pb-5">
          <div className="h-3 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${Math.min(
                  Number(invoice.paymentPercentage || 0),
                  100,
                )}%`,
              }}
            />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-zinc-200">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3">
          <h3 className="font-semibold text-zinc-800">Notes</h3>
        </div>

        <div className="p-5 whitespace-pre-wrap text-zinc-700">
          {invoice.notes || "No notes available."}
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium text-zinc-800">
        {value || "-"}
      </div>
    </div>
  );
}

function AmountRow({ label, value, positive, negative, total }) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${
        total ? "text-lg font-semibold" : "text-sm"
      }`}
    >
      <span className="text-zinc-700">{label}</span>

      <span
        className={
          total
            ? "font-bold text-zinc-900"
            : positive
              ? "text-emerald-600"
              : negative
                ? "text-red-600"
                : "text-zinc-800"
        }
      >
        {positive && "+"}
        {negative && "-"}
        {value}
      </span>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN");
}
