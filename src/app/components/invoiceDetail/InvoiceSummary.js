export default function InvoiceSummary({ data }) {
  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        {/* LEFT */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-semibold text-white">
              {data.companyName?.charAt(0)}
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-zinc-800">
                {data.companyName}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                <span>{data.invoiceNumber}</span>
                <span className="text-pink-400 font-extrabold">•</span>
                <span>{data.financialYear}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
            <SummaryItem
              label="Invoice Amount"
              value={`₹${Number(data.amount).toLocaleString("en-IN")}`}
            />

            <SummaryItem
              label="Paid"
              value={`₹${Number(data.totalPaid).toLocaleString("en-IN")}`}
            />

            <SummaryItem
              label="Outstanding"
              value={`₹${Number(data.outstanding).toLocaleString("en-IN")}`}
            />

            {/* STATUS */}
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Status
              </div>

              <div className="mt-1">
                <StatusBadge status={data.status} />
              </div>
            </div>

            {/* DUE DATE */}
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Due Date
              </div>

              <div className="mt-1 text-lg font-semibold text-zinc-800">
                {data.dueDate
                  ? new Date(data.dueDate).toLocaleDateString("en-IN")
                  : "-"}
              </div>
            </div>
          </div>
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
        : status === "disputed"
          ? "bg-red-100 text-red-700"
          : "bg-zinc-100 text-zinc-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${color}`}
    >
      {status}
    </span>
  );
}
