"use client";

import { useState } from "react";
import { MessageSquareMore } from "lucide-react";

import ClientSummaryCard from "./ClientSummaryCard";
import InvoiceCombobox from "./InvoiceCombobox";
import ClientCombobox from "@/app/components/ui/ClientCombobox";
import InvoiceSummaryCard from "./InvoiceSummaryCard";
import FollowupFields from "./FollowupFields";

import { getInvoicesForFollowup } from "@/app/actions/followup";
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
    <div className="mx-auto w-full max-w-5xl">
      <form
        action={createFollowup}
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
      >
        <input
          type="hidden"
          name="invoiceId"
          value={selectedInvoice?.id ?? ""}
        />

        {/* Form Body */}
        <div className="space-y-4 p-8 mt-8">
          {/* Client Section */}
          <section>
            <div className="max-w-xl">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Client
                <span className="ml-1 text-red-500">*</span>
              </label>

              <ClientCombobox
                clients={clients}
                selectedClient={selectedClient}
                onSelect={handleClientChange}
              />
            </div>

            {clientSummary && (
              <div className="mt-4">
                <ClientSummaryCard summary={clientSummary} />
              </div>
            )}
          </section>

          {/* Divider */}
          <div className="border-t border-zinc-100" />

          {/* Invoice Section */}
          <section>
            <div className="max-w-xl">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Invoice
                <span className="ml-1 text-red-500">*</span>
              </label>

              <InvoiceCombobox
                invoices={invoices}
                value={selectedInvoice?.id}
                onChange={setSelectedInvoice}
                disabled={!selectedClient}
              />
            </div>

            {selectedInvoice && (
              <div className="mt-4">
                <InvoiceSummaryCard invoice={selectedInvoice} />
              </div>
            )}
          </section>

          {/* Divider */}
          <div className="border-t border-zinc-100" />

          {/* Follow-up Section */}
          <section>
            <FollowupFields
              values={values}
              onChange={handleChange}
              disabled={!selectedInvoice}
            />
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-200 bg-zinc-50/70 px-6 py-4">
          <button
            type="submit"
            disabled={!selectedInvoice}
            className="
              inline-flex h-10 items-center justify-center
              rounded-lg bg-blue-600 px-5
              text-sm font-medium text-white
              shadow-sm transition
              hover:bg-blue-700
              focus:outline-none focus:ring-2
              focus:ring-blue-500 focus:ring-offset-2
              disabled:cursor-not-allowed
              disabled:bg-zinc-300
              disabled:text-zinc-500
              disabled:shadow-none
            "
          >
            Save Follow-up
          </button>
        </div>
      </form>
    </div>
  );
}
