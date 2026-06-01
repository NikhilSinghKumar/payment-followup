export async function GET() {
  const csv = `client_code,name,code,type,address,city,state,pincode,country,gst_number,is_primary,is_active
BENQ,Delhi HO,2344434,head_office,Connaught Place,Delhi,Delhi,110001,India,07ABCDE1234F1Z5,true,true
BENQ,Gurgaon Branch,2344435,branch,Cyber City,Gurgaon,Haryana,122001,India,,false,true`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=client-locations-sample.csv",
    },
  });
}
