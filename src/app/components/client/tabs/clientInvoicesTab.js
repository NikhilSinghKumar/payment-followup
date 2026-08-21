import Link from "next/link";
import DownloadInvoiceSample from "../../invoice/DownloadInvoiceSample";
import ImportInvoices from "../../invoice/ImportInvoices";
import ExportInvoices from "../../invoice/ExportInvoices";

export default function ClientInvoicesTab({ clientId, invoices = [] }) {
  return (
    <div className="space-y-4">
      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex items-center justify-between">
        <div className="flex items-center justify-end gap-2">
          <ExportInvoices clientId={clientId} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[760px] table-auto border-collapse">
            {/* TABLE HEADER */}
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                <th className="px-4 py-3">Invoice</th>
                <th className="whitespace-nowrap px-3 py-3">FY</th>
                <th className="whitespace-nowrap px-3 py-3 text-right">
                  Invoice Amount
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right">
                  Net Payable
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right">Paid</th>
                <th className="whitespace-nowrap px-3 py-3 text-right">
                  Outstanding
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right">
                  Due Date
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center">
                  Status
                </th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-sm text-zinc-500"
                  >
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const outstanding = Number(invoice.outstandingAmount || 0);

                  return (
                    <tr
                      key={invoice.id}
                      className="cursor-pointer border-b border-zinc-100 text-sm transition hover:bg-blue-50/40"
                    >
                      {/* Invoice */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="block font-medium text-zinc-800"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>

                      {/* FY */}
                      <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="block"
                        >
                          {invoice.financialYear}
                        </Link>
                      </td>

                      {/* Invoice Amount */}
                      <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-800">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="block"
                        >
                          ₹
                          {Number(invoice.invoiceAmount).toLocaleString(
                            "en-IN",
                          )}
                        </Link>
                      </td>

                      {/* Net Payable */}
                      <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-zinc-800">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="block"
                        >
                          ₹
                          {Number(invoice.netPayableAmount).toLocaleString(
                            "en-IN",
                          )}
                        </Link>
                      </td>

                      {/* Paid */}
                      <td className="whitespace-nowrap px-3 py-3 text-right text-emerald-600">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="block"
                        >
                          ₹
                          {Number(invoice.paidAmount || 0).toLocaleString(
                            "en-IN",
                          )}
                        </Link>
                      </td>

                      {/* Outstanding */}
                      <td
                        className={`whitespace-nowrap px-3 py-3 text-right font-medium ${
                          outstanding > 0
                            ? "text-orange-600"
                            : "text-emerald-600"
                        }`}
                      >
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="block"
                        >
                          ₹{outstanding.toLocaleString("en-IN")}
                        </Link>
                      </td>

                      {/* Due Date */}
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="block"
                        >
                          <div>
                            {invoice.dueDate
                              ? new Date(invoice.dueDate).toLocaleDateString(
                                  "en-IN",
                                )
                              : "-"}
                          </div>

                          {invoice.dueDaysText && (
                            <div
                              className={`text-xs ${
                                invoice.isOverdue
                                  ? "text-red-600"
                                  : "text-zinc-500"
                              }`}
                            >
                              {invoice.dueDaysText}
                            </div>
                          )}
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="block"
                        >
                          <span
                            className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
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
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
