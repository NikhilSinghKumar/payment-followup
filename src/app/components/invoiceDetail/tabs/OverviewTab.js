export default function OverviewTab({ invoice }) {
  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ============================== */}
        {/* Left : Invoice Information */}
        {/* ============================== */}

        <section className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2">
            <h3 className="font-semibold text-zinc-800">Invoice Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
            <InfoItem label="Invoice Number" value={invoice.invoiceNumber} />

            <InfoItem label="Financial Year" value={invoice.financialYear} />

            <InfoItem label="Client" value={invoice.companyName} />

            <InfoItem label="GST Number" value={invoice.gstNumberUsed || "-"} />

            <InfoItem
              label="Invoice Date"
              value={formatDate(invoice.invoiceDate)}
            />

            <InfoItem label="Due Date" value={formatDate(invoice.dueDate)} />

            <InfoItem
              label="GST Applicable"
              value={invoice.gstNumberUsed ? "Yes" : "No"}
            />

            <InfoItem
              label="TDS Applicable"
              value={invoice.tdsApplicableUsed ? "Yes" : "No"}
            />
          </div>
        </section>

        {/* ============================== */}
        {/* Right : Amount Summary */}
        {/* ============================== */}

        <section className="rounded-xl border border-zinc-200 bg-zinc-50 h-fit">
          <div className="border-b border-zinc-200 bg-zinc-100 px-4 py-3">
            <h3 className="font-semibold text-zinc-800">Invoice Amount</h3>
          </div>

          <div className="p-3 space-y-1">
            <AmountRow
              label="Invoice Amount"
              value={money(invoice.invoiceAmount)}
            />

            <AmountRow
              label="Basic Amount"
              value={money(invoice.basicAmount)}
            />

            <AmountRow
              label="CGST"
              value={money(invoice.cgstAmount)}
              positive
            />

            <AmountRow
              label="SGST"
              value={money(invoice.sgstAmount)}
              positive
            />

            <AmountRow
              label="IGST"
              value={money(invoice.igstAmount)}
              positive
            />

            <AmountRow label="TDS" value={money(invoice.tdsAmount)} negative />

            <AmountRow
              label="Deduction"
              value={money(invoice.deductionAmount)}
              negative
            />

            <AmountRow
              label="Other Charges"
              value={money(invoice.otherCharges)}
              negative
            />

            <div className="border-t border-dashed border-zinc-300 my-2" />

            <AmountRow
              label="Net Payable"
              value={money(invoice.netPayableAmount)}
              total
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500 font-medium">
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
      className={`flex items-center justify-between py-1 ${
        total ? "text-base font-semibold" : "text-sm"
      }`}
    >
      <span className="text-zinc-700">{label}</span>

      <span
        className={
          total
            ? "font-bold text-blue-600"
            : positive
              ? "text-emerald-600"
              : negative
                ? "text-red-600"
                : "text-zinc-800"
        }
      >
        {positive}
        {negative}
        {value}
      </span>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN");
}
