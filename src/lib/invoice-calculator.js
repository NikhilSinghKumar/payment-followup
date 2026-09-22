/**
 * Invoice Calculator
 *
 * Input:
 * - invoiceAmount
 * - gstNumber
 * - tdsApplicable
 * - deductionAmount
 * - otherCharges
 *
 * Output:
 * - basicAmount
 * - cgstAmount
 * - sgstAmount
 * - igstAmount
 * - tdsAmount
 * - netPayableAmount
 */

const round = (value) => Number(Number(value).toFixed(2));

export function calculateInvoice({
  invoiceAmount,
  gstNumber,
  tdsApplicable = false,
  tdsRate = 2.0,
  deductionAmount = 0,
  otherCharges = 0,
}) {
  // -----------------------------
  // Convert Inputs
  // -----------------------------
  invoiceAmount = Number(invoiceAmount || 0);
  deductionAmount = Number(deductionAmount || 0);
  otherCharges = Number(otherCharges || 0);

  const numTdsRate =
    tdsRate !== undefined && tdsRate !== null && !isNaN(Number(tdsRate))
      ? Number(tdsRate)
      : 2.0;

  // -----------------------------
  // Basic Amount
  // Invoice = Basic + 18% GST
  // -----------------------------
  const basicAmount = round(invoiceAmount / 1.18);

  // -----------------------------
  // GST
  // -----------------------------
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  const gstPrefix = gstNumber?.substring(0, 2);

  if (gstPrefix === "07") {
    // Delhi
    cgstAmount = round(basicAmount * 0.09);
    sgstAmount = round(basicAmount * 0.09);
  } else {
    // Interstate
    igstAmount = round(basicAmount * 0.18);
  }

  // -----------------------------
  // TDS (Dynamic Rate)
  // -----------------------------
  const tdsAmount = tdsApplicable ? round(basicAmount * (numTdsRate / 100)) : 0;

  // -----------------------------
  // Net Payable
  // -----------------------------
  const netPayableAmount = round(
    invoiceAmount - deductionAmount - otherCharges - tdsAmount,
  );

  return {
    invoiceAmount,

    basicAmount,

    cgstAmount,
    sgstAmount,
    igstAmount,

    tdsAmount,

    deductionAmount,
    otherCharges,

    netPayableAmount,

    gstNumberUsed: gstNumber ?? null,
    tdsApplicableUsed: tdsApplicable,
    tdsRateUsed: tdsApplicable ? numTdsRate : 0,
  };
}
