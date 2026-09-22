export async function GET() {
  const csv = `company_name, company_code, gst_number, tds_applicable, tds_rate, opening_balance, opening_balance_type, opening_balance_date, opening_balance_notes
Agfa Chemicals Solutions, AGFA, 27AAGCA3797D1ZK, true, 2.00, 50000, DEBIT, 2026-04-01, Opening Balance Carried Forward
Prakash Air Frieght India Pvt Ltd, PAFEX, 27AAGCA3797D1ZK, false, 2.00, 0, DEBIT, 2026-04-01,
Acme Global Logistics, ACME, 07AAAAA0000A1Z5, true, 5.00, 15000, CREDIT, 2026-04-01, Advance on Account`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-client-sample.csv",
    },
  });
}
