import { createInvoice } from "@/app/actions/invoice";
import { getClientById, getClients } from "@/app/actions/client";
import InvoiceForm from "@/app/components/invoice/InvoiceForm";
import { getSubClients } from "@/app/actions/sub-client";

export default async function NewInvoicePage({ searchParams }) {
  const params = await searchParams;

  const clientId = Number(params.clientId);
  const clients = await getClients();
  const subClients = await getSubClients();

  let client = null;

  if (!isNaN(clientId)) {
    client = await getClientById(clientId);
  }

  return (
    <div className="bg-zinc-50 flex items-center justify-center">
      {/* Container */}
      <div className="w-full max-w-4xl">
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
          <InvoiceForm
            client={client}
            clients={clients}
            subClients={subClients}
            action={createInvoice}
            submitLabel="Save Invoice"
          />
        </div>
      </div>
    </div>
  );
}
