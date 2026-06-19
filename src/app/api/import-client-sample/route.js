export async function GET() {
  const csv = `company_name, company_code, gst_number
    Agfa Chemicals Solutions, AGFA, 27AAGCA3797D1ZK
    Prakash Air Frieght India Pvt Ltd, PAFEX, 27AAGCA3797D1ZK`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-client-sample.csv",
    },
  });
}
