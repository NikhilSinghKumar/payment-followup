"use client";

import Link from "next/link";
import { useState } from "react";
import ImportLocations from "@/app/clients/_components/import-locations";

export default function ClientLocationsTab({ clientId, locations = [] }) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  function handleCreate() {
    setSelectedLocation(null);

    setOpen(true);
  }

  function handleEdit(location) {
    setSelectedLocation(location);

    setOpen(true);
  }
  console.log("contact:", locations);
  return (
    <div className="space-y-4">
      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">
            Client Locations
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Manage different locations of your client.
          </p>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/clients/${clientId}/locations/new`}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
          >
            + Add Location
          </Link>

          <ImportLocations />
        </div>
      </div>

      {/* ===================================== */}
      {/* EMPTY STATE */}
      {/* ===================================== */}

      {locations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
            📍
          </div>

          <h3 className="mt-4 text-lg font-semibold text-zinc-800">
            No locations added
          </h3>
        </div>
      ) : (
        /* ===================================== */
        /* LOCATION GRID */
        /* ===================================== */

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => {
            return (
              <div
                key={location.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                {/* TOP */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-800">
                      {location.city}, {location.state}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      {location.pincode}
                    </p>
                    {/* <p className="mt-1 text-sm text-zinc-500">
                      {location.type || "Location"}
                    </p> */}
                  </div>

                  {location.isPrimary && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      Primary
                    </span>
                  )}
                </div>

                {/* ADDRESS */}
                <div className="mt-4 space-y-2 text-sm text-zinc-600">
                  {/* <p>
                    {location.city || "-"}, {location.state || "-"}
                  </p> */}

                  <p>{location.address || "-"}</p>

                  {location.gstNumber && (
                    <p className="font-medium text-zinc-700">
                      GST: {location.gstNumber}
                    </p>
                  )}
                </div>

                {/* FOOTER */}
                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                  {/* <div className="text-xs text-zinc-500">
                    Contacts: {location.contactCount || 0}
                  </div> */}

                  <Link
                    href={`/clients/${clientId}/locations/${location.id}/edit`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
