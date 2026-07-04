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

export function getTdsAppliedText(tdsApplicable) {
  return tdsApplicable ? "Yes (2%)" : "No";
}
