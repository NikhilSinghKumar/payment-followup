"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Info, Save } from "lucide-react";
import { createCreditNote } from "@/app/actions/creditNote";

const INITIAL_STATE = { success: false, message: null };
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export default function CreditNoteForm({ clients = [], invoices = [] }) {
  const [state, formAction, pending] = useActionState(createCreditNote, INITIAL_STATE);
  const [clientId, setClientId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");

  const clientInvoices = useMemo(
    () => invoices.filter((invoice) => String(invoice.clientId) === clientId),
    [invoices, clientId],
  );
  const selectedInvoice = clientInvoices.find((invoice) => String(invoice.id) === invoiceId);
  const creditAmount = Number(amount || 0);
  const invoiceOutstanding = Number(selectedInvoice?.outstandingAmount || 0);
  const unappliedAmount = selectedInvoice ? Math.max(0, creditAmount - invoiceOutstanding) : creditAmount;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600"><FileText size={15} /> Finance Management</div>
          <h1 className="text-2xl font-bold text-zinc-900">Create Credit Note</h1>
          <p className="mt-1 text-sm text-zinc-500">Record a client credit adjustment. The invoice's original amount will not be changed.</p>
        </div>
        <Link href="/credit-notes" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"><ArrowLeft size={15} /> Back</Link>
      </div>

      {state?.message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${state.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role="status">
          {state.message}
          {state.success && <Link href="/credit-notes" className="ml-2 font-semibold underline">View credit notes</Link>}
        </div>
      )}

      <form action={formAction} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="clientId" className="mb-1.5 block text-sm font-semibold text-zinc-700">Client <span className="text-red-500">*</span></label>
            <select id="clientId" name="clientId" value={clientId} onChange={(event) => { setClientId(event.target.value); setInvoiceId(""); }} required className="input-primary w-full">
              <option value="">Select client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.companyName} ({client.companyCode})</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="invoiceId" className="mb-1.5 block text-sm font-semibold text-zinc-700">Link to Invoice <span className="font-normal text-zinc-400">(optional)</span></label>
            <select id="invoiceId" name="invoiceId" value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)} disabled={!clientId} className="input-primary w-full disabled:cursor-not-allowed disabled:bg-zinc-100">
              <option value="">Unallocated client credit</option>
              {clientInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} · FY {invoice.financialYear} · Outstanding ₹{Number(invoice.outstandingAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">Choose an invoice to allocate up to its current outstanding. Any excess remains unapplied. Leave blank for a client-level credit.</p>
          </div>

          <div>
            <label htmlFor="creditNoteNumber" className="mb-1.5 block text-sm font-semibold text-zinc-700">Credit Note Number <span className="text-red-500">*</span></label>
            <input id="creditNoteNumber" name="creditNoteNumber" required maxLength={100} placeholder="e.g. CN/2026-27/001" className="input-primary w-full" />
            <p className="mt-1 text-xs text-zinc-500">Enter the number from your accounts records.</p>
          </div>

          <div>
            <label htmlFor="creditNoteDate" className="mb-1.5 block text-sm font-semibold text-zinc-700">Credit Note Date <span className="text-red-500">*</span></label>
            <input id="creditNoteDate" name="creditNoteDate" type="date" defaultValue={today()} required className="input-primary w-full" />
          </div>

          <div>
            <label htmlFor="totalAmount" className="mb-1.5 block text-sm font-semibold text-zinc-700">Credit Note Amount (₹) <span className="text-red-500">*</span></label>
            <input id="totalAmount" name="totalAmount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required placeholder="0.00" className="input-primary w-full" />
          </div>

          <div>
            <label htmlFor="reason" className="mb-1.5 block text-sm font-semibold text-zinc-700">Reason <span className="text-red-500">*</span></label>
            <input id="reason" name="reason" required maxLength={500} placeholder="e.g. Service adjustment" className="input-primary w-full" />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold text-zinc-700">Notes <span className="font-normal text-zinc-400">(optional)</span></label>
            <textarea id="notes" name="notes" rows={3} maxLength={2000} placeholder="Additional internal notes for the accounts team" className="input-primary w-full resize-y" />
          </div>
        </div>

        {selectedInvoice && creditAmount > 0 && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
            <div className="font-semibold">Allocation preview</div>
            <div className="mt-2 flex flex-wrap justify-between gap-2"><span>Will be allocated to {selectedInvoice.invoiceNumber}</span><span className="font-semibold">₹{Math.min(creditAmount, invoiceOutstanding).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            {unappliedAmount > 0 && <div className="mt-1 flex flex-wrap justify-between gap-2"><span>Remaining unapplied credit</span><span className="font-semibold">₹{unappliedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p>This credit note will be saved as a <strong>Draft</strong>. Drafts do not affect receivables. You can review the details before issuing it.</p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:justify-end">
          <Link href="/credit-notes" className="inline-flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">Cancel</Link>
          <button type="submit" disabled={pending || clients.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"><Save size={16} />{pending ? "Saving Draft..." : "Save as Draft"}</button>
        </div>
      </form>
    </div>
  );
}
