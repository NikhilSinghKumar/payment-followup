import Link from "next/link";
import { Download } from "lucide-react";

export default function ExportInvoices({ clientId }) {
  return (
    <Link
      href={`/api/invoices/export?clientId=${clientId}`}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      title="Export invoices as CSV"
    >
      <Download size={13} className="text-zinc-500 dark:text-zinc-400" />
      <span>Export</span>
    </Link>
  );
}
