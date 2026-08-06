export async function GET() {
  const csv = `client_code,payment_date,amount,method,reference,receipt_number,notes
AMAZON,05-08-2026,100000,bank,UTR123456,RCPT001,Payment received
AGFA,06-08-2026,190000,upi,UTR123456,RCPT099,Payment received`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=import-payment-sample.csv",
    },
  });
}
