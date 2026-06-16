export async function GET() {
  const csv = `name,designation,department,email,number,is_primary,receives_invoice,receives_followup,receives_escalation,status,notes
Rahul Sharma,Accounts Manager,Accounts,rahul@test.com|accounts@test.com,9876543210|9876543211,true,true,true,false,active,Primary accounts contact
Priya Singh,Finance Executive,Finance,priya.singh@example.com,9876543211,false,true,false,false,active,Handles invoice approvals
Amit Verma,Operations Head,Operations,amit.verma@example.com,9876543212,false,false,true,true,active,Escalation contact
Neha Gupta,Accounts Executive,Accounts,neha.gupta@example.com,9876543213,false,true,false,false,inactive,On leave till next month
Vikas Mehta,Finance Manager,Finance,vikas.mehta@example.com,9876543214,false,true,true,false,active,`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=client-contacts-sample.csv",
    },
  });
}
