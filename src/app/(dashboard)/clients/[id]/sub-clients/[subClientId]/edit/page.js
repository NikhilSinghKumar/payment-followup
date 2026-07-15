import { getClientById } from "@/app/actions/client";
import { getSubClientById, updateSubClient } from "@/app/actions/sub-client";
import SubClientForm from "@/app/(dashboard)/clients/[id]/sub-clients/new/SubclientForm";

export default async function EditSubClientPage({ params }) {
  const { id: clientId, subClientId } = await params;

  const subClient = await getSubClientById(subClientId);
  const client = await getClientById(clientId);

  return (
    <SubClientForm
      client={client}
      clientId={clientId}
      subClient={subClient}
      action={updateSubClient}
      isEdit
    />
  );
}
