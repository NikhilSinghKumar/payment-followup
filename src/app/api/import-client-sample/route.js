export async function GET() {
  const csv = `company_name, company_code
    Agfa Chemicals Solutions, AGFA
    Prakash Air Frieght India Pvt Ltd, PAFEX`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-client-sample.csv",
    },
  });
}
