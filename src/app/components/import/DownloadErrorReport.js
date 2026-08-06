"use client";

import { Download } from "lucide-react";

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
    label: "Reason",
  },
];

export default function DownloadErrorReport({
  errors = [],
  filename = `Import_Errors_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-")}.csv`,
  columns = DEFAULT_COLUMNS,
}) {
  const activeColumns = columns?.length > 0 ? columns : DEFAULT_COLUMNS;

  const handleDownload = () => {
    if (!errors.length) return;

    // =====================================
    // HEADERS
    // =====================================

    const headers = activeColumns.map((column) => column.label);

    // =====================================
    // ROWS
    // =====================================

    const rows = errors.map((error) =>
      activeColumns.map((column) => {
        const value = error[column.key];

        if (Array.isArray(value)) {
          return value.join("; ");
        }

        return value ?? "";
      }),
    );

    // =====================================
    // CSV
    // =====================================

    const csv = [
      headers.join(","),

      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!errors.length}
      className="
        inline-flex items-center gap-2
        rounded-lg border border-red-200
        bg-red-50 px-4 py-2
        text-sm font-medium text-red-700
        transition
        hover:bg-red-100
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      <Download className="h-4 w-4" />
      Download Error Report
    </button>
  );
}
