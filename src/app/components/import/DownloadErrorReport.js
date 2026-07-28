"use client";

import { Download } from "lucide-react";

export default function DownloadErrorReport({
  errors = [],
  filename = `Invoice_Import_Errors_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-")}.csv`,
}) {
  const handleDownload = () => {
    if (!errors.length) return;

    const headers = ["Row", "Company Code", "Invoice Number", "Reason"];

    const rows = errors.map((error) => [
      error.row,
      error.companyCode || "",
      error.invoiceNumber || "",
      Array.isArray(error.reason) ? error.reason.join("; ") : error.reason,
    ]);

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
      onClick={handleDownload}
      disabled={!errors.length}
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        bg-red-50
        px-4
        py-2
        text-sm
        font-medium
        text-red-700
        border
        border-red-200
        hover:bg-red-100
        transition
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
    >
      <Download className="h-4 w-4" />
      Download Error Report
    </button>
  );
}
