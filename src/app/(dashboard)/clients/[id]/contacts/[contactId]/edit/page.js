import ClientContactForm from "../../_components/client-contact-form";

import { getClientById } from "@/app/actions/client";
import { getClientLocationsByClientId } from "@/app/actions/clientLocations";
import { getClientContactById } from "@/app/actions/clientContacts";

export default async function EditClientContactPage({ params }) {
  const resolvedParams = await params;

  const clientId = Number(resolvedParams.id);

  const contactId = Number(resolvedParams.contactId);

  const client = await getClientById(clientId);

  const locations = await getClientLocationsByClientId(clientId);

  const contact = await getClientContactById(contactId);

  return (
    <ClientContactForm
      clientId={clientId}
      client={client}
      locations={locations}
      contact={contact}
    />
  );
}
