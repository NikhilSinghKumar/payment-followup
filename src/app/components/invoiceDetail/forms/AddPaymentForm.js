"use client";

import { useTransition } from "react";

import { addInvoicePayment } from "@/app/actions/invoiceDetail";

export default function AddPaymentForm({ invoiceId, onSuccess }) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData) {
    startTransition(async () => {
      const result = await addInvoicePayment(invoiceId, formData);

      if (result?.success) {
        onSuccess?.();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-800">Add Payment</h2>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {/* ROW 1 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {/* RECEIPT NUMBER */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              Receipt Number
            </label>

            <input
              name="receiptNumber"
              placeholder="RCPT-001"
              className="input-primary"
            />
          </div>

          {/* PAYMENT DATE */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              Payment Date *
            </label>

            <input
              name="paymentDate"
              type="date"
              required
              className="input-primary"
            />
          </div>

          {/* METHOD */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              Method *
            </label>

            <select name="method" required className="input-primary">
              <option value="">Select Method</option>

              <option value="cash">Cash</option>

              <option value="bank">Bank</option>

              <option value="upi">UPI</option>

              <option value="cheque">Cheque</option>

              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          {/* AMOUNT */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              Amount *
            </label>

            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="input-primary"
            />
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* REFERENCE */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              Reference
            </label>

            <input
              name="reference"
              placeholder="UPI Ref / Bank Txn / Cheque No"
              className="input-primary"
            />
          </div>

          {/* NOTES */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Notes</label>

            <input
              name="notes"
              placeholder="Optional notes"
              className="input-primary"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="
              rounded-lg bg-emerald-500 cursor-pointer
              px-5 py-2 text-sm font-medium
              text-white transition
              hover:bg-emerald-600
              disabled:opacity-50
            "
          >
            {isPending ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
