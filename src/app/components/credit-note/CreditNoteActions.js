"use client";

import { useActionState, useState } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { issueCreditNote, voidCreditNote } from "@/app/actions/creditNote";

const INITIAL_STATE = { success: false, message: null };

export default function CreditNoteActions({ creditNoteId, status }) {
  const [issueState, issueAction, issuePending] = useActionState(issueCreditNote, INITIAL_STATE);
  const [voidState, voidAction, voidPending] = useActionState(voidCreditNote, INITIAL_STATE);
  const [showVoid, setShowVoid] = useState(false);
  const [confirmedIssue, setConfirmedIssue] = useState(false);

  return (
    <div className="space-y-3">
      {issueState.message && <div role="status" className={`rounded-lg border px-3 py-2 text-sm ${issueState.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{issueState.message}</div>}
      {voidState.message && <div role="status" className={`rounded-lg border px-3 py-2 text-sm ${voidState.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{voidState.message}</div>}

      {status === "draft" && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-2 text-sm text-blue-900"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /><p><strong>Ready to issue?</strong> Issuing makes this credit note effective for Net Receivable calculations. Verify the number, amount, client, and allocation first.</p></div>
          <form action={issueAction} className="mt-3 space-y-3">
            <input type="hidden" name="creditNoteId" value={creditNoteId} />
            <label className="flex items-start gap-2 text-sm text-blue-900"><input type="checkbox" checked={confirmedIssue} onChange={(e) => setConfirmedIssue(e.target.checked)} className="mt-1" /><span>I confirm the credit note details are correct and it can be issued.</span></label>
            <button type="submit" disabled={!confirmedIssue || issuePending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{issuePending ? "Issuing…" : "Issue Credit Note"}</button>
          </form>
        </div>
      )}

      {status !== "void" && (
        <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
          {!showVoid ? (
            <button type="button" onClick={() => setShowVoid(true)} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"><Ban size={15} /> Void Credit Note</button>
          ) : (
            <form action={voidAction} className="space-y-3">
              <input type="hidden" name="creditNoteId" value={creditNoteId} />
              <label htmlFor="voidReason" className="block text-sm font-semibold text-rose-900">Reason for voiding <span className="text-rose-600">*</span></label>
              <textarea id="voidReason" name="voidReason" required maxLength={1000} rows={3} placeholder="Explain why this credit note is being voided" className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300" />
              <p className="text-xs leading-5 text-rose-800">Voiding is recorded with a reason and removes this credit note from receivable calculations. It does not delete the historical record.</p>
              <div className="flex flex-wrap gap-2"><button type="submit" disabled={voidPending} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{voidPending ? "Voiding…" : "Confirm Void"}</button><button type="button" onClick={() => setShowVoid(false)} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">Cancel</button></div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
