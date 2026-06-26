import { getSubClientById, updateSubClient } from "@/app/actions/sub-client";
import SubClientForm from "@/app/clients/[id]/sub-clients/new/SubclientForm";

export default async function EditSubClientPage({ params }) {
  const { id: clientId, subClientId } = await params;

  const subClient = await getSubClientById(subClientId);

  return (
    <SubClientForm
      clientId={clientId}
      subClient={subClient}
      action={updateSubClient}
      isEdit
    />
  );
}
