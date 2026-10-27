import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, CalendarDays, UserRound, ReceiptText } from "lucide-react";
import { getCreditNoteById } from "@/app/actions/creditNote";
import CreditNoteActions from "@/app/components/credit-note/CreditNoteActions";

export const dynamic = "force-dynamic";

const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const formatStatus = (status) => String(status || "draft").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const statusStyles = {
  draft: "bg-amber-50 text-amber-700 ring-amber-200",
  issued: "bg-blue-50 text-blue-700 ring-blue-200",
  partially_applied: "bg-violet-50 text-violet-700 ring-violet-200",
  applied: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  void: "bg-rose-50 text-rose-700 ring-rose-200",
};

export default async function CreditNoteDetailsPage({ params }) {
  const { id } = await params;
  const note = await getCreditNoteById(id);
  if (!note) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/credit-notes" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900"><ArrowLeft size={15} /> Back to Credit Notes</Link>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600"><FileText size={15} /> Finance Management</div>
          <h1 className="text-2xl font-bold text-zinc-900">{note.creditNoteNumber}</h1>
          <p className="mt-1 text-sm text-zinc-500">Credit note details and allocation summary.</p>
        </div>
        <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyles[note.status] || statusStyles.draft}`}>{formatStatus(note.status)}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Credit Note Amount" value={currency(note.totalAmount)} icon={<ReceiptText size={17} />} />
        <SummaryCard label="Allocated to Invoices" value={currency(note.allocatedAmount)} icon={<FileText size={17} />} />
        <SummaryCard label="Unapplied Credit" value={currency(note.unappliedAmount)} icon={<ReceiptText size={17} />} />
        <SummaryCard label="Credit Note Date" value={note.creditNoteDate} icon={<CalendarDays size={17} />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-zinc-900">Credit Note Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="Client" value={note.clientName} sub={note.clientCode} icon={<UserRound size={16} />} />
            <InfoItem label="Credit Note Number" value={note.creditNoteNumber} />
            <InfoItem label="Reason" value={note.reason} />
            <InfoItem label="Created" value={note.createdAt ? new Date(note.createdAt).toLocaleString("en-IN") : "—"} />
            <div className="sm:col-span-2"><InfoItem label="Notes" value={note.notes || "No additional notes"} /></div>
            {note.issuedAt && <InfoItem label="Issued At" value={new Date(note.issuedAt).toLocaleString("en-IN")} />}
            {note.voidedAt && <InfoItem label="Voided At" value={new Date(note.voidedAt).toLocaleString("en-IN")} />}
            {note.voidReason && <div className="sm:col-span-2"><InfoItem label="Void Reason" value={note.voidReason} /></div>}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-zinc-900">Allocation Summary</h2>
          {note.allocations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center"><p className="text-sm font-medium text-zinc-700">No invoice allocation</p><p className="mt-1 text-xs text-zinc-500">This credit is held at client level and remains unapplied to individual invoices.</p></div>
          ) : (
            <div className="space-y-3">
              {note.allocations.map((allocation) => <div key={allocation.id} className="rounded-xl border border-zinc-100 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-zinc-900">{allocation.invoiceNumber}</div><div className="mt-1 text-xs text-zinc-500">FY {allocation.financialYear} · {allocation.invoiceDate}</div></div><div className="text-right font-semibold tabular-nums text-zinc-900">{currency(allocation.allocatedAmount)}</div></div><div className="mt-3 flex justify-between gap-3 border-t border-zinc-100 pt-3 text-xs text-zinc-500"><span>Current invoice outstanding</span><span>{currency(allocation.invoiceOutstanding)}</span></div></div>)}
            </div>
          )}
          <p className="text-xs leading-5 text-zinc-500">Allocation details are shown for audit and reconciliation. This screen does not change original invoice amounts.</p>
        </section>
      </div>

      {note.status === "void" ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">This credit note is void. It must not be included in receivable calculations.</div>
      ) : (
        <CreditNoteActions creditNoteId={note.id} status={note.status} />
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-zinc-500"><span className="text-xs font-semibold uppercase tracking-wide">{label}</span>{icon}</div><div className="mt-3 text-xl font-bold tabular-nums text-zinc-900">{value}</div></div>;
}
function InfoItem({ label, value, sub, icon }) {
  return <div><div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">{icon}{label}</div><div className="mt-1 break-words text-sm font-semibold text-zinc-900">{value}</div>{sub && <div className="mt-0.5 text-xs text-zinc-500">{sub}</div>}</div>;
}
