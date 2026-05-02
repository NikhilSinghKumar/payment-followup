import { getClients } from "../actions/client";
import Link from "next/link";
import ImportBox from "../components/ImportClients";

export default async function ClientsPage() {
  const data = await getClients();

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      {/* Gradient Accent Top Bar */}
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-6" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-800">Clients</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage and view all your clients
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ImportBox />

          <Link
            href="/clients/new"
            className="
              h-[40px] px-4 flex items-center rounded-lg 
              text-white text-sm font-medium
              bg-gradient-to-r from-blue-500 to-purple-500
              shadow-md hover:shadow-lg 
              transition-all duration-200
              hover:scale-[1.03]
            "
          >
            + Add Client
          </Link>

          <Link
            href="/invoices"
            className="
              h-[40px] px-4 flex items-center rounded-lg 
              text-white text-sm font-medium
              bg-gradient-to-r from-blue-500 to-purple-500
              shadow-md hover:shadow-lg 
              transition-all duration-200
              hover:scale-[1.03]
            "
          >
            Invoices
          </Link>
        </div>
      </div>

      {/* Card Container */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-zinc-200 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-4 px-5 py-3 text-sm font-semibold text-zinc-600 border-b-2 border-gray-300">
          <div>S.N.</div>
          <div>Company</div>
          <div>Code</div>
        </div>

        {/* Rows */}
        {data.length > 0 ? (
          data.map((c, index) => (
            <div
              key={c.id}
              className="
                grid grid-cols-4 px-5 py-3 text-sm
                border-b border-gray-200 last:border-none
                hover:bg-gradient-to-r hover:from-blue-50 hover:to-pink-50
                transition-all duration-150
              "
            >
              <div className="font-medium text-zinc-800">{index + 1}</div>
              <div className="font-medium text-zinc-800">{c.companyName}</div>
              <div className="text-zinc-500">{c.companyCode}</div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-zinc-400">No clients found.</div>
        )}
      </div>
    </div>
  );
}
