"use client";

import Link from "next/link";
import { useState } from "react";
import InvoiceBasicFields from "./InvoiceBasicFields";
import InvoiceSummary from "./InvoiceSummary";

export default function InvoiceForm({
  client,
  clients = [],
  subClients = [],
  action,
  invoice = {},
  submitLabel = "Save Invoice",
}) {
  const [values, setValues] = useState({
    invoiceAmount: invoice.invoiceAmount || "",
    deductionAmount: invoice.deductionAmount || "",
    otherCharges: invoice.otherCharges || "",
    invoiceDate: invoice.invoiceDate
      ? new Date(invoice.invoiceDate).toISOString().split("T")[0]
      : "",
  });

  const initialSubClient =
    subClients.find((sub) => sub.id === invoice?.subClientId) || null;

  const [selectedClient, setSelectedClient] = useState(client);
  const [selectedSubClient, setSelectedSubClient] = useState(initialSubClient);

  function handleChange(e) {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleClientChange(e) {
    const id = Number(e.target.value);

    const client = clients.find((c) => c.id === id);

    setSelectedClient(client || null);
    setSelectedSubClient(null);
  }

  function handleClientSelect(client) {
    setSelectedClient(client || null);

    // Important:
    // changing parent client clears previous subclient
    setSelectedSubClient(null);
  }

  return (
    <form action={action}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left */}
        <div className="lg:col-span-2">
          <InvoiceBasicFields
            client={client}
            clients={clients}
            subClients={subClients}
            invoice={invoice}
            values={values}
            onChange={handleChange}
            handleClientChange={handleClientChange}
            selectedClient={selectedClient}
            setSelectedClient={setSelectedClient}
            selectedSubClient={selectedSubClient}
            setSelectedSubClient={setSelectedSubClient}
          />
        </div>

        {/* Right */}
        <div>
          <InvoiceSummary
            invoiceAmount={values.invoiceAmount}
            gstNumber={
              selectedSubClient?.gstNumber ?? selectedClient?.gstNumber
            }
            tdsApplicable={
              selectedSubClient
                ? selectedSubClient.tdsApplicable
                : selectedClient?.tdsApplicable
            }
            deductionAmount={values.deductionAmount}
            otherCharges={values.otherCharges}
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          className="h-9 px-5 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
