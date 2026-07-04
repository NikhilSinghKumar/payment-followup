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
      {/* TOP GRID */}
      {/* ===================================== */}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ===================================== */}
        {/* CLIENT INFO */}
        {/* ===================================== */}

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Recent Activities
            </h2>
          </div>

          <div className="space-y-4">
            {/* Company */}
            <div>
              <p className="text-xs text-zinc-500">------</p>

              <p className="mt-1 font-medium text-zinc-800">--------</p>
            </div>

            {/* Code */}
            <div>
              <p className="text-xs text-zinc-500">--------</p>

              <p className="mt-1 font-medium text-zinc-800">-------</p>
            </div>

            {/* GST */}
            <div>
              <p className="text-xs text-zinc-500">------</p>

              <p className="mt-1 font-medium text-zinc-800">----------</p>
            </div>

            {/* Address */}
            <div>
              <p className="text-xs text-zinc-500">------</p>

              <p className="mt-1 text-sm text-zinc-700">------------</p>
            </div>
          </div>
        </div>

        {/* ===================================== */}
        {/* OUTSTANDING SUMMARY */}
        {/* ===================================== */}

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Outstanding Summary
            </h2>
          </div>

          <div className="space-y-4">
            {/* Total Outstanding */}
            <div className="rounded-xl bg-orange-50 p-4">
              <p className="text-xs uppercase tracking-wide text-orange-600">
                Total Outstanding
              </p>

              <h3 className="mt-2 text-2xl font-semibold text-orange-700">
                ₹{totalOutstanding.toLocaleString()}
              </h3>
            </div>

            {/* Overdue Count */}
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs uppercase tracking-wide text-red-600">
                Overdue Invoices
              </p>

              <h3 className="mt-2 text-2xl font-semibold text-red-700">
                {overdueInvoices.length}
              </h3>
            </div>
          </div>
        </div>

        {/* ===================================== */}
        {/* QUICK ACTIONS */}
        {/* ===================================== */}

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Quick Actions
            </h2>
          </div>

          <div className="grid gap-3">
            <Link
              href="/invoices/new"
              className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3 text-sm font-medium text-white transition hover:shadow-md"
            >
              + Create Invoice
            </Link>

            <button className="rounded-xl border border-zinc-200 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
              + Add Followup
            </button>

            <button className="rounded-xl border border-zinc-200 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
              + Add Contact
            </button>

            <button className="rounded-xl border border-zinc-200 px-4 py-3 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
              + Add Location
            </button>
          </div>
        </div>
      </div>

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
            recentInvoices.map((invoice) => {
              const outstanding = Number(invoice.due || 0);

              return (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="grid grid-cols-[1.2fr_120px_120px_120px_100px] gap-3 border-b border-zinc-100 px-5 py-4 text-sm transition hover:bg-zinc-50"
                >
                  {/* Invoice */}
                  <div>
                    <div className="font-medium text-zinc-800">
                      {invoice.invoiceNumber}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      {invoice.financialYear}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="font-medium text-zinc-800">
                    ₹{Number(invoice.invoiceAmount).toLocaleString()}
                  </div>

                  {/* Paid */}
                  <div className="text-emerald-600">
                    ₹{Number(invoice.paid).toLocaleString()}
                  </div>

                  {/* Outstanding */}
                  <div className="font-medium text-orange-600">
                    ₹{Number(invoice.due).toLocaleString("en-IN")}
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
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
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
