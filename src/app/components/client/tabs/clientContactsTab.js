export default function ClientContactsTab({ contacts = [] }) {
  return (
    <div className="space-y-4">
      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">
            Client Contacts
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Manage billing, operational, and payment followup contacts.
          </p>
        </div>

        <button className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md">
          + Add Contact
        </button>
      </div>

      {/* ===================================== */}
      {/* EMPTY STATE */}
      {/* ===================================== */}

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
            👤
          </div>

          <h3 className="mt-4 text-lg font-semibold text-zinc-800">
            No contacts added
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Add contact persons for billing, payments, operations, or
            escalations.
          </p>

          <button className="mt-5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md">
            + Add First Contact
          </button>
        </div>
      ) : (
        /* ===================================== */
        /* CONTACT GRID */
        /* ===================================== */

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* ===================================== */}
          {/* LEFT SIDEBAR */}
          {/* ===================================== */}

          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {/* SEARCH */}
            <div className="border-b border-zinc-200 p-4">
              <input
                placeholder="Search contacts..."
                className="input-primary"
              />
            </div>

            {/* CONTACT LIST */}
            <div className="divide-y divide-zinc-100">
              {contacts.map((contact, index) => {
                const isActive = index === 0;

                return (
                  <button
                    key={contact.id}
                    className={`w-full cursor-pointer p-4 text-left transition ${
                      isActive ? "bg-blue-50" : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* AVATAR */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white">
                        {contact.name?.charAt(0)}
                      </div>

                      {/* INFO */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium text-zinc-800">
                          {contact.name}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {contact.designation || "Contact"}
                        </p>

                        {/* TAGS */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {contact.isPrimary && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                              Primary
                            </span>
                          )}

                          {contact.locations?.length > 0 && (
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                              {contact.locations.length} Locations
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===================================== */}
          {/* CONTACT DETAIL */}
          {/* ===================================== */}

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            {/* TEMPORARY */}
            {/* Later we will connect selected contact */}

            {contacts[0] && (
              <>
                {/* TOP */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* AVATAR */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-semibold text-white">
                      {contacts[0].name?.charAt(0)}
                    </div>

                    {/* INFO */}
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-800">
                        {contacts[0].name}
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        {contacts[0].designation || "Contact"}
                      </p>

                      {contacts[0].department && (
                        <p className="mt-1 text-sm text-zinc-500">
                          {contacts[0].department}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100">
                      Call
                    </button>

                    <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100">
                      WhatsApp
                    </button>

                    <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100">
                      Email
                    </button>
                  </div>
                </div>

                {/* GRID */}
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {/* EMAILS */}
                  <div className="rounded-xl border border-zinc-200 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                      Emails
                    </h3>

                    <div className="mt-3 space-y-2">
                      {contacts[0].emails?.length > 0 ? (
                        contacts[0].emails.map((email) => (
                          <div
                            key={email.id}
                            className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
                          >
                            {email.email}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500">No emails</p>
                      )}
                    </div>
                  </div>

                  {/* NUMBERS */}
                  <div className="rounded-xl border border-zinc-200 p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                      Numbers
                    </h3>

                    <div className="mt-3 space-y-2">
                      {contacts[0].numbers?.length > 0 ? (
                        contacts[0].numbers.map((number) => (
                          <div
                            key={number.id}
                            className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
                          >
                            {number.number}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-500">No numbers</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* LOCATIONS */}
                <div className="mt-4 rounded-xl border border-zinc-200 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    Assigned Locations
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {contacts[0].locations?.length > 0 ? (
                      contacts[0].locations.map((location) => (
                        <span
                          key={location.id}
                          className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                        >
                          {location.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500">
                        No locations assigned
                      </p>
                    )}
                  </div>
                </div>

                {/* NOTES */}
                <div className="mt-4 rounded-xl border border-zinc-200 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    Notes
                  </h3>

                  <p className="mt-3 text-sm text-zinc-700">
                    {contacts[0].notes || "No notes added."}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
