"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

export default function ExportPayments() {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const exportHref = `/api/export-payments?${searchParams.toString()}`;

  return (
    <a
      id="export-payments-btn"
      href={exportHref}
      onClick={() => {
        setIsExporting(true);
        setTimeout(() => setIsExporting(false), 1500);
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shrink-0"
      title="Download payment records as CSV (reflects active search & date filters)"
    >
      <Download className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
      <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
    </a>
  );
}
