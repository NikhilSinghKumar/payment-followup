import { createInvoice } from "@/app/actions/invoice";
import Link from "next/link";

export default function NewInvoicePage() {
  const currentFY = "2025-26";

  return (
    <div className="min-h-screen bg-zinc-50 p-4 flex items-center justify-center">
      {/* Container */}
      <div className="w-full max-w-4xl">
        {/* Accent */}
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-4" />

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-4">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-zinc-800">
              Create Invoice
            </h1>

            <p className="text-sm text-zinc-500 mt-1">
              Add a new invoice for your client
            </p>
          </div>

          {/* Form */}
          <form action={createInvoice} className="space-y-4">
            {/* ===================================== */}
            {/* ROW 1 */}
            {/* ===================================== */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {/* Company Code */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">
                  Company Code
                </label>

                <input
                  name="companyCode"
                  placeholder="OTIS"
                  required
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>

              {/* Financial Year */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">
                  Financial Year
                </label>

                <input
                  name="financialYear"
                  defaultValue={currentFY}
                  placeholder="2025-26"
                  required
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>

              {/* Invoice Number */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">
                  Invoice Number
                </label>

                <input
                  name="invoiceNumber"
                  placeholder="INV-001"
                  required
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">
                  Amount (₹)
                </label>

                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>
            </div>

            {/* ===================================== */}
            {/* ROW 2 */}
            {/* ===================================== */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* From Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">
                  From Date
                </label>

                <input
                  name="invoiceFromDate"
                  type="date"
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>

              {/* To Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">
                  To Date
                </label>

                <input
                  name="invoiceToDate"
                  type="date"
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-600">
                  Due Date
                </label>

                <input
                  name="dueDate"
                  type="date"
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>
            </div>

            {/* ===================================== */}
            {/* NOTES */}
            {/* ===================================== */}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-600">
                  Notes (Optional)
                </label>
              </div>

              <textarea
                name="notes"
                rows={4}
                placeholder="Add invoice remarks, payment terms, reference details, GST notes, etc."
                className="w-full rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none transition-all resize-y focus:ring-2focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* ===================================== */}
            {/* ACTIONS */}
            {/* ===================================== */}

            <div className="flex items-center justify-between pt-2">
              {/* Back */}
              <Link
                href="/invoices"
                className="
                  text-sm text-zinc-500
                  hover:text-blue-500
                  transition-colors
                "
              >
                ← Back
              </Link>

              {/* Submit */}
              <button
                type="submit"
                className="
                  h-9 px-5 rounded-lg
                  text-white text-sm font-medium
                  bg-gradient-to-r from-blue-500 to-purple-500
                  shadow-sm hover:shadow-md
                  cursor-pointer transition-all duration-200
                "
              >
                Save Invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
