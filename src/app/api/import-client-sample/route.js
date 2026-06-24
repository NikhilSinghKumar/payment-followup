export async function GET() {
  const csv = `company_name, company_code, gst_number,tds_applicable
    Agfa Chemicals Solutions, AGFA, 27AAGCA3797D1ZK, true
    Prakash Air Frieght India Pvt Ltd, PAFEX, 27AAGCA3797D1ZK, false`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-client-sample.csv",
    },
  });
}
