"use client";

import { useMemo } from "react";
import { calculateInvoice } from "@/lib/invoice-calculator";
import { getFinancialYear } from "@/lib/financial-year";
import { getGstAppliedText, getTdsAppliedText } from "@/lib/tax-display";

import InvoiceSummary from "./InvoiceSummary";
import InvoiceTaxSummary from "./InvoiceTaxSummary";

export default function InvoiceCalculator({
  invoiceAmount,
  deductionAmount,
  otherCharges,
  invoiceDate,
  gstNumber,
  tdsApplicable,
}) {
  const summary = useMemo(() => {
    return calculateInvoice({
      invoiceAmount: Number(invoiceAmount || 0),
      deductionAmount: Number(deductionAmount || 0),
      otherCharges: Number(otherCharges || 0),
      gstNumber,
      tdsApplicable,
    });
  }, [invoiceAmount, deductionAmount, otherCharges, gstNumber, tdsApplicable]);

  const financialYear = invoiceDate ? getFinancialYear(invoiceDate) : "-";

  const gstApplied = getGstAppliedText(gstNumber);

  const tdsApplied = getTdsAppliedText(tdsApplicable);

  return (
    <div className="space-y-4">
      <InvoiceSummary {...summary} />

      <InvoiceTaxSummary
        financialYear={financialYear}
        gstNumber={gstNumber}
        gstApplied={gstApplied}
        tdsApplied={tdsApplied}
      />
    </div>
  );
}
