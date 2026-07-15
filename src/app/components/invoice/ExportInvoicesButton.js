"use client";

import { useSearchParams } from "next/navigation";

export default function ExportInvoicesButton() {
  const searchParams = useSearchParams();

  const href = `/api/export-invoices?${searchParams.toString()}`;

  return (
    <a
      href={href}
      className="h-[40px] px-4 flex items-center rounded-lg text-sm font-medium border border-zinc-300 bg-white dark:text-zinc-500 hover:bg-zinc-50 transition"
    >
      Export Invoices
    </a>
  );
}
