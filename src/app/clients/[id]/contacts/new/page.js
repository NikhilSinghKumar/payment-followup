import { getClientById } from "@/app/actions/client";
import { getClientLocationsByClientId } from "@/app/actions/clientLocations";

import ClientContactForm from "../_components/client-contact-form";

export default async function NewClientContactPage({ params }) {
  const resolvedParams = await params;

  const clientId = Number(resolvedParams.id);

  const client = await getClientById(clientId);

  const locations = await getClientLocationsByClientId(clientId);

  return (
    <ClientContactForm
      clientId={clientId}
      client={client}
      locations={locations}
      contact={null}
    />
  );
}
