import { getInvoiceById, updateInvoice } from "@/app/actions/invoice";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EditInvoicePage({ params }) {
  const resolvedParams = await params;

  const id = Number(resolvedParams.id);

  if (!id || isNaN(id)) {
    return notFound();
  }

  const invoice = await getInvoiceById(id);

  if (!invoice) {
    return notFound();
  }

  async function updateInvoiceAction(formData) {
    "use server";

    return updateInvoice(id, formData);
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      {/* Center Container */}
      <div className="max-w-2xl mx-auto">
        {/* Gradient Line */}
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-800">
              Edit Invoice
            </h1>

            <p className="text-sm text-zinc-500 mt-1">
              Update invoice details and billing dates
            </p>
          </div>

          <Link
            href="/invoices"
            className="
            h-[38px] px-4 flex items-center rounded-lg
            text-sm font-medium text-white
            bg-gradient-to-r from-blue-500 to-purple-500
            shadow-sm hover:shadow-md
            transition-all duration-200
            "
          >
            Invoice List
          </Link>
        </div>

        {/* Compact Form Card */}
        <div
          className="
          bg-white/90 backdrop-blur-md
          rounded-2xl
          border border-zinc-200
          shadow-sm
          p-5 md:p-6
          "
        >
          <form action={updateInvoiceAction} className="space-y-4">
            {/* Company Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Company Code
                </label>

                <input
                  value={invoice.companyCode}
                  disabled
                  className="
              w-full h-[40px] px-3 rounded-lg
              border border-zinc-200
              bg-zinc-100 text-zinc-500
              cursor-not-allowed
            "
                />
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Amount
                </label>

                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  defaultValue={invoice.amount}
                  className="
              w-full h-[40px] px-3 rounded-lg
              border border-zinc-200
              bg-white text-zinc-800
              focus:outline-none
              focus:ring-2 focus:ring-blue-400
            "
                />
              </div>
            </div>

            {/* Date Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-700">
                  Due Date
                </label>

                <input
                  name="dueDate"
                  type="date"
                  defaultValue={
                    invoice.dueDate
                      ? new Date(invoice.dueDate).toISOString().split("T")[0]
                      : ""
                  }
                  className="
              w-full h-[40px] px-3 rounded-lg
              border border-zinc-200
              bg-white text-zinc-800
              focus:outline-none
              focus:ring-2 focus:ring-blue-400
            "
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700">
                Notes / Comments
              </label>

              <textarea
                name="notes"
                rows={3}
                defaultValue={invoice.notes || ""}
                placeholder="Add invoice notes or comments..."
                className="
              w-full px-3 py-2 rounded-lg
              border border-zinc-200
              bg-white text-zinc-800
              focus:outline-none
              focus:ring-2 focus:ring-blue-400
              resize-none
            "
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="
              h-[40px] px-5 rounded-lg
              text-white text-sm font-medium
              bg-gradient-to-r from-blue-500 to-purple-500
              shadow-sm hover:shadow-md
              transition-all duration-200
              cursor-pointer
            "
              >
                Update Invoice
              </button>

              <Link
                href="/invoices"
                className="
                h-[40px] px-5 flex items-center rounded-lg
                border border-zinc-300
                text-sm font-medium text-zinc-700
                hover:bg-zinc-100 transition
                "
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
