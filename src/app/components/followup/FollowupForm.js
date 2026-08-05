"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import ClientSummaryCard from "./ClientSummaryCard";
import ClientCombobox from "@/app/components/ui/ClientCombobox";
import FollowupFields from "./FollowupFields";

import { getInvoicesForFollowup, createFollowup } from "@/app/actions/followup";

export default function FollowupForm({ clients = [] }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSummary, setClientSummary] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);

  const [loadingInvoices, setLoadingInvoices] = useState(false);

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

    setSelectedInvoiceIds([]);
    setClientSummary(null);
    setInvoices([]);

    if (!client) {
      return;
    }

    try {
      setLoadingInvoices(true);

      const result = await getInvoicesForFollowup(client.id);

      setClientSummary(result.clientSummary);
      setInvoices(result.invoices);
    } finally {
      setLoadingInvoices(false);
    }
  }

  function toggleInvoice(invoiceId) {
    setSelectedInvoiceIds((current) => {
      if (current.includes(invoiceId)) {
        return current.filter((id) => id !== invoiceId);
      }

      return [...current, invoiceId];
    });
  }

  function selectAllInvoices() {
    setSelectedInvoiceIds(invoices.map((invoice) => invoice.id));
  }

  function clearInvoices() {
    setSelectedInvoiceIds([]);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <form
        action={createFollowup}
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
      >
        {/* Client ID */}
        <input type="hidden" name="clientId" value={selectedClient?.id ?? ""} />

        {/* Selected Invoice IDs */}
        {selectedInvoiceIds.map((invoiceId) => (
          <input
            key={invoiceId}
            type="hidden"
            name="invoiceIds"
            value={invoiceId}
          />
        ))}

        <div className="mt-8 space-y-6 p-8">
          {/* ================================================= */}
          {/* CLIENT */}
          {/* ================================================= */}

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

          <div className="border-t border-zinc-100" />

          {/* ================================================= */}
          {/* RELATED INVOICES */}
          {/* ================================================= */}

          <section>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-zinc-700">
                    Related Invoices
                  </h3>

                  <span className="text-xs font-normal text-zinc-400">
                    Optional
                  </span>
                </div>
              </div>

              {selectedClient && invoices.length > 0 && (
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={selectAllInvoices}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Select all
                  </button>

                  {selectedInvoiceIds.length > 0 && (
                    <button
                      type="button"
                      onClick={clearInvoices}
                      className="font-medium text-zinc-500 hover:text-zinc-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* No Client */}
            {!selectedClient && (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
                <p className="text-sm text-zinc-500">
                  Select a client to view outstanding invoices.
                </p>
              </div>
            )}

            {/* Loading */}
            {selectedClient && loadingInvoices && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
                <p className="text-sm text-zinc-500">Loading invoices...</p>
              </div>
            )}

            {/* No Open Invoices */}
            {selectedClient && !loadingInvoices && invoices.length === 0 && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-zinc-700">
                  No outstanding invoices
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  You can still record a client-level follow-up.
                </p>
              </div>
            )}

            {/* Invoice List */}
            {selectedClient && !loadingInvoices && invoices.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-zinc-200">
                {/* Header */}
                <div className="grid grid-cols-[40px_1.4fr_1fr_1fr_1fr] items-center border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-medium text-zinc-500">
                  <div />

                  <div>Invoice</div>

                  <div>Due Date</div>

                  <div className="text-right">Invoice Amount</div>

                  <div className="text-right">Outstanding</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-zinc-100">
                  {invoices.map((invoice) => {
                    const selected = selectedInvoiceIds.includes(invoice.id);

                    return (
                      <button
                        key={invoice.id}
                        type="button"
                        onClick={() => toggleInvoice(invoice.id)}
                        className={`
                            grid w-full
                            grid-cols-[40px_1.4fr_1fr_1fr_1fr]
                            items-center
                            px-4 py-3
                            text-left
                            transition
                            ${
                              selected
                                ? "bg-blue-50/60"
                                : "bg-white hover:bg-zinc-50"
                            }
                          `}
                      >
                        {/* Checkbox */}
                        <div>
                          <div
                            className={`
                                flex h-5 w-5 items-center justify-center
                                rounded border transition
                                ${
                                  selected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-zinc-300 bg-white"
                                }
                              `}
                          >
                            {selected && <Check size={14} />}
                          </div>
                        </div>

                        {/* Invoice */}
                        <div>
                          <p className="text-sm font-medium text-zinc-800">
                            {invoice.invoiceNumber}
                          </p>

                          {invoice.subClientName && (
                            <p className="mt-0.5 text-xs text-zinc-400">
                              {invoice.subClientName}
                            </p>
                          )}
                        </div>

                        {/* Due Date */}
                        <div className="text-sm text-zinc-600">
                          {formatDate(invoice.dueDate)}
                        </div>

                        {/* Invoice Amount */}
                        <div className="text-right text-sm text-zinc-600">
                          {formatCurrency(invoice.invoiceAmount)}
                        </div>

                        {/* Outstanding */}
                        <div className="text-right text-sm font-medium text-zinc-800">
                          {formatCurrency(invoice.due)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selection count */}
            {selectedInvoiceIds.length > 0 && (
              <p className="mt-2 text-xs text-zinc-500">
                {selectedInvoiceIds.length}{" "}
                {selectedInvoiceIds.length === 1 ? "invoice" : "invoices"}{" "}
                selected
              </p>
            )}
          </section>

          <div className="border-t border-zinc-100" />

          {/* ================================================= */}
          {/* FOLLOW-UP DETAILS */}
          {/* ================================================= */}

          <section>
            <FollowupFields
              values={values}
              onChange={handleChange}
              disabled={!selectedClient}
            />
          </section>
        </div>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="flex items-center justify-end border-t border-zinc-200 bg-zinc-50/70 px-6 py-4">
          <button
            type="submit"
            disabled={!selectedClient}
            className="
              inline-flex h-10 items-center justify-center
              rounded-lg bg-blue-600 px-5
              text-sm font-medium text-white
              shadow-sm transition
              hover:bg-blue-700 cursor-pointer
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

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}
