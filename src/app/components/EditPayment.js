"use client";

import { useState } from "react";

export default function EditPayment({ payment, updateAction }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Edit Button */}
      <button
        onClick={() => setOpen(true)}
        className="
          px-3 py-1 rounded-lg
          bg-yellow-500 text-white text-xs
          hover:bg-yellow-600 transition
        "
      >
        Edit
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Edit Payment
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              action={async (formData) => {
                await updateAction(formData);
                setOpen(false);
              }}
              className="space-y-3.5"
            >
              {/* Amount */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Amount (₹)
                </label>

                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={payment.amount}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 shadow-2xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Method */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Payment Method
                </label>

                <input
                  name="method"
                  defaultValue={payment.method || ""}
                  placeholder="UPI / Bank / Cash"
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 shadow-2xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Payment Date
                </label>

                <input
                  name="paymentDate"
                  type="date"
                  defaultValue={
                    payment.paymentDate
                      ? new Date(payment.paymentDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 shadow-2xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Reference / Transaction ID
                </label>

                <input
                  name="reference"
                  defaultValue={payment.reference || ""}
                  placeholder="Transaction ID / Ref No."
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 shadow-2xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Notes
                </label>

                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={payment.notes || ""}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-900 shadow-2xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-9 flex-1 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 flex-1 rounded-lg bg-blue-600 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
