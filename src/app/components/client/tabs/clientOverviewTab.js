import Link from "next/link";

export default function ClientOverviewTab({ client, invoices = [] }) {
  // =====================================
  // RECENT INVOICES
  // =====================================

  const recentInvoices = invoices.slice(0, 5);

  // =====================================
  // OUTSTANDING
  // =====================================

  const totalOutstanding = invoices.reduce(
    (sum, item) => sum + Number(item.due || 0),
    0,
  );

  // =====================================
  // OVERDUE
  // =====================================

  const overdueInvoices = invoices.filter((invoice) => invoice.isOverdue);

  return (
    <div className="space-y-4">
      {/* ===================================== */}
      {/* RECENT INVOICES */}
      {/* ===================================== */}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Recent Invoices
            </h2>
          </div>

          <Link
            href={`?tab=invoices`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All
          </Link>
        </div>

        {/* TABLE */}
        <div>
          {recentInvoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              No invoices found.
            </div>
          ) : (
            recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="
                  grid
                  grid-cols-[1.6fr_150px_130px_150px_180px_120px_50px]
                  items-center
                  gap-2
                  border-b border-zinc-100
                  px-5 py-2
                  transition-all
                  hover:bg-blue-50/40
                "
              >
                {/* ===================================== */}
                {/* Invoice */}
                {/* ===================================== */}

                <div>
                  <div className="font-semibold text-blue-600">
                    {invoice.invoiceNumber}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    <span>FY {invoice.financialYear}</span>

                    <span className="text-pink-400">•</span>

                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-medium">
                      {invoice.awbCount} AWB{invoice.awbCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* ===================================== */}
                {/* Net Payable */}
                {/* ===================================== */}

                <div>
                  <div className="font-semibold text-zinc-800">
                    ₹{Number(invoice.netPayableAmount).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* ===================================== */}
                {/* Paid */}
                {/* ===================================== */}

                <div>
                  <div className="font-semibold text-emerald-600">
                    ₹{Number(invoice.paid).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* ===================================== */}
                {/* Balance Due */}
                {/* ===================================== */}

                <div>
                  <div
                    className={`font-semibold ${
                      invoice.due > 0 ? "text-orange-600" : "text-emerald-600"
                    }`}
                  >
                    ₹{Number(invoice.due).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* ===================================== */}
                {/* Due Date */}
                {/* ===================================== */}

                <div>
                  <div className="font-medium text-zinc-800">
                    {invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString("en-IN")
                      : "-"}
                  </div>

                  {invoice.dueDaysText && (
                    <div
                      className={`mt-1 text-xs ${
                        invoice.isOverdue ? "text-red-600" : "text-zinc-500"
                      }`}
                    >
                      {invoice.dueDaysText}
                    </div>
                  )}
                </div>

                {/* ===================================== */}
                {/* Status */}
                {/* ===================================== */}

                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      invoice.status === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : invoice.status === "partial"
                          ? "bg-orange-100 text-orange-700"
                          : invoice.status === "overdue"
                            ? "bg-red-100 text-red-700"
                            : invoice.status === "disputed"
                              ? "bg-pink-100 text-pink-700"
                              : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {invoice.status.charAt(0).toUpperCase() +
                      invoice.status.slice(1)}
                  </span>
                </div>

                {/* ===================================== */}
                {/* Arrow */}
                {/* ===================================== */}

                <div className="flex justify-end text-zinc-400 text-xl">→</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
