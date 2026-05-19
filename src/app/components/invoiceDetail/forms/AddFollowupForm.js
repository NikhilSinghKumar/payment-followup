"use client";

import { useTransition } from "react";

import { addInvoiceFollowup } from "@/app/actions/invoiceDetail";

export default function AddFollowupForm({ invoiceId, onSuccess }) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData) {
    startTransition(async () => {
      const result = await addInvoiceFollowup(invoiceId, formData);

      if (result?.success) {
        onSuccess?.();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4">
      {/* HEADER */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-800">Add Followup</h2>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {/* ROW */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* FOLLOWUP DATE */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              Followup Date
            </label>

            <input name="followupDate" type="date" className="input-primary" />
          </div>

          {/* NEXT FOLLOWUP */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">
              Next Followup Date
            </label>

            <input
              name="nextFollowupDate"
              type="date"
              className="input-primary"
            />
          </div>
        </div>

        {/* NOTE */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-600">
            Followup Note *
          </label>

          <textarea
            name="note"
            rows={4}
            required
            placeholder="Enter followup details..."
            className="w-full rounded-xl px-3 py-3 border border-zinc-200/80 dark:border-zinc-700/50 bg-white text-zinc-800 dark:text-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm dark:shadow-black/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent text-sm"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="
              rounded-lg bg-orange-500
              px-5 py-2 text-sm font-medium
              text-white transition
              hover:bg-orange-600
              disabled:opacity-50 cursor-pointer
            "
          >
            {isPending ? "Saving..." : "Save Followup"}
          </button>
        </div>
      </form>
    </div>
  );
}
