import { getClients } from "../actions/client";
import Link from "next/link";
import ImportBox from "../components/ImportClients";
import SearchBox from "../components/SearchBox";
import DeleteInvoiceButton from "../components/DeleteInvoiceButton";

const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default async function ClientsPage({ searchParams }) {
  const resolvedParams = await searchParams;

  const query = resolvedParams?.q || "";
  const letter = resolvedParams?.letter || "ALL";

  const data = await getClients(query, letter);

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
          <SearchBox />
          <ImportBox />

          <Link
            href="/clients/new"
            className="
          h-10 px-4 inline-flex items-center justify-center
          rounded-xl text-white text-sm font-medium
          bg-gradient-to-r from-blue-500 to-purple-500
          shadow-md hover:shadow-lg
          transition-all duration-200
          hover:scale-[1.02]
        "
          >
            + Add Client
          </Link>

          <Link
            href="/invoices"
            className="
          h-10 px-4 inline-flex items-center justify-center
          rounded-xl text-white text-sm font-medium
          bg-gradient-to-r from-blue-500 to-purple-500
          shadow-md hover:shadow-lg
          transition-all duration-200
          hover:scale-[1.02]
        "
          >
            Invoice List
          </Link>
        </div>
      </div>

      {/* Alphabet Navigation */}
      <div className="flex flex-wrap justify-center gap-1 mb-5">
        <Link
          href={`/clients?q=${query}`}
          className={`
        px-3 py-1.5 rounded-lg text-sm font-medium transition-all
        ${
          letter === "ALL"
            ? "bg-blue-500 text-white shadow"
            : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
        }
      `}
        >
          All
        </Link>

        {ALPHABETS.map((char) => (
          <Link
            key={char}
            href={`/clients?letter=${char}&q=${query}`}
            className={`
          w-9 h-9 flex items-center justify-center
          rounded-lg text-sm font-medium transition-all
          ${
            letter === char
              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
          }
        `}
          >
            {char}
          </Link>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div
          className="
        grid grid-cols-[80px_1.5fr_180px_260px]
        items-center
        px-5 py-3
        bg-zinc-50
        border-b border-zinc-200
        text-sm font-semibold text-zinc-600
      "
        >
          <div>S.N.</div>
          <div>Company</div>
          <div>Code</div>

          <div className="text-center">Actions</div>
        </div>

        {/* Rows */}
        {data.length > 0 ? (
          data.map((c, index) => (
            <div
              key={c.id}
              className="
            grid grid-cols-[80px_1.5fr_180px_260px]
            items-center
            px-5 py-3
            text-sm
            border-b border-zinc-100
            hover:bg-zinc-50
            transition-colors
          "
            >
              {/* S.N */}
              <div className="font-medium text-zinc-700">{index + 1}</div>

              {/* Company */}
              <div className="font-medium text-zinc-800 truncate">
                {c.companyName}
              </div>

              {/* Code */}
              <div className="text-zinc-500 font-mono">{c.companyCode}</div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-2">
                {/* View */}
                <Link
                  href={`/clients/${c.id}`}
                  className="
                h-8 px-3 inline-flex items-center justify-center
                rounded-lg text-xs font-medium
                bg-blue-50 text-blue-700
                hover:bg-blue-100
                transition
              "
                >
                  View
                </Link>

                {/* Edit */}
                <Link
                  href={`/clients/${c.id}/edit`}
                  className="
                h-8 px-3 inline-flex items-center justify-center
                rounded-lg text-xs font-medium
                bg-amber-50 text-amber-700
                hover:bg-amber-100
                transition
              "
                >
                  Edit
                </Link>

                {/* Delete */}
                {/* <DeleteInvoiceButton /> */}
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 text-center text-zinc-400">
            No clients found.
          </div>
        )}
      </div>
    </div>
  );
}
