export function getGstAppliedText(gstNumber) {
  if (!gstNumber) {
    return "Not Available";
  }

  const gst = String(gstNumber).trim();

  if (gst.length < 2) {
    return "Not Available";
  }

  return gst.startsWith("07") ? "CGST + SGST (9% + 9%)" : "IGST (18%)";
}

export function getTdsAppliedText(tdsApplicable, tdsRate = 2) {
  if (!tdsApplicable) return "No";
  const rateNum = Number(tdsRate ?? 2);
  const formattedRate = isNaN(rateNum)
    ? "2%"
    : `${rateNum % 1 === 0 ? rateNum.toFixed(0) : rateNum}%`;
  return `Yes (${formattedRate})`;
}
