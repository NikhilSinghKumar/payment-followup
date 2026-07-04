import Link from "next/link";
import { createInvoice } from "@/app/actions/invoice";
import { getClientById } from "@/app/actions/client";
import InvoiceBasicFields from "@/app/components/invoice/InvoiceBasicFields";
import InvoiceSummary from "@/app/components/invoice/InvoiceSummary";

export default async function NewInvoicePage({ searchParams }) {
  const params = await searchParams;

  const clientId = Number(params.clientId);

  let client = null;

  if (!isNaN(clientId)) {
    client = await getClientById(clientId);
  }

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

            <p className="text-sm text-zinc-500 mt-1">{client?.companyName}</p>

            <p className="text-sm text-zinc-500 mt-1">
              Add a new invoice for your client
            </p>
          </div>

          {/* Form */}
          <form action={createInvoice} className="space-y-6">
            <InvoiceBasicFields client={client} invoice={{}} />

            {/* InvoiceSummary will become interactive in the next step */}
            <InvoiceSummary
              invoiceAmount={0}
              gstNumber={client?.gstNumber}
              tdsApplicable={client?.tdsApplicable}
              deductionAmount={0}
              otherCharges={0}
            />

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/invoices"
                className="
                  text-sm text-zinc-500
                  hover:text-blue-500
                  transition-colors
                "
              >
                ← Back to Invoice List
              </Link>

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
