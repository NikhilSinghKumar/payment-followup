import Link from "next/link";

export default function DownloadInvoiceSample() {
  return (
    <Link
      href="/api/invoices/sample"
      className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
    >
      Sample
    </Link>
  );
}
