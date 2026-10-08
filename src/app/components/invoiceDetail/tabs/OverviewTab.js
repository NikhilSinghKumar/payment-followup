import { formatDateDisplay } from "@/lib/date-parser";

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

        <section className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Invoice Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4 sm:p-5">
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

        <section className="rounded-xl border border-zinc-200 bg-zinc-50/70 h-fit shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="border-b border-zinc-200 bg-zinc-100/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/60">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Invoice Amount Breakdown
            </h3>
          </div>

          <div className="p-4 space-y-1.5">
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
    <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/30">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 font-medium">
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
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
  return formatDateDisplay(date);
}
