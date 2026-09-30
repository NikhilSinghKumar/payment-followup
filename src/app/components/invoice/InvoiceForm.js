"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";
import InvoiceBasicFields from "./InvoiceBasicFields";
import InvoiceSummary from "./InvoiceSummary";

export default function InvoiceForm({
  client,
  clients = [],
  subClients = [],
  action,
  invoice = {},
  submitLabel = "Save Invoice",
  notificationSettings = null,
}) {
  const [values, setValues] = useState({
    invoiceAmount: invoice.invoiceAmount || "",
    deductionAmount: invoice.deductionAmount || "",
    otherCharges: invoice.otherCharges || "",
    invoiceDate: invoice.invoiceDate
      ? new Date(invoice.invoiceDate).toISOString().split("T")[0]
      : "",
  });

  const [sendEmail, setSendEmail] = useState(
    notificationSettings
      ? Boolean(notificationSettings.sendBillSubmission)
      : true,
  );

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
      {/* Hidden input to pass email trigger preference */}
      <input
        type="hidden"
        name="sendEmail"
        value={sendEmail ? "true" : "false"}
      />

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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 mt-4">
        {/* Manual / Automated Email Trigger Control */}
        <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
          <div className="flex items-center gap-1.5">
            <Mail
              size={14}
              className={sendEmail ? "text-blue-600" : "text-zinc-400"}
            />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Send bill submission email to client contact
            </span>
            {notificationSettings && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  notificationSettings.sendBillSubmission
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                {notificationSettings.sendBillSubmission
                  ? "Automated Default"
                  : "Manual Default"}
              </span>
            )}
          </div>
        </label>

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
