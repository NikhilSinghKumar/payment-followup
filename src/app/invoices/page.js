import { getInvoices } from "../actions/invoice";
import Link from "next/link";
import ImportInvoices from "../components/ImportInvoices";
import SearchBox from "../components/SearchBox";
import FilterDropdown from "../components/FilterDropdown";

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

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-zinc-200 overflow-hidden">
        <div className="grid grid-cols-6 px-5 py-3 text-sm font-semibold text-zinc-600 border-gray-300 border-b-2">
          <div>Company</div>
          <div>Amount</div>
          <div>Paid</div>
          <div>Due</div>
          <div>Due Date</div>
          <div>Status</div>
        </div>

        {data.length > 0 ? (
          data.map((inv) => {
            let isOverdue = false;
            let formattedDate = "—";

            if (inv.dueDate) {
              const due = new Date(inv.dueDate);
              due.setHours(0, 0, 0, 0);

              isOverdue = due < today;
              formattedDate = due.toLocaleDateString("en-IN");
            }

            const formattedAmount = new Intl.NumberFormat("en-IN").format(
              inv.amount,
            );

            return (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="grid grid-cols-6 px-5 py-3 text-sm border-b border-gray-200 last:border-none hover:bg-gradient-to-r hover:from-blue-50 hover:to-pink-50"
              >
                <div className="font-medium text-zinc-800">
                  {inv.companyName ?? "Unknown"}
                </div>

                <div className="font-medium text-zinc-800">
                  ₹{Number(inv.amount).toLocaleString("en-IN")}
                </div>

                <div className="text-green-600">
                  ₹{inv.paid.toLocaleString("en-IN")}
                </div>

                <div className="text-red-600 font-medium">
                  ₹{inv.due.toLocaleString("en-IN")}
                </div>

                <div className="font-medium text-zinc-800">{formattedDate}</div>

                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inv.status === "paid"
                        ? "bg-green-100 text-green-600"
                        : inv.status === "partial"
                          ? "bg-yellow-100 text-yellow-600"
                          : isOverdue
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="p-8 text-center text-zinc-400">
            No invoices found.
          </div>
        )}
      </div>
    </div>
  );
}
