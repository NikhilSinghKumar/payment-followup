import { getInvoices } from "../actions/invoice";
import Link from "next/link";
import ImportInvoices from "../components/ImportInvoices";
import SearchBox from "../components/SearchBox";
import FilterDropdown from "../components/FilterDropdown";
import DeleteInvoiceButton from "../components/DeleteInvoiceButton";

export default async function InvoicePage({ searchParams }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams?.q || "";
  const status = resolvedParams?.status || "";
  const data = await getInvoices(query, status);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-800">Invoices</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Track, manage, and import your invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SearchBox />
          <FilterDropdown />
          <ImportInvoices />

          <Link
            href="/invoices/new"
            className="h-[40px] px-4 flex items-center rounded-lg text-white text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.03]"
          >
            + Add Invoice
          </Link>

          <Link
            href="/clients"
            className="h-[40px] px-4 flex items-center rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 border border-zinc-300 text-white hover:bg-zinc-100 hover:scale-[1.03] transition"
          >
            Client List
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div
          className="
            grid
            grid-cols-[80px_2fr_1fr_1fr_1fr_1.2fr_1fr_260px]
            items-center
            px-5 py-3
            bg-zinc-50
            border-b border-zinc-200
            text-sm font-semibold text-zinc-600
          "
        >
          <div>S.N.</div>
          <div>Company</div>
          <div>Amount</div>
          <div>Paid</div>
          <div>Due</div>
          <div>Due Date</div>
          <div>Status</div>

          <div className="text-center">Actions</div>
        </div>

        {/* Rows */}
        {data.length > 0 ? (
          data.map((inv, index) => {
            let isOverdue = false;
            let formattedDate = "—";

            if (inv.dueDate) {
              const due = new Date(inv.dueDate);
              due.setHours(0, 0, 0, 0);

              isOverdue = due < today;
              formattedDate = due.toLocaleDateString("en-IN");
            }

            return (
              <div
                key={inv.id}
                className="
            grid
            grid-cols-[80px_2.2fr_0.9fr_0.9fr_0.9fr_1.1fr_1fr_260px]
            items-center
            px-5 py-3
            text-sm
            border-b border-zinc-100
            hover:bg-zinc-50
            transition-colors
          "
              >
                <div className="font-medium text-zinc-800 truncate pr-4">
                  {index + 1}
                </div>
                {/* Company */}
                <div className="font-medium text-zinc-800 truncate pr-4">
                  {inv.companyName ?? "Unknown"}
                </div>

                {/* Amount */}
                <div className="font-medium text-zinc-800 whitespace-nowrap">
                  ₹{Number(inv.amount).toLocaleString("en-IN")}
                </div>

                {/* Paid */}
                <div className="font-medium text-emerald-600 whitespace-nowrap">
                  ₹{Number(inv.paid).toLocaleString("en-IN")}
                </div>

                {/* Due */}
                <div className="font-medium text-red-600 whitespace-nowrap">
                  ₹{Number(inv.due).toLocaleString("en-IN")}
                </div>

                {/* Due Date */}
                <div className="text-zinc-700 whitespace-nowrap">
                  {formattedDate}
                </div>

                {/* Status */}
                <div>
                  <span
                    className={`
                inline-flex items-center justify-center
                min-w-[90px]
                px-3 py-1
                rounded-full
                text-xs font-semibold capitalize
                ${
                  inv.status === "paid"
                    ? "bg-emerald-100 text-emerald-700"
                    : inv.status === "partial"
                      ? "bg-amber-100 text-amber-700"
                      : inv.status === "pending" && isOverdue
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                }
              `}
                  >
                    {inv.status === "pending" && isOverdue
                      ? "Overdue"
                      : inv.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-2">
                  {/* View */}
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="
                h-8 px-3
                inline-flex items-center justify-center
                rounded-lg
                text-xs font-medium
                bg-blue-50 text-blue-700
                hover:bg-blue-100
                transition
              "
                  >
                    View
                  </Link>

                  {/* Edit */}
                  <Link
                    href={`/invoices/${inv.id}/edit`}
                    className="
                    h-8 px-3
                    inline-flex items-center justify-center
                    rounded-lg
                    text-xs font-medium
                    bg-amber-50 text-amber-700
                    hover:bg-amber-100
                    transition
                  "
                  >
                    Edit
                  </Link>

                  {/* Delete */}
                  <DeleteInvoiceButton invoiceId={inv.id} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-10 text-center text-zinc-400">
            No invoices found.
          </div>
        )}
      </div>
    </div>
  );
}
