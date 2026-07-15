import LocationForm from "@/app/components/client/locations/locationForm";

import { getClientById } from "@/app/actions/client";

export default async function NewClientLocationPage({ params }) {
  const { id } = await params;

  const clientId = Number(id);

  // =====================================
  // INVALID ID
  // =====================================

  if (isNaN(clientId)) {
    return <div className="p-6 text-red-500">Invalid client ID</div>;
  }

  // =====================================
  // GET CLIENT
  // =====================================

  const client = await getClientById(clientId);

  // =====================================
  // CLIENT NOT FOUND
  // =====================================

  if (!client) {
    return <div className="p-6 text-red-500">Client not found</div>;
  }

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="space-y-6 p-6">
      <LocationForm clientId={clientId} client={client} />
    </div>
  );
}
