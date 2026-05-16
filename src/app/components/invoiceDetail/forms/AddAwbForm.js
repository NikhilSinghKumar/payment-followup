"use client";

import { useTransition } from "react";

import { addInvoiceAwb } from "@/app/actions/invoiceDetail";

export default function AddAwbForm({ invoiceId, onSuccess }) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData) {
    startTransition(async () => {
      const result = await addInvoiceAwb(invoiceId, formData);

      if (result?.success) {
        onSuccess?.();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">Add AWB</h2>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {/* ROW 1 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {/* AWB NUMBER */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              AWB Number *
            </label>

            <input
              name="awbNumber"
              required
              placeholder="Enter AWB"
              className="input-primary"
            />
          </div>

          {/* SHIPMENT DATE */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              Shipment Date
            </label>

            <input name="shipmentDate" type="date" className="input-primary" />
          </div>

          {/* ORIGIN */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Origin</label>

            <input
              name="origin"
              placeholder="Delhi"
              className="input-primary"
            />
          </div>

          {/* DESTINATION */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              Destination
            </label>

            <input
              name="destination"
              placeholder="Mumbai"
              className="input-primary"
            />
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* WEIGHT */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Weight</label>

            <input
              name="weight"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="input-primary"
            />
          </div>

          {/* AMOUNT */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Amount</label>

            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="input-primary"
            />
          </div>

          {/* REMARKS */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Remarks</label>

            <input
              name="remarks"
              placeholder="Add your remarks"
              className="input-primary"
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Saving..." : "Save AWB"}
          </button>
        </div>
      </form>
    </div>
  );
}
