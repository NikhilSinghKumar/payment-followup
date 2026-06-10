export async function GET() {
  const csv = `client_code,code,type,address,city,state,pincode,country,gst_number,is_primary,is_active
BENQ,2344434,head_office,Connaught Place,New Delhi,Delhi,110001,India,07ABCDE1234F1Z5,true,true
BENQ,2344435,branch,Cyber City,Gurgaon,Haryana,122001,India,,false,true`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=client-locations-sample.csv",
    },
  });
}
