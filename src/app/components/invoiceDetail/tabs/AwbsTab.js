"use client";

import { useState } from "react";
import { formatDateDisplay } from "@/lib/date-parser";

import AddAwbForm from "../forms/AddAwbForm";

export default function AwbsTab({ invoiceId, awbs }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {/* TOOLBAR */}
      <div className="flex items-center justify-end gap-3">
        {/* ACTIONS */}
        <div className="flex gap-2">
          <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 cursor-pointer dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Import CSV
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer"
          >
            {showForm ? "Close" : "+ Add AWB"}
          </button>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <AddAwbForm
          invoiceId={invoiceId}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="min-w-[760px]">
          {/* HEADER */}
          <div className="grid grid-cols-[1.2fr_120px_120px_120px_100px_120px_1fr] gap-3 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
            <div>AWB No</div>
            <div>Date</div>
            <div>Origin</div>
            <div>Destination</div>
            <div>Weight</div>
            <div>Amount</div>
            <div>Remarks</div>
          </div>

          {/* ROWS */}
          {awbs.length === 0 ? (
            <div className="p-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No AWBs added yet.
            </div>
          ) : (
            awbs.map((awb) => (
              <div
                key={awb.id}
                className="grid grid-cols-[1.2fr_120px_120px_120px_100px_120px_1fr] gap-3 border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800/60 dark:text-zinc-300"
              >
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {awb.awbNumber}
                </div>

                <div>
                  {awb.shipmentDate ? formatDateDisplay(awb.shipmentDate) : "-"}
                </div>

                <div>{awb.origin || "-"}</div>

                <div>{awb.destination || "-"}</div>

                <div>{awb.weight || "-"}</div>

                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  ₹{Number(awb.amount || 0).toLocaleString("en-IN")}
                </div>

                <div>{awb.remarks || "-"}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
