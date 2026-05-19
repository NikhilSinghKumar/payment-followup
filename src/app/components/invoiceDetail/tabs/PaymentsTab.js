"use client";
import { useState } from "react";

import AddPaymentForm from "../forms/AddPaymentForm";
import EditPaymentForm from "../forms/EditPaymentForm";

export default function PaymentsTab({ invoiceId, payments }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

        {payments.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            No paymentss added yet.
          </div>
        ) : (
          payments.map((payment) => (
            <div key={payment.id}>
              {/* Row */}
              <div
                className="
        grid grid-cols-[140px_140px_120px_140px_120px_1fr_100px]
        gap-3 border-t border-zinc-100
        px-4 py-3 text-sm items-center
      "
              >
                <div>{payment.receiptNumber || "-"}</div>

                <div>
                  {new Date(payment.paymentDate).toLocaleDateString("en-IN")}
                </div>

                <div>{payment.method || "-"}</div>

                <div>{payment.reference || "-"}</div>

                <div>₹{Number(payment.amount).toLocaleString("en-IN")}</div>

                <div>{payment.notes || "-"}</div>

                {/* Actions */}
                <div>
                  <button
                    onClick={() =>
                      setEditingId(editingId === payment.id ? null : payment.id)
                    }
                    className="
            rounded-lg bg-amber-100
            px-3 py-1.5 text-xs font-medium
            text-amber-700 hover:bg-amber-200
          "
                  >
                    {editingId === payment.id ? "Close" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {editingId === payment.id && (
                <EditPaymentForm
                  payment={payment}
                  invoiceId={invoiceId}
                  onCancel={() => setEditingId(null)}
                  onSuccess={() => setEditingId(null)}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
