"use state";
import { useState } from "react";

import AddPaymentForm from "../forms/AddPaymentForm";

export default function PaymentsTab({ invoiceId, payments }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Payments</h2>

        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white cursor-pointer"
        >
          {showForm ? "Close" : "+ Add Payment"}
        </button>
      </div>

      {showForm && (
        <AddPaymentForm
          invoiceId={invoiceId}
          onSuccess={() => setShowForm(false)}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <div className="grid grid-cols-[140px_140px_120px_140px_120px_1fr] gap-3 bg-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">
          <div>Receipt</div>
          <div>Date</div>
          <div>Method</div>
          <div>Reference</div>
          <div>Amount</div>
          <div>Notes</div>
        </div>

        {payments.map((payment) => (
          <div
            key={payment.id}
            className="grid grid-cols-[140px_140px_120px_140px_120px_1fr] gap-3 border-t border-zinc-100 px-4 py-3 text-sm"
          >
            <div>{payment.receiptNumber || "-"}</div>

            <div>
              {new Date(payment.paymentDate).toLocaleDateString("en-IN")}
            </div>

            <div>{payment.method || "-"}</div>

            <div>{payment.reference || "-"}</div>

            <div>₹{Number(payment.amount).toLocaleString("en-IN")}</div>

            <div>{payment.notes || "-"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
