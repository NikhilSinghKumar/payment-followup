export async function GET() {
  const csv = `company_code,sub_client_code, invoice_number,invoice_date,due_date,payment_terms,invoice_amount,deduction_amount,other_charges,notes
ABC001,ABC001-01,INV-0001,2026-04-10,2026-05-10,30,11800,0,0,April Invoice
ABC001,,INV-0002,2026-04-15,2026-05-15,30,23600,500,0,Second Invoice
XYZ001,,INV-1001,2026-04-20,2026-05-20,30,5900,0,200,Bangalore Office`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-invoice-sample.csv",
    },
  });
}
