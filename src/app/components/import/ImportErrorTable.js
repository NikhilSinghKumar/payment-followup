"use client";

import { useMemo, useState } from "react";
import { Search, AlertCircle, CheckCircle2 } from "lucide-react";

const DEFAULT_COLUMNS = [
  {
    key: "row",
    label: "Row",
  },
  {
    key: "companyCode",
    label: "Company Code",
  },
  {
    key: "invoiceNumber",
    label: "Invoice Number",
  },
  {
    key: "reason",
    label: "Error",
  },
];

export default function ImportErrorTable({
  errors = [],
  columns = DEFAULT_COLUMNS,
}) {
  const [search, setSearch] = useState("");

  const activeColumns = columns?.length > 0 ? columns : DEFAULT_COLUMNS;

  // =====================================
  // SEARCH
  // =====================================

  const filteredErrors = useMemo(() => {
    if (!search.trim()) return errors;

    const query = search.toLowerCase();

    return errors.filter((error) => {
      return activeColumns.some((column) => {
        const value = error[column.key];

        if (Array.isArray(value)) {
          return value.join(" ").toLowerCase().includes(query);
        }

        return String(value ?? "")
          .toLowerCase()
          .includes(query);
      });
    });
  }, [errors, search, activeColumns]);

  // =====================================
  // SUCCESS STATE
  // =====================================

  if (errors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-emerald-50 p-10">
        <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-600" />

        <h3 className="text-lg font-semibold text-emerald-700">
          No Import Errors
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
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
          className="
            absolute left-3 top-1/2
            h-4 w-4 -translate-y-1/2
            text-zinc-400
          "
        />

        <input
          type="text"
          placeholder="Search import errors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full rounded-lg
            border border-zinc-300
            bg-white
            py-2.5 pl-10 pr-4
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
            <thead className="sticky top-0 z-10 bg-zinc-100">
              <tr className="text-left text-zinc-600">
                {activeColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 ${
                      column.key === "row" ? "w-20" : ""
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredErrors.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeColumns.length}
                    className="py-10 text-center text-zinc-500"
                  >
                    No matching errors found.
                  </td>
                </tr>
              ) : (
                filteredErrors.map((error, index) => (
                  <tr
                    key={`${error.row}-${index}`}
                    className="
                      border-t bg-zinc-50
                      text-zinc-600
                      transition hover:bg-zinc-50
                    "
                  >
                    {activeColumns.map((column) => {
                      const value = error[column.key];

                      // Error / reason column
                      if (column.key === "reason") {
                        return (
                          <td key={column.key} className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                              <span className="text-red-700">
                                {Array.isArray(value)
                                  ? value.join(", ")
                                  : value || "—"}
                              </span>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={column.key}
                          className={`px-4 py-3 ${
                            column.key === "row" ? "font-semibold" : ""
                          }`}
                        >
                          {value && String(value).trim().length > 0
                            ? value
                            : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}

      <div className="flex justify-between text-xs text-zinc-500">
        <span>
          Showing {filteredErrors.length} of {errors.length} failed rows
        </span>

        <span>Search across all error fields</span>
      </div>
    </div>
  );
}
