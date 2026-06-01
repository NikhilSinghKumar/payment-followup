import Link from "next/link";

export default function ClientPaymentsTab({ payments = [] }) {
  return (
    <div className="space-y-4">
      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">Payments</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Track client payments, receipts, and allocations.
          </p>
        </div>

        <button className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md">
          + Record Payment
        </button>
      </div>

      {/* ===================================== */}
      {/* EMPTY STATE */}
      {/* ===================================== */}

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
            💳
          </div>

          <h3 className="mt-4 text-lg font-semibold text-zinc-800">
            No payments found
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Record and manage payments received from this client.
          </p>

          <button className="mt-5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md">
            + Add First Payment
          </button>
        </div>
      ) : (
        /* ===================================== */
        /* PAYMENT TABLE */
        /* ===================================== */

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {/* TABLE HEADER */}
          <div className="grid grid-cols-[120px_140px_140px_120px_1fr_100px] gap-3 border-b border-zinc-200 bg-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            <div>Receipt</div>

            <div>Date</div>

            <div>Amount</div>

            <div>Method</div>

            <div>Reference</div>

            <div>Status</div>
          </div>

          {/* BODY */}
          <div>
            {payments.map((payment) => {
              return (
                <Link
                  key={payment.id}
                  href={`/payments/${payment.id}`}
                  className="grid grid-cols-[120px_140px_140px_120px_1fr_100px] gap-3 border-b border-zinc-100 px-4 py-3 text-sm transition hover:bg-zinc-50"
                >
                  {/* RECEIPT */}
                  <div className="font-medium text-zinc-800">
                    {payment.receiptNumber || "-"}
                  </div>

                  {/* DATE */}
                  <div className="text-zinc-600">
                    {payment.paymentDate
                      ? new Date(payment.paymentDate).toLocaleDateString()
                      : "-"}
                  </div>

                  {/* AMOUNT */}
                  <div className="font-medium text-emerald-600">
                    ₹{Number(payment.amount || 0).toLocaleString()}
                  </div>

                  {/* METHOD */}
                  <div className="capitalize text-zinc-700">
                    {payment.method || "-"}
                  </div>

                  {/* REFERENCE */}
                  <div className="truncate text-zinc-600">
                    {payment.reference || "-"}
                  </div>

                  {/* STATUS */}
                  <div>
                    {payment.isVoided ? (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        Voided
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
