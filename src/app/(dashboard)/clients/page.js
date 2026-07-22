import { getClients } from "../../actions/client";
import Link from "next/link";
import ImportBox from "../../components/ImportClients";
import SearchBox from "../../components/SearchBox";
import DeleteInvoiceButton from "../../components/DeleteInvoiceButton";

const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default async function ClientsPage({ searchParams }) {
  const resolvedParams = await searchParams;

  const query = resolvedParams?.q || "";
  const letter = resolvedParams?.letter || "ALL";

  const data = await getClients(query, letter);

  return (
    <div className="h-full bg-zinc-50">
      {/* Gradient Accent Top Bar */}
      {/* <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-6" /> */}

      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center gap-2">
          <SearchBox />
          <ImportBox />
          <a
            href="/api/import-client-sample"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 text-sm text-blue-500 border border-zinc-200 text-zinc-600 p-2 rounded-lg"
          >
            Sample(csv)
          </a>
          <a
            href="/api/export-clients"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 border border-zinc-200 text-zinc-600 p-2 rounded-lg"
          >
            Export Clients
          </a>
          <Link
            href="/clients/new"
            className="
            py-2 px-4 inline-flex items-center justify-center
            rounded-xl text-white text-sm font-medium
            bg-gradient-to-r from-blue-500 to-purple-500
            shadow-md hover:shadow-lg
            transition-all duration-200
            hover:scale-[1.02]
          "
          >
            + Add Client
          </Link>
        </div>
      </div>

      {/* Alphabet Navigation */}
      <div className="flex flex-wrap justify-center gap-1 mb-6">
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
          w-8 h-8 flex items-center justify-center
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
        grid grid-cols-[80px_2fr_140px_180px_120px_180px]
        items-center
        px-5 py-2
        bg-zinc-50
        border-b border-zinc-200
        text-sm font-semibold text-zinc-600
      "
        >
          <div>S.N.</div>
          <div>Company</div>
          <div>Code</div>
          <div className="text-center">GST No.</div>
          <div>Status</div>

          <div className="text-center">Actions</div>
        </div>

        {/* Rows */}
        {data.length > 0 ? (
          data.map((c, index) => (
            <div
              key={c.id}
              className="
            grid grid-cols-[80px_2fr_140px_180px_120px_180px]
            items-center
            px-5 py-1
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

              <div className="text-zinc-500 text-center font-mono">
                {c.gstNumber || "---"}
              </div>

              {/* Status */}
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    c.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {c.isActive ? "Active" : "Inactive"}
                </span>
              </div>

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
                  href={`/(dashboard)/clients/${c.id}/edit`}
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
