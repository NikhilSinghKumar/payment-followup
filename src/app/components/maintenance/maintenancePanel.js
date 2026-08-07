"use client";

import { useState, useTransition } from "react";
import { Wrench, RotateCw, CheckCircle2 } from "lucide-react";

import { recalculateInvoiceFinancials } from "@/app/actions/maintenance";

export default function MaintenancePanel() {
  const [result, setResult] = useState(null);

  const [pending, startTransition] = useTransition();

  function handleRecalculate() {
    setResult(null);

    startTransition(async () => {
      const res = await recalculateInvoiceFinancials();

      setResult(res);
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}

      <div className="border-b border-zinc-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-2">
            <Wrench className="h-5 w-5 text-blue-600" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-zinc-800">Maintenance</h2>

            <p className="text-sm text-zinc-500">
              Administrative maintenance tools.
            </p>
          </div>
        </div>
      </div>

      {/* Body */}

      <div className="space-y-5 p-6">
        <div className="rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-800">
                Recalculate Invoice Financials
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Rebuild Paid Amount, Outstanding Amount and Status for every
                invoice.
              </p>
            </div>

            <button
              onClick={handleRecalculate}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <RotateCw
                className={`h-4 w-4 ${pending ? "animate-spin" : ""}`}
              />

              {pending ? "Processing..." : "Run"}
            </button>
          </div>
        </div>

        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />

              <div>
                <h4 className="font-semibold text-emerald-700">
                  Completed Successfully
                </h4>

                <div className="mt-2 text-sm text-zinc-700 space-y-1">
                  <p>Total Invoices : {result.total}</p>

                  <p>Updated : {result.success}</p>

                  <p>Failed : {result.failed}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
