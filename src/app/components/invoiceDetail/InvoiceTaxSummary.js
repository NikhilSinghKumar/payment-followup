import { getGstAppliedText, getTdsAppliedText } from "@/lib/tax-display";

export default function InvoiceTaxSummary({ data }) {
  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-800">Tax Breakdown</h2>

        <p className="text-sm text-zinc-500">Invoice calculation details</p>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
        <SummaryRow
          label="Invoice Amount"
          value={formatCurrency(data.invoiceAmount)}
        />

        <SummaryRow
          label="Basic Amount"
          value={formatCurrency(data.basicAmount)}
        />

        <SummaryRow label="CGST" value={formatCurrency(data.cgstAmount)} />

        <SummaryRow label="SGST" value={formatCurrency(data.sgstAmount)} />

        <SummaryRow label="IGST" value={formatCurrency(data.igstAmount)} />

        <SummaryRow label="TDS" value={formatCurrency(data.tdsAmount)} />

        <SummaryRow
          label="Deduction"
          value={formatCurrency(data.deductionAmount)}
        />

        <SummaryRow
          label="Other Charges"
          value={formatCurrency(data.otherCharges)}
        />

        <div className="col-span-2">
          <hr className="my-2 border-zinc-200" />
        </div>

        <div className="col-span-2">
          <SummaryRow
            label="Net Payable"
            value={formatCurrency(data.netPayableAmount)}
            highlight
          />
        </div>

        <div className="col-span-2">
          <hr className="my-4 border-zinc-200" />
        </div>

        <div className="col-span-2 rounded-lg bg-zinc-50 border border-zinc-200 p-4">
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">
            Tax Rules Applied
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">GST Applied</span>

              <span className="font-medium text-zinc-800">
                {getGstAppliedText(data.gstNumberUsed)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">TDS Applied</span>

              <span className="font-medium text-zinc-800">
                {getTdsAppliedText(data.tdsApplicableUsed)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-600">{label}</span>

      <span
        className={`font-medium ${
          highlight ? "text-blue-600 text-lg" : "text-zinc-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
