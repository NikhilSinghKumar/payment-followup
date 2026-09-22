export async function GET() {
  const csv = `company_code,sub_client_code,invoice_number,invoice_date,due_date,payment_terms,invoice_amount,deduction_amount,other_charges,tds_rate,notes
ABC001,ABC001-01,INV-0001,2026-04-10,2026-05-10,30,11800,0,0,2.00,April Invoice
ABC001,,INV-0002,2026-04-15,2026-05-15,30,23600,500,0,,Second Invoice (uses client default TDS)
XYZ001,,INV-1001,2026-04-20,2026-05-20,30,5900,0,200,5.00,Bangalore Office (custom 5% TDS)`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-invoice-sample.csv",
    },
  });
}
