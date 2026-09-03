"use client";

import { useState, useTransition } from "react";
import { Coins, X, Check, Loader2, Calendar, FileText } from "lucide-react";
import { saveClientOpeningBalance } from "@/app/actions/openingBalance";

export default function OpeningBalanceModal({
  clientId,
  clientName,
  existingOpeningBalance = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const initialAmount = existingOpeningBalance
    ? Number(existingOpeningBalance.invoiceAmount || 0)
    : "";
  const initialDate = existingOpeningBalance?.invoiceDate
    ? new Date(existingOpeningBalance.invoiceDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];
  const initialNotes = existingOpeningBalance?.notes || "Opening Balance";
  const paidAmount = Number(existingOpeningBalance?.paidAmount || 0);

  const [amount, setAmount] = useState(initialAmount);
  const [asOfDate, setAsOfDate] = useState(initialDate);
  const [notes, setNotes] = useState(initialNotes);

  function handleOpen() {
    setError(null);
    setSuccess(null);
    setAmount(
      existingOpeningBalance
        ? Number(existingOpeningBalance.invoiceAmount || 0)
        : "",
    );
    setAsOfDate(
      existingOpeningBalance?.invoiceDate
        ? new Date(existingOpeningBalance.invoiceDate)
            .toISOString()
            .split("T")[0]
        : new Date().toISOString().split("T")[0],
    );
    setNotes(existingOpeningBalance?.notes || "Opening Balance");
    setIsOpen(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("amount", amount || "0");
    formData.append("asOfDate", asOfDate);
    formData.append("notes", notes);

    startTransition(async () => {
      const res = await saveClientOpeningBalance(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess("Opening balance saved successfully.");
        setTimeout(() => {
          setIsOpen(false);
        }, 1200);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/80 px-3.5 py-1.5 text-xs font-semibold text-purple-700 shadow-2xs transition hover:bg-purple-100 hover:border-purple-300 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 cursor-pointer"
        title="Manage opening balance"
      >
        <Coins className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
        <span>
          {existingOpeningBalance
            ? "Edit Opening Balance"
            : "Set Opening Balance"}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Opening Balance
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-1">
                    {clientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error / Success feedback */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Check className="h-4 w-4" />
                <span>{success}</span>
              </div>
            )}

            {paidAmount > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                Payments of ₹{paidAmount.toLocaleString("en-IN")} have already
                been allocated towards this opening balance. Minimum allowed
                balance is ₹{paidAmount.toLocaleString("en-IN")}.
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Opening Balance Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-semibold text-zinc-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min={paidAmount > 0 ? paidAmount : 0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="h-10 w-full rounded-xl border border-zinc-300 bg-white pl-8 pr-3 text-sm font-semibold text-zinc-800 shadow-2xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Set to 0 to remove if no payments have been recorded against
                  it.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  As of Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    required
                    className="h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-800 shadow-2xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
                  Notes / Reference
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Previous financial year closing balance"
                  className="w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-800 shadow-2xs outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="h-9 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Opening Balance</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
