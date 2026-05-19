"use client";

import { useState } from "react";

import AddAwbForm from "../forms/AddAwbForm";

export default function AwbsTab({ invoiceId, awbs }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {/* TOOLBAR */}
      <div className="flex items-center justify-between gap-3">
        {/* SEARCH */}
        <input placeholder="Search AWB..." className="input-primary max-w-sm" />

        {/* ACTIONS */}
        <div className="flex gap-2">
          <button className="rounded-lg border border-zinc-400 dark:text-zinc-500 px-4 py-2 text-sm">
            Import CSV
          </button>

          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white cursor-pointer"
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
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        {/* HEADER */}
        <div className="grid grid-cols-[1.2fr_120px_120px_120px_100px_120px_1fr] gap-3 bg-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">
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
          <div className="p-10 text-center text-sm text-zinc-500">
            No AWBs added yet.
          </div>
        ) : (
          awbs.map((awb) => (
            <div
              key={awb.id}
              className="grid grid-cols-[1.2fr_120px_120px_120px_100px_120px_1fr] gap-3 border-t border-zinc-100 px-4 py-3 text-sm"
            >
              <div className="font-medium text-zinc-800">{awb.awbNumber}</div>

              <div>
                {awb.shipmentDate
                  ? new Date(awb.shipmentDate).toLocaleDateString("en-IN")
                  : "-"}
              </div>

              <div>{awb.origin || "-"}</div>

              <div>{awb.destination || "-"}</div>

              <div>{awb.weight || "-"}</div>

              <div>₹{Number(awb.amount || 0).toLocaleString("en-IN")}</div>

              <div>{awb.remarks || "-"}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
