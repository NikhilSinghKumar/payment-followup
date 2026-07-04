"use client";

import { calculateInvoice } from "@/lib/invoice-calculator";
import { useMemo } from "react";

export default function InvoiceSummary({
  invoiceAmount,
  gstNumber,
  tdsApplicable,
  deductionAmount,
  otherCharges,
}) {
  const summary = useMemo(() => {
    return calculateInvoice({
      invoiceAmount,
      gstNumber,
      tdsApplicable,
      deductionAmount,
      otherCharges,
    });
  }, [invoiceAmount, gstNumber, tdsApplicable, deductionAmount, otherCharges]);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <h3 className="text-sm font-semibold text-zinc-700 mb-4">
        Invoice Summary
      </h3>

      <div className="space-y-2 text-sm">
        <SummaryRow label="Basic Amount" value={summary.basicAmount} />

        <SummaryRow label="CGST" value={summary.cgstAmount} />

        <SummaryRow label="SGST" value={summary.sgstAmount} />

        <SummaryRow label="IGST" value={summary.igstAmount} />

        <SummaryRow label="TDS" value={summary.tdsAmount} />

        <hr className="my-2 border-zinc-200" />

        <SummaryRow label="Net Payable" value={summary.netPayableAmount} bold />
      </div>
    </div>
  );

  function SummaryRow({ label, value, bold = false }) {
    return (
      <div
        className={`flex justify-between ${
          bold ? "font-semibold text-blue-600" : "text-zinc-600"
        }`}
      >
        <span>{label}</span>

        <span>₹ {formatCurrency(value)}</span>
      </div>
    );
  }
}
