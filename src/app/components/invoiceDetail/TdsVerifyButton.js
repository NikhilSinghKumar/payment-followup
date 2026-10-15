"use client";

import { useState, useTransition } from "react";
import { Check, ShieldCheck, Clock, Edit2, X } from "lucide-react";
import { updateInvoiceTds } from "@/app/actions/tds";

export default function TdsVerifyButton({ invoice }) {
  const isOpening =
    Boolean(invoice?.isOpeningBalance) ||
    String(invoice?.invoiceNumber || "")
      .toUpperCase()
      .startsWith("OPENING");

  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  const currentTds = Number(
    invoice?.tdsDeducted ||
      invoice?.tdsDeductedAmount ||
      invoice?.tdsAmount ||
      0,
  );
  const isVerified = Boolean(invoice?.isTdsVerified);

  const [tdsAmount, setTdsAmount] = useState(currentTds.toString());
  const [verifiedChecked, setVerifiedChecked] = useState(isVerified);
  const [notes, setNotes] = useState(invoice?.tdsNotes || "");

  if (isOpening) {
    return null;
  }

  function handleOpen() {
    setTdsAmount(currentTds.toString());
    setVerifiedChecked(isVerified);
    setNotes(invoice.tdsNotes || "");
    setErrorMessage("");
    setIsOpen(true);
  }

  function handleSave() {
    setErrorMessage("");
    startTransition(async () => {
      try {
        await updateInvoiceTds({
          invoiceId: invoice.id,
          tdsDeductedAmount: parseFloat(tdsAmount) || 0,
          isTdsVerified: verifiedChecked,
          notes,
        });
        setIsOpen(false);
      } catch (err) {
        setErrorMessage(err.message || "Failed to update TDS.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-2xs transition ${
          isVerified
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
        }`}
        title="Verify or update TDS deduction"
      >
        {isVerified ? (
          <>
            <ShieldCheck
              size={14}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <span>TDS Verified (₹{currentTds.toLocaleString("en-IN")})</span>
          </>
        ) : (
          <>
            <Clock size={14} className="text-amber-600 dark:text-amber-400" />
            <span>TDS Pending</span>
          </>
        )}
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={18}
                  className="text-blue-600 dark:text-blue-400"
                />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  TDS Management & Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Invoice Total:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    ₹
                    {Number(invoice.invoiceAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Actual Cash/Bank Received:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹
                    {Number(
                      invoice.paid || invoice.paidAmount || 0,
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Editable TDS Deducted Amount Input */}
              <div>
                <label className="mb-1 block font-semibold text-zinc-700 dark:text-zinc-300">
                  TDS Deducted Amount (₹){" "}
                  <span className="text-zinc-400 font-normal">
                    (Manual Override)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tdsAmount}
                  onChange={(e) => setTdsAmount(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="Enter TDS amount deducted"
                />
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Default calculated TDS: ₹
                  {Number(invoice.tdsAmount || 0).toLocaleString("en-IN")}
                </p>
              </div>

              {/* Checkbox for TDS Verified */}
              <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedChecked}
                    onChange={(e) => setVerifiedChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      TDS Verified (Form 26AS Confirmed)
                    </span>
                    <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      Check this box when you confirm the client has deposited
                      the TDS and it reflects in Form 26AS.
                    </p>
                  </div>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
                  Remarks / Certificate No.{" "}
                  <span className="text-zinc-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Form 16A Q3 Ref / Verified via TRACES"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Math preview */}
              <div className="rounded-lg bg-blue-50/70 p-2.5 text-[11px] text-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                <div className="flex justify-between">
                  <span>Reconciliation equation:</span>
                  <b>
                    ₹
                    {(
                      Number(invoice.paid || invoice.paidAmount || 0) +
                      (parseFloat(tdsAmount) || 0)
                    ).toLocaleString("en-IN")}{" "}
                    / ₹
                    {Number(invoice.invoiceAmount || 0).toLocaleString("en-IN")}
                  </b>
                </div>
                <p className="mt-0.5 opacity-80">
                  Actual Payment Received +{" "}
                  {verifiedChecked ? "Verified" : "Pending"} TDS totals to
                  invoice amount.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save TDS Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
