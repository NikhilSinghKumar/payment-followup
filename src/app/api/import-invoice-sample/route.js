export async function GET() {
  const csv = `company_code,invoice_number,financial_year,amount,invoice_from_date,invoice_to_date,due_date,notes
ABC001,INV-001,2025-26,10000,2025-04-01,2025-04-30,2025-05-15,April invoice
ABC001,INV-002,2025-26,15000,2025-05-01,2025-05-31,2025-06-15,May invoice`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-invoice-sample.csv",
    },
  });
}
