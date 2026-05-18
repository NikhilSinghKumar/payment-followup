"use client";

import { useActionState, useEffect, useState } from "react";
import { updatePayment } from "@/app/actions/payment";
import { useFormStatus } from "react-dom";

export default function EditPaymentForm({
  payment,
  invoiceId,
  onCancel,
  onSuccess,
}) {
  const updatePaymentWithIds = updatePayment.bind(null, payment.id, invoiceId);

  const [state, formAction] = useActionState(updatePaymentWithIds, null);

  useEffect(() => {
    if (state?.success) {
      if (onSuccess) {
        onSuccess();
      }
    }

    if (state?.error) {
    }
  }, [state?.success, state?.error]);

  return (
    <form
      action={formAction}
      className="
        mt-3 rounded-xl border border-amber-200
        bg-amber-50 p-4 space-y-4
      "
    >
      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Amount */}
        <div>
          <label className="mb-1 block text-sm text-zinc-600">Amount *</label>

          <input
            type="number"
            step="0.01"
            name="amount"
            defaultValue={payment.amount}
            required
            className="input-primary"
          />
        </div>

        {/* Payment Date */}
        <div>
          <label className="mb-1 block text-sm text-zinc-600">
            Payment Date
          </label>

          <input
            type="date"
            name="paymentDate"
            defaultValue={
              payment.paymentDate
                ? new Date(payment.paymentDate).toISOString().split("T")[0]
                : ""
            }
            className="input-primary"
          />
        </div>

        {/* Method */}
        <div>
          <label className="mb-1 block text-sm text-zinc-600">Method</label>

          <select
            name="method"
            defaultValue={payment.method || ""}
            className="input-primary"
          >
            <option value="">Select</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        {/* Reference */}
        <div>
          <label className="mb-1 block text-sm text-zinc-600">Reference</label>

          <input
            name="reference"
            defaultValue={payment.reference || ""}
            className="input-primary"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-sm text-zinc-600">Notes</label>

        <textarea
          name="notes"
          rows={3}
          defaultValue={payment.notes || ""}
          className="input-primary resize-none"
        />
      </div>

      {/* Error */}
      {state?.error && (
        <div className="rounded-lg bg-red-100 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="
            rounded-lg border border-zinc-300
            px-4 py-2 text-sm font-medium
            text-zinc-700 hover:bg-zinc-100
          "
        >
          Cancel
        </button>

        <SubmitButton />
      </div>
    </form>
  );

  function SubmitButton() {
    const { pending } = useFormStatus();

    return (
      <button
        type="submit"
        disabled={pending}
        className="
        rounded-lg bg-amber-500
        px-4 py-2 text-sm font-medium
        text-white hover:bg-amber-600
        disabled:opacity-50
      "
      >
        {pending ? "Updating..." : "Update Payment"}
      </button>
    );
  }
}
