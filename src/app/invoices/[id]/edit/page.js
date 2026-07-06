import { notFound } from "next/navigation";

import InvoiceForm from "@/app/components/invoice/InvoiceForm";

import { getInvoiceById, updateInvoice } from "@/app/actions/invoice";

import { getClientById } from "@/app/actions/client";

export default async function EditInvoicePage({ params }) {
  const { id } = await params;

  const invoice = await getInvoiceById(Number(id));

  if (!invoice) {
    notFound();
  }

  const client = await getClientById(invoice.clientId);

  if (!client) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 flex items-center justify-center">
      {/* Container */}
      <div className="w-full max-w-4xl">
        {/* Accent */}
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-4" />

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-4">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-zinc-800">
              Edit Invoice
            </h1>

            <p className="text-sm text-zinc-500 mt-1">{client?.companyName}</p>

            <p className="text-sm text-zinc-500 mt-1">
              Edit invoice information
            </p>
          </div>
          <InvoiceForm
            client={client}
            invoice={invoice}
            action={updateInvoice.bind(null, id)}
            submitLabel="Update Invoice"
          />
        </div>
      </div>
    </div>
  );
}
