import Link from "next/link";
export default function ClientTableRow() {
  return (
    <>
      {data.length > 0 ? (
        data.map((c, index) => (
          <div
            key={c.id}
            className="
            grid grid-cols-[80px_2fr_140px_180px_120px_180px]
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
        <div className="p-10 text-center text-zinc-400">No clients found.</div>
      )}
    </>
  );
}
