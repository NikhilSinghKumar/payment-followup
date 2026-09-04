export async function GET() {
  const csv = `client_code,sub_client_code,invoices,payment_date,amount,method,receipt_number,reference,notes
AMAZON,AMZ-BLR,"INV-1234,INV-2345,INV-3456",07-08-2026,100000,upi,R-8739,Ref-8905,Paid by Bangalore Subclient
AMAZON,,"INV-4567",08-08-2026,50000,bank,R-8740,NEFT-9901,Direct Client Payment`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-payment-sample.csv",
    },
  });
}
