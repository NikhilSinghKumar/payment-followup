import SendInvoiceReminderModal from "@/app/components/reminder/SendInvoiceReminderModal";
import Link from "next/link";
import { Edit3 } from "lucide-react";

export default function InvoiceSummary({ data }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        {/* LEFT */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-semibold text-white">
              {data.companyName?.charAt(0)}
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
                {data.companyName}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                <span>{data.companyCode}</span>
                <span>•</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Invoice #{data.invoiceNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-6">
            <SummaryItem
              label="Invoice Amount"
              value={`₹${Number(data.invoiceAmount).toLocaleString("en-IN")}`}
            />

            <SummaryItem
              label="Net Payable"
              value={`₹${Number(data.netPayableAmount).toLocaleString("en-IN")}`}
            />

            <SummaryItem
              label="Paid"
              value={`₹${Number(data.paid).toLocaleString("en-IN")}`}
            />

            <SummaryItem
              label="Balance Due"
              value={`₹${Number(data.due).toLocaleString("en-IN")}`}
            />

            {/* STATUS */}
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Status
              </div>

              <div className="mt-1">
                <StatusBadge
                  status={data.isOverdue ? "overdue" : data.status}
                />
              </div>
            </div>

            {/* DUE DATE */}
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Due Date
              </div>

              <div className="mt-1 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
                {data.dueDate
                  ? new Date(data.dueDate).toLocaleDateString("en-IN")
                  : "-"}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          {Number(data.due || 0) > 0 && (
            <SendInvoiceReminderModal invoiceId={data.id} />
          )}
          <Link
            href={`/invoices/${data.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Edit3 size={13} />
            <span>Edit Invoice</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>

      <div className="mt-1 text-lg font-semibold text-zinc-800">{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const color =
    status === "paid"
      ? "bg-emerald-100 text-emerald-700"
      : status === "partial"
        ? "bg-orange-100 text-orange-700"
        : status === "overdue"
          ? "bg-red-100 text-red-700"
          : status === "disputed"
            ? "bg-pink-100 text-pink-700"
            : status === "cancelled"
              ? "bg-zinc-300 text-zinc-700"
              : "bg-blue-100 text-blue-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${color}`}
    >
      {status}
    </span>
  );
}
