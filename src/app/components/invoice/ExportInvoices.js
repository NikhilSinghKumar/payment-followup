import Link from "next/link";

export default function ExportInvoices({ clientId }) {
  return (
    <button className="cursor-pointer">
      <Link
        href={`/api/invoices/export?clientId=${clientId}`}
        className="inline-flex h-9 items-center cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
      >
        Export
      </Link>
    </button>
  );
}
