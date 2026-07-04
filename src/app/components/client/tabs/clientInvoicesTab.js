import Link from "next/link";

export default function ClientInvoicesTab({ clientId, invoices = [] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* TABLE HEADER */}
      <div className="grid grid-cols-[1.3fr_90px_90px_120px_120px_120px_120px_140px_100px] gap-3 border-b border-zinc-200 bg-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">
        <div>Invoice</div>
        <div>AWB Count</div>
        <div>FY</div>
        <div>Invoice Amount</div>
        <div>Net Payable</div>
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
            console.log(invoice);
            const outstanding = Number(invoice.due || 0);

            return (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="grid grid-cols-[1.3fr_90px_90px_120px_120px_120px_120px_140px_100px] gap-3 border-b border-zinc-100 px-4 py-3 text-sm transition hover:bg-blue-50/40"
              >
                {/* Invoice */}
                <div>
                  <div className="font-medium text-zinc-800">
                    {invoice.invoiceNumber}
                  </div>
                </div>
                {/* AWBs */}
                <div>
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                    {invoice.awbCount}
                  </span>
                </div>
                {/* FY */}
                <div className="text-zinc-600">{invoice.financialYear}</div>
                {/* Amount */}
                <div className="font-medium text-zinc-800">
                  ₹{Number(invoice.invoiceAmount).toLocaleString("en-IN")}
                </div>
                {/* Net Payable */}
                <div className="font-medium text-zinc-800">
                  ₹{Number(invoice.netPayableAmount).toLocaleString("en-IN")}
                </div>

                {/* Paid */}
                <div className="text-emerald-600">
                  ₹{Number(invoice.paid).toLocaleString("en-IN")}
                </div>
                {/* Outstanding */}
                <div
                  className={
                    outstanding > 0
                      ? "font-medium text-orange-600"
                      : "font-medium text-emerald-600"
                  }
                >
                  ₹{outstanding.toLocaleString("en-IN")}
                </div>
                {/* Due Date */}
                <div>
                  <div>
                    {invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString("en-IN")
                      : "-"}
                  </div>

                  {invoice.dueDaysText && (
                    <div
                      className={`text-xs ${
                        invoice.isOverdue ? "text-red-600" : "text-zinc-500"
                      }`}
                    >
                      {invoice.dueDaysText}
                    </div>
                  )}
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
  );
}
