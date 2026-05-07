import { createInvoice } from "@/app/actions/invoice";
import Link from "next/link";

export default function NewInvoicePage() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6 flex items-center justify-center">
      {/* Container */}
      <div className="w-full max-w-lg">
        {/* Gradient Accent */}
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-6" />

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-md p-6 space-y-5">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-zinc-800">
              Create Invoice
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Add a new invoice for your client
            </p>
          </div>

          {/* Form */}
          <form action={createInvoice} className="space-y-4">
            {/* Company Code */}
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Company Code</label>
              <input
                name="companyCode"
                placeholder="e.g. OTIS"
                required
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Amount (₹)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount"
                required
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-zinc-600">From Date</label>
                <input
                  name="invoiceFromDate"
                  type="date"
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-zinc-600">To Date</label>
                <input
                  name="invoiceToDate"
                  type="date"
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-sm text-zinc-600">Due Date</label>
              <input
                name="dueDate"
                type="date"
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="
                w-full h-[44px] rounded-lg text-white text-sm font-medium
                bg-gradient-to-r from-blue-500 to-purple-500
                shadow-md hover:shadow-lg cursor-pointer
                transition-all duration-200
                hover:scale-[1.02]
              "
            >
              Save Invoice
            </button>

            <Link
              href="/invoices"
              className="text-sm text-blue-500 hover:underline"
            >
              ← Back to Invoice list
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
