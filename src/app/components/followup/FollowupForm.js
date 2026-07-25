"use client";

import { useState } from "react";
import ClientSummaryCard from "./ClientSummaryCard";
import InvoiceCombobox from "./InvoiceCombobox";
import ClientCombobox from "@/app/components/ui/ClientCombobox";
import { getInvoicesForFollowup } from "@/app/actions/followup";
import InvoiceSummaryCard from "./InvoiceSummaryCard";
import FollowupFields from "./FollowupFields";
import { createFollowup } from "@/app/actions/followup";

export default function FollowupForm({ clients = [] }) {
  const [selectedClient, setSelectedClient] = useState(null);

  const [clientSummary, setClientSummary] = useState(null);

  const [invoices, setInvoices] = useState([]);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [values, setValues] = useState({
    followupDate: new Date().toISOString().split("T")[0],
    nextFollowupDate: "",
    note: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleClientChange(client) {
    setSelectedClient(client);

    setSelectedInvoice(null);
    setClientSummary(null);
    setInvoices([]);

    if (!client) return;

    const result = await getInvoicesForFollowup(client.id);

    setClientSummary(result.clientSummary);
    setInvoices(result.invoices);
  }

  return (
    <div className="space-y-6">
      <form action={createFollowup}>
        <input
          type="hidden"
          name="invoiceId"
          value={selectedInvoice?.id ?? ""}
        />
        {/* Client */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Client <span className="text-red-500">*</span>
          </label>
          <ClientCombobox
            clients={clients}
            selectedClient={selectedClient}
            onSelect={handleClientChange}
          />

          {/* <ClientCombobox value={selectedClient} onChange={handleClientChange} /> */}
        </div>

        {/* Client Summary */}
        <ClientSummaryCard summary={clientSummary} />

        {/* Invoice */}
        {selectedClient && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Invoice <span className="text-red-500">*</span>
            </label>

            <div className="rounded-md border p-3 text-sm text-gray-500">
              <InvoiceCombobox
                invoices={invoices}
                value={selectedInvoice?.id}
                onChange={setSelectedInvoice}
                disabled={!selectedClient}
              />
            </div>
          </div>
        )}

        {/* Invoice Summary */}
        <InvoiceSummaryCard invoice={selectedInvoice} />
        <FollowupFields
          values={values}
          onChange={handleChange}
          disabled={!selectedInvoice}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedInvoice}
            className="h-10 rounded-lg bg-blue-600 px-5 text-white disabled:opacity-50"
          >
            Save Follow-up
          </button>
        </div>
      </form>
    </div>
  );
}
