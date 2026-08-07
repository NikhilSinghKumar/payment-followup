export async function GET() {
  const csv = `client_code,invoices,payment_date,amount,method,receipt_number,reference,notes
AMAZON,"INV-1234,INV-2345,INV-3456",07-08-2026,100000,upi,R-8739,Ref-8905,New Payment`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-payment-sample.csv",
    },
  });
}
