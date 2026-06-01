import Link from "next/link";

export default function ClientInvoicesTab({ invoices = [] }) {
  return (
    <div className="space-y-4">
      {/* ===================================== */}
      {/* FILTER BAR */}
      {/* ===================================== */}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {/* Search */}
          <input placeholder="Search invoice..." className="input-primary" />

          {/* FY */}
          <select className="input-primary">
            <option>All Financial Years</option>
            <option>2025-26</option>
            <option>2024-25</option>
          </select>

          {/* Status */}
          <select className="input-primary">
            <option>All Status</option>
            <option>Pending</option>
            <option>Partial</option>
            <option>Paid</option>
            <option>Disputed</option>
          </select>

          {/* Date */}
          <input type="date" className="input-primary" />
        </div>
      </div>

      {/* ===================================== */}
      {/* INVOICE TABLE */}
      {/* ===================================== */}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* TABLE HEADER */}
        <div className="grid grid-cols-[1.2fr_120px_90px_120px_120px_120px_120px_100px] gap-3 border-b border-zinc-200 bg-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">
          <div>Invoice</div>
          <div>FY</div>
          <div>AWB Count</div>
          <div>Amount</div>
          <div>Paid</div>
          <div>Outstanding</div>
          <div>Due Date</div>
          <div>Status</div>
        </div>

        {/* TABLE BODY */}
        <div>
          {invoices.length === 0 ? (
            <div className="p-10 text-center text-sm text-zinc-500">
              No invoices found.
            </div>
          ) : (
            invoices.map((invoice) => {
              const outstanding = Number(invoice.outstandingAmount || 0);

              const isOverdue =
                invoice.dueDate &&
                new Date(invoice.dueDate) < new Date() &&
                outstanding > 0;

              return (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="grid grid-cols-[1.2fr_120px_90px_120px_120px_120px_120px_100px] gap-3 border-b border-zinc-100 px-4 py-3 text-sm transition hover:bg-blue-50/40"
                >
                  {/* Invoice */}
                  <div>
                    <div className="font-medium text-zinc-800">
                      {invoice.invoiceNumber}
                    </div>
                  </div>

                  {/* FY */}
                  <div className="text-zinc-600">{invoice.financialYear}</div>

                  {/* AWBs */}
                  <div>
                    <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                      {invoice.awbCount}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="font-medium text-zinc-800">
                    ₹{Number(invoice.amount).toLocaleString()}
                  </div>

                  {/* Paid */}
                  <div className="text-emerald-600">
                    ₹{Number(invoice.paidAmount).toLocaleString()}
                  </div>

                  {/* Outstanding */}
                  <div
                    className={
                      outstanding > 0
                        ? "font-medium text-orange-600"
                        : "font-medium text-emerald-600"
                    }
                  >
                    ₹{outstanding.toLocaleString()}
                  </div>

                  {/* Due Date */}
                  <div className="text-zinc-600">
                    {invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString()
                      : "-"}
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        invoice.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : invoice.status === "partial"
                            ? "bg-orange-100 text-orange-700"
                            : invoice.status === "disputed"
                              ? "bg-red-100 text-red-700"
                              : invoice.status === "pending" && isOverdue
                                ? "bg-rose-100 text-rose-700"
                                : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {invoice.status === "pending" && isOverdue
                        ? "overdue"
                        : invoice.status}
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
