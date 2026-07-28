"use client";

import { useMemo, useState } from "react";
import { Search, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ImportErrorTable({ errors = [] }) {
  const [search, setSearch] = useState("");

  const filteredErrors = useMemo(() => {
    if (!search.trim()) return errors;

    const query = search.toLowerCase();

    return errors.filter((error) => {
      return (
        String(error.row).includes(query) ||
        (error.companyCode || "").toLowerCase().includes(query) ||
        (error.invoiceNumber || "").toLowerCase().includes(query) ||
        (error.reason || "").toLowerCase().includes(query)
      );
    });
  }, [errors, search]);

  // ----------------------------
  // Success State
  // ----------------------------

  if (errors.length === 0) {
    return (
      <div className="border rounded-xl bg-emerald-50 p-10 flex flex-col items-center justify-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-3" />

        <h3 className="text-lg font-semibold text-emerald-700">
          No Import Errors
        </h3>

        <p className="text-sm text-zinc-500 mt-1">
          Every row was imported successfully.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2
                     h-4 w-4 text-zinc-400"
        />

        <input
          type="text"
          placeholder="Search row, company, invoice or error..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full
            rounded-lg
            border
            border-zinc-300
            bg-white
            pl-10
            pr-4
            py-2.5
            text-sm
            outline-none
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
          "
        />
      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-100 z-10">
              <tr className="text-left text-zinc-600">
                <th className="px-4 py-3 w-20">Row</th>

                <th className="px-4 py-3">Company Code</th>

                <th className="px-4 py-3">Invoice Number</th>

                <th className="px-4 py-3">Error</th>
              </tr>
            </thead>

            <tbody>
              {filteredErrors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-zinc-500">
                    No matching errors found.
                  </td>
                </tr>
              ) : (
                filteredErrors.map((error, index) => (
                  <tr
                    key={index}
                    className="border-t bg-zinc-50 hover:bg-zinc-50 transition"
                  >
                    <td className="px-4 py-3 font-semibold">{error.row}</td>

                    <td className="px-4 py-3">{error.companyCode || "—"}</td>

                    <td className="px-4 py-3">{error.invoiceNumber || "—"}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle
                          className="
                            h-4
                            w-4
                            mt-0.5
                            text-red-500
                            shrink-0
                          "
                        />

                        <span className="text-red-700">{error.reason}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}

      <div className="text-xs text-zinc-500 flex justify-between">
        <span>
          Showing {filteredErrors.length} of {errors.length} failed rows
        </span>

        <span>Search by row, company, invoice or reason</span>
      </div>
    </div>
  );
}
