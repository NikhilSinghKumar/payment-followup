"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  saveCreditNoteAllocation,
  removeCreditNoteAllocation,
} from "@/app/actions/creditNote";

const INITIAL_STATE = { success: false, message: null };
const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export default function CreditNoteAllocationManager({
  creditNoteId,
  status,
  totalAmount,
  allocations = [],
  invoices = [],
}) {
  const [saveState, saveAction, savePending] = useActionState(
    saveCreditNoteAllocation,
    INITIAL_STATE,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeCreditNoteAllocation,
    INITIAL_STATE,
  );
  const [newInvoiceId, setNewInvoiceId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const allocatedTotal = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.allocatedAmount || 0),
    0,
  );
  const noteRemaining = Math.max(0, Number(totalAmount || 0) - allocatedTotal);
  const availableInvoices = useMemo(
    () => invoices.filter((invoice) => Number(invoice.availableForCredit || 0) > 0),
    [invoices],
  );
  const selectedNewInvoice = availableInvoices.find(
    (invoice) => String(invoice.id) === newInvoiceId,
  );
  const newMax = selectedNewInvoice
    ? Math.min(Number(selectedNewInvoice.availableForCredit || 0), noteRemaining)
    : 0;

  if (status === "void") return null;

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Manage Invoice Allocations</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Allocate this credit to invoices for the same client. Allocations do not change the original invoice amount.
        </p>
      </div>

      {saveState.message && (
        <div role="status" className={`rounded-lg border px-3 py-2 text-sm ${saveState.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {saveState.message}
        </div>
      )}
      {removeState.message && (
        <div role="status" className={`rounded-lg border px-3 py-2 text-sm ${removeState.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {removeState.message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Credit note amount" value={currency(totalAmount)} />
        <Metric label="Currently allocated" value={currency(allocatedTotal)} />
        <Metric label="Unapplied credit" value={currency(noteRemaining)} />
      </div>

      {allocations.length > 0 ? (
        <div className="space-y-3">
          {allocations.map((allocation) => {
            const invoice = invoices.find((row) => row.id === allocation.invoiceId);
            const otherSameNote = allocatedTotal - Number(allocation.allocatedAmount || 0);
            const maxAmount = Math.min(
              Number(invoice?.availableForCredit ?? allocation.invoiceOutstanding ?? 0),
              Math.max(0, Number(totalAmount || 0) - otherSameNote),
            );
            return (
              <div key={allocation.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-zinc-900">{allocation.invoiceNumber}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      FY {allocation.financialYear} · Invoice outstanding {currency(allocation.invoiceOutstanding)}
                    </div>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                    {currency(allocation.allocatedAmount)} allocated
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_1.3fr_auto] sm:items-end">
                  <form action={saveAction} className="contents">
                    <input type="hidden" name="creditNoteId" value={creditNoteId} />
                    <input type="hidden" name="invoiceId" value={allocation.invoiceId} />
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-600">Allocated amount (₹)</label>
                      <input
                        name="allocatedAmount"
                        type="number"
                        min="0.01"
                        max={maxAmount}
                        step="0.01"
                        required
                        defaultValue={allocation.allocatedAmount}
                        className="input-primary w-full"
                      />
                      <p className="mt-1 text-xs text-zinc-500">Maximum allowed: {currency(maxAmount)}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-600">Allocation notes</label>
                      <input
                        name="allocationNotes"
                        maxLength={1000}
                        defaultValue={allocation.notes || ""}
                        placeholder="Optional note"
                        className="input-primary w-full"
                      />
                    </div>
                    <button type="submit" disabled={savePending} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                      <Save size={14} /> {savePending ? "Saving…" : "Update"}
                    </button>
                  </form>
                  <form action={removeAction} className="sm:col-span-3">
                    <input type="hidden" name="creditNoteId" value={creditNoteId} />
                    <input type="hidden" name="invoiceId" value={allocation.invoiceId} />
                    <button type="submit" disabled={removePending} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                      <Trash2 size={13} /> {removePending ? "Removing…" : "Remove allocation"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
          No invoice allocations yet. The credit is currently unapplied.
        </div>
      )}

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-950"><Plus size={16} /> Add invoice allocation</h3>
        {noteRemaining <= 0 ? (
          <p className="mt-2 text-sm text-blue-900">The full credit note amount is already allocated.</p>
        ) : availableInvoices.length === 0 ? (
          <p className="mt-2 text-sm text-blue-900">No invoices have remaining capacity for this credit note.</p>
        ) : (
          <form action={saveAction} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="creditNoteId" value={creditNoteId} />
            <div className="sm:col-span-2">
              <label htmlFor="newAllocationInvoiceId" className="mb-1 block text-xs font-semibold text-blue-950">Invoice</label>
              <select
                id="newAllocationInvoiceId"
                name="invoiceId"
                value={newInvoiceId}
                onChange={(event) => { setNewInvoiceId(event.target.value); setNewAmount(""); }}
                required
                className="input-primary w-full"
              >
                <option value="">Select invoice</option>
                {availableInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} · FY {invoice.financialYear} · Available {currency(invoice.availableForCredit)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="newAllocationAmount" className="mb-1 block text-xs font-semibold text-blue-950">Amount to allocate (₹)</label>
              <input
                id="newAllocationAmount"
                name="allocatedAmount"
                type="number"
                min="0.01"
                max={newMax || undefined}
                step="0.01"
                value={newAmount}
                onChange={(event) => setNewAmount(event.target.value)}
                required
                className="input-primary w-full"
              />
              <p className="mt-1 text-xs text-blue-900">Maximum allowed: {currency(newMax)}</p>
            </div>
            <div>
              <label htmlFor="newAllocationNotes" className="mb-1 block text-xs font-semibold text-blue-950">Allocation notes (optional)</label>
              <input
                id="newAllocationNotes"
                name="allocationNotes"
                value={newNotes}
                onChange={(event) => setNewNotes(event.target.value)}
                maxLength={1000}
                className="input-primary w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={savePending || !newInvoiceId || Number(newAmount) <= 0 || Number(newAmount) > newMax + 0.005} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                <Plus size={15} /> {savePending ? "Saving…" : "Add allocation"}
              </button>
            </div>
          </form>
        )}
      </div>

      {status === "draft" && (
        <p className="text-xs leading-5 text-amber-800">
          This credit note is still a draft. Allocation changes are saved for review and will not affect receivables until the credit note is issued.
        </p>
      )}
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums text-zinc-900">{value}</div>
    </div>
  );
}
