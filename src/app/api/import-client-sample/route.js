export async function GET() {
  const csv = `company_name, company_code, gst_number, tds_applicable, opening_balance, opening_balance_date
Agfa Chemicals Solutions, AGFA, 27AAGCA3797D1ZK, true, 50000, 2026-04-01
Prakash Air Frieght India Pvt Ltd, PAFEX, 27AAGCA3797D1ZK, false, 0, 2026-04-01`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-client-sample.csv",
    },
  });
}
