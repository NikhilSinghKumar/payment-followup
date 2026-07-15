export default function ContactLocationsSection({
  locations = [],
  selectedLocations,
  setSelectedLocations,
}) {
  // =====================================
  // TOGGLE LOCATION
  // =====================================

  function toggleLocation(locationId) {
    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId],
    );
  }

  return (
    <div className="space-y-4">
      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Assigned Locations
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Select one or more locations where this contact is responsible.
        </p>
      </div>

      {/* ===================================== */}
      {/* EMPTY STATE */}
      {/* ===================================== */}

      {locations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
          <p className="text-sm text-zinc-500">
            No client locations available.
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            Create locations first before assigning contacts.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {locations.map((location) => (
            <label
              key={location.id}
              className={`cursor-pointer rounded-2xl border p-4 transition ${
                selectedLocations.includes(location.id)
                  ? "border-blue-500 bg-blue-50"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* CHECKBOX */}

                <input
                  type="checkbox"
                  checked={selectedLocations.includes(location.id)}
                  onChange={() => toggleLocation(location.id)}
                  className="mt-1"
                />

                {/* INFO */}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-zinc-800">{location.name}</p>

                    {location.isPrimary && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        Primary
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-zinc-500">
                    {[location.city, location.state].filter(Boolean).join(", ")}
                  </div>

                  {location.code && (
                    <div className="mt-2">
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
                        {location.code}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
