import { getInvoiceDetail } from "@/app/actions/invoiceDetail";
import AddPayment from "@/app/components/AddPayment";
import AddFollowup from "@/app/components/AddFollowup";
import EditPayment from "@/app/components/EditPayment";
import { updatePayment } from "@/app/actions/payment";
import Link from "next/link";

export default async function InvoiceDetailPage({ params }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);

  if (!id || isNaN(id)) {
    return <div className="p-6">Invalid invoice ID</div>;
  }

  const data = await getInvoiceDetail(id);

  if (!data) {
    return <div className="p-6">Invoice not found</div>;
  }

  const { invoice, payments, followups, summary } = data;
  const activities = [
    ...payments.map((p) => ({ ...p, type: "payment" })),
    ...followups.map((f) => ({ ...f, type: "followup" })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt || b.paymentDate) -
      new Date(a.createdAt || a.paymentDate),
  );

  return (
    <div className="min-h-screen bg-zinc-50 p-6 space-y-6">
      {/* Gradient Accent */}
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-800">
            {invoice.companyName}
          </h1>
          <div className="flex items-center text-sm text-zinc-500 gap-4 mt-1">
            <p>Code: {invoice.companyCode}</p>
            <p>Invoice No. #{invoice.invoiceNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="h-[40px] px-4 flex items-center rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 border border-zinc-300 text-white hover:bg-zinc-100 hover:scale-[1.03] transition"
          >
            Invoice List
          </Link>
          <Link
            href="/clients"
            className="h-[40px] px-4 flex items-center rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 border border-zinc-300 text-white hover:bg-zinc-100 hover:scale-[1.03] transition"
          >
            Client List
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Total" value={summary.totalAmount} />
        <Card title="Paid" value={summary.totalPaid} />
        <Card title="Due" value={summary.due} />
        <StatusCard status={summary.status} />
      </div>

      {/* Activities */}
      <div className="grid grid-cols-3 gap-4">
        <AddPayment invoiceId={invoice.id} due={summary.due} />
        <AddFollowup invoiceId={invoice.id} />
      </div>

      {/* Payments + followups */}
      <section className="bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-md p-5">
        <h2 className="text-lg font-semibold text-zinc-800 mb-4">Activity</h2>

        {activities.length === 0 ? (
          <div className="text-center text-zinc-500 py-6">
            No activities so far
          </div>
        ) : (
          activities.map((item, i) => {
            const date = new Date(
              item.createdAt || item.paymentDate,
            ).toLocaleDateString("en-IN");

            return (
              <div
                key={i}
                className="flex gap-3 py-3 border-b last:border-none"
              >
                <div className="mt-1">
                  {item.type === "payment" ? "💰" : "📝"}
                </div>

                {item.type === "payment" ? (
                  <div className="flex items-start justify-between gap-4">
                    {/* LEFT */}
                    <div>
                      <div className="text-sm text-zinc-800 font-medium">
                        ₹{Number(item.amount).toLocaleString("en-IN")} received
                      </div>

                      <div className="text-xs text-zinc-500 mt-1">
                        via {item.method || "—"}
                      </div>

                      {/* Reference */}
                      {item.reference && (
                        <div className="text-xs text-zinc-400 mt-1">
                          Ref: {item.reference}
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="text-xs text-zinc-500 mt-2 italic">
                          {item.notes}
                        </div>
                      )}

                      <div className="text-xs text-zinc-400 mt-2">{date}</div>
                    </div>

                    {/* RIGHT */}
                    <div>
                      <EditPayment
                        payment={item}
                        updateAction={async (formData) => {
                          "use server";

                          return updatePayment(item.id, invoice.id, formData);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-zinc-800">
                    {item.note}

                    <div className="text-xs text-zinc-400 mt-1">{date}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

/* ---------- Cards ---------- */

function Card({ title, value }) {
  return (
    <div className="bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-md p-4">
      <div className="text-sm text-zinc-500">{title}</div>
      <div className="text-xl font-semibold text-zinc-800 mt-1">
        {typeof value === "number"
          ? "₹" + value.toLocaleString("en-IN")
          : value}
      </div>
    </div>
  );
}

function StatusCard({ status }) {
  const color =
    status === "Paid"
      ? "bg-green-100 text-green-700"
      : status === "Partial"
        ? "bg-amber-100 text-amber-700"
        : status === "Overdue"
          ? "bg-red-100 text-red-700"
          : status === "Disputed"
            ? "bg-zinc-200 text-zinc-700"
            : "bg-blue-100 text-blue-700";

  return (
    <div className="bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-md p-4">
      <div className="text-sm text-zinc-500">Status</div>
      <div className="mt-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
