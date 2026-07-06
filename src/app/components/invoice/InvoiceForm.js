"use client";

import Link from "next/link";
import { useState } from "react";
import InvoiceBasicFields from "./InvoiceBasicFields";
import InvoiceSummary from "./InvoiceSummary";

export default function InvoiceForm({
  client,
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

  function handleChange(e) {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <form action={action} className="space-y-6">
      <InvoiceBasicFields
        client={client}
        invoice={invoice}
        values={values}
        onChange={handleChange}
      />

      <InvoiceSummary
        invoiceAmount={values.invoiceAmount}
        gstNumber={client?.gstNumber}
        tdsApplicable={client?.tdsApplicable}
        deductionAmount={values.deductionAmount}
        otherCharges={values.otherCharges}
      />

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/invoices"
          className="text-sm text-zinc-500 hover:text-blue-500 transition-colors"
        >
          ← Back to Invoice List
        </Link>

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
