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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-zinc-800">
                Edit Payment
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-700"
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
              className="space-y-4"
            >
              {/* Amount */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Amount
                </label>

                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={payment.amount}
                  className="
                    w-full h-[42px] px-3 rounded-lg
                    border border-zinc-200
                    focus:outline-none
                    focus:ring-2 focus:ring-blue-400
                  "
                />
              </div>

              {/* Method */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Method
                </label>

                <input
                  name="method"
                  defaultValue={payment.method || ""}
                  placeholder="UPI / Bank / Cash"
                  className="
                    w-full h-[42px] px-3 rounded-lg
                    border border-zinc-200
                    focus:outline-none
                    focus:ring-2 focus:ring-blue-400
                  "
                />
              </div>

              {/* Payment Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
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
                  className="
                    w-full h-[42px] px-3 rounded-lg
                    border border-zinc-200
                    focus:outline-none
                    focus:ring-2 focus:ring-blue-400
                  "
                />
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Reference
                </label>

                <input
                  name="reference"
                  defaultValue={payment.reference || ""}
                  placeholder="Transaction ID / Ref No."
                  className="
                    w-full h-[42px] px-3 rounded-lg
                    border border-zinc-200
                    focus:outline-none
                    focus:ring-2 focus:ring-blue-400
                  "
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Notes
                </label>

                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={payment.notes || ""}
                  placeholder="Optional notes..."
                  className="
                    w-full px-3 py-2 rounded-lg
                    border border-zinc-200
                    focus:outline-none
                    focus:ring-2 focus:ring-blue-400
                    resize-none
                  "
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="
                    flex-1 h-[42px] rounded-lg
                    bg-gradient-to-r from-blue-500 to-purple-500
                    text-white font-medium
                    hover:shadow-lg transition
                  "
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="
                    h-[42px] px-4 rounded-lg
                    border border-zinc-300
                    text-zinc-700
                    hover:bg-zinc-100 transition
                  "
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
