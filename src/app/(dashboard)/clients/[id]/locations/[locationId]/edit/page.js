import LocationForm from "@/app/components/client/locations/locationForm";

import { getClientById } from "@/app/actions/client";

import { getClientLocationById } from "@/app/actions/clientLocations";

export default async function EditClientLocationPage({ params }) {
  const { id, locationId } = await params;

  const clientId = Number(id);

  const parsedLocationId = Number(locationId);

  // =====================================
  // INVALID IDS
  // =====================================

  if (isNaN(clientId) || isNaN(parsedLocationId)) {
    return <div className="p-6 text-red-500">Invalid ID</div>;
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
  // GET LOCATION
  // =====================================

  const location = await getClientLocationById(parsedLocationId);

  // =====================================
  // LOCATION NOT FOUND
  // =====================================

  if (!location) {
    return <div className="p-6 text-red-500">Location not found</div>;
  }

  // =====================================
  // SECURITY CHECK
  // =====================================

  if (location.clientId !== clientId) {
    return <div className="p-6 text-red-500">Unauthorized location access</div>;
  }

  // =====================================
  // PAGE
  // =====================================

  return (
    <div className="space-y-6 p-6">
      <LocationForm clientId={clientId} client={client} location={location} />
    </div>
  );
}
