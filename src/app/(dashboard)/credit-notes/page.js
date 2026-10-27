import Link from "next/link";
import { Plus, FileText, CalendarDays } from "lucide-react";
import { getCreditNotes } from "@/app/actions/creditNote";

export const dynamic = "force-dynamic";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const statusStyles = {
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  issued: "bg-blue-50 text-blue-700 ring-blue-200",
  partially_applied: "bg-violet-50 text-violet-700 ring-violet-200",
  applied: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  void: "bg-rose-50 text-rose-700 ring-rose-200",
};

const formatStatus = (status) =>
  String(status || "draft").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default async function CreditNotesPage() {
  const creditNotes = await getCreditNotes();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            <FileText size={15} /> Finance Management
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Credit Notes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage client credit adjustments without changing original invoice values.
          </p>
        </div>
        <Link
          href="/credit-notes/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={17} /> Create Credit Note
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Credit Note Register</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{creditNotes.length} record{creditNotes.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {creditNotes.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText size={23} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900">No credit notes yet</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">
              Create a credit note to record a client adjustment. New credit notes are saved as drafts and do not affect receivables until issued.
            </p>
            <Link href="/credit-notes/new" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Plus size={15} /> Create your first credit note
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-100 text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Credit Note</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Reason</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {creditNotes.map((note) => (
                  <tr key={note.id} className="transition hover:bg-zinc-50/70">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-zinc-900"><Link href={`/credit-notes/${note.id}`} className="text-blue-700 hover:text-blue-900 hover:underline">{note.creditNoteNumber}</Link></td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-zinc-800">{note.clientName}</div>
                      <div className="mt-0.5 text-xs text-zinc-500">{note.clientCode}</div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-zinc-600">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{note.creditNoteDate}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-zinc-900">{currency(note.totalAmount)}</td>
                    <td className="max-w-xs px-5 py-4 text-zinc-600"><span className="line-clamp-2">{note.reason}</span></td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[note.status] || statusStyles.draft}`}>
                        {formatStatus(note.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
