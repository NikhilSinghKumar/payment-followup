import { getClients } from "../../actions/client";
import Link from "next/link";
import ImportBox from "../../components/ImportClients";
import SearchBox from "../../components/SearchBox";
import ClientAlphabetDropdown from "../../components/client/ClientAlphabetDropdown";
import DeleteInvoiceButton from "../../components/DeleteInvoiceButton";

export default async function ClientsPage({ searchParams }) {
  const resolvedParams = await searchParams;

  const query = resolvedParams?.q || "";
  const letter = resolvedParams?.letter || resolvedParams?.alphabet || "ALL";

  const data = await getClients(query, letter);

  return (
    <div className="space-y-4">
      {/* Top Search, A-Z Filter & Actions Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-2 lg:max-w-lg">
          <div className="flex-1 min-w-0">
            <SearchBox />
          </div>
          <div className="shrink-0">
            <ClientAlphabetDropdown />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ImportBox />

          <a
            href="/api/import-client-sample"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Sample (CSV)
          </a>

          <a
            href="/api/export-clients"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Export Clients
          </a>

          <Link
            href="/clients/new"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 text-xs font-medium text-white shadow-xs transition hover:from-blue-500 hover:to-indigo-500"
          >
            + Add Client
          </Link>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <div className="min-w-[880px]">
            {/* Header */}
            <div className="grid grid-cols-[50px_3fr_110px_160px_80px_100px_150px] items-center border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
              <div>S.N.</div>
              <div>Company</div>
              <div>Code</div>
              <div className="text-center">GST No.</div>
              <div className="text-center">TDS</div>
              <div className="text-center">Status</div>
              <div className="text-center">Actions</div>
            </div>

            {/* Rows */}
            {data.length > 0 ? (
              data.map((c, index) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[50px_3fr_110px_160px_80px_100px_150px] items-center border-b border-zinc-100 px-4 py-2 text-xs transition-colors hover:bg-zinc-50/80 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
                >
                  {/* S.N */}
                  <div className="font-medium text-zinc-600 dark:text-zinc-400">
                    {index + 1}
                  </div>

                  {/* Company */}
                  <div className="font-medium text-zinc-800 truncate pr-3 dark:text-zinc-200">
                    {c.companyName}
                  </div>

                  {/* Code */}
                  <div className="font-mono text-zinc-500 dark:text-zinc-400">
                    {c.companyCode}
                  </div>

                  {/* GST */}
                  <div className="text-center font-mono text-zinc-500 dark:text-zinc-400">
                    {c.gstNumber || "—"}
                  </div>

                  {/* TDS */}
                  <div className="text-center text-zinc-600 dark:text-zinc-400">
                    {c.tdsApplicable ? "Yes" : "No"}
                  </div>

                  {/* Status */}
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-1.5">
                    <Link
                      href={`/clients/${c.id}`}
                      className="h-7 px-2.5 inline-flex items-center justify-center rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900"
                    >
                      View
                    </Link>

                    <Link
                      href={`/clients/${c.id}/edit`}
                      className="h-7 px-2.5 inline-flex items-center justify-center rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-zinc-400 text-xs">
                No clients found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
