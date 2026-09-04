export async function GET() {
  const csv = `client_code,sub_client_code,invoices,payment_date,amount,method,receipt_number,reference,notes
AMAZON,AMAZONBR,"INV-AZ0-BR-89/90",07-08-2026,1966.10,upi,R-8739,Ref-8905,Paid by Bihar Subclient
AMAZON,,"INV-AZ0-BR-89/90",08-08-2026,1966.10,bank,R-8740,NEFT-9901,Direct Client Payment`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-payment-sample.csv",
    },
  });
}
