"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import ImportContacts from "@/app/(dashboard)/clients/_components/import-contacts";
import ExportContacts from "@/app/(dashboard)/clients/_components/export-contacts";

export default function ClientContactsTab({ clientId, contacts = [] }) {
  const [selectedContact, setSelectedContact] = useState(null);

  const sortedContacts = [...contacts].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  );

  useEffect(() => {
    if (!selectedContact && sortedContacts.length > 0) {
      setSelectedContact(sortedContacts[0]);
    }
  }, [contacts]);

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
            Manage payment followup contacts.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/clients/${clientId}/contacts/new`}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
          >
            + Add Contact
          </Link>

          <ImportContacts clientId={clientId} />

          <a
            href="/api/client-contacts-sample"
            className="px-3 py-2 text-sm text-blue-600 hover:underline"
          >
            Sample CSV
          </a>

          <ExportContacts clientId={clientId} />
        </div>
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
            {/* CONTACT LIST */}
            <div className="divide-y divide-zinc-100">
              {sortedContacts.map((contact, index) => {
                const isActive = selectedContact?.id === contact.id;

                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full cursor-pointer p-4 text-left transition ${
                      isActive ? "bg-blue-50" : "hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* AVATAR */}
                      {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white">
                        {contact.name?.charAt(0)}
                      </div> */}

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
            {selectedContact && (
              <>
                {/* TOP */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* AVATAR */}
                    {/* <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-semibold text-white">
                      {selectedContact.name?.charAt(0)}
                    </div> */}

                    {/* INFO */}
                    <div>
                      <h2 className="text-xl font-semibold text-zinc-800">
                        {selectedContact.name}
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        {selectedContact.designation || "Contact"}
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2">
                    <Link
                      href={`/clients/${clientId}/contacts/${selectedContact.id}/edit`}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
                    >
                      Edit
                    </Link>
                    <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 cursor-pointer">
                      Call
                    </button>

                    <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 cursor-pointer">
                      WhatsApp
                    </button>

                    <button className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 cursor-pointer">
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
                      {selectedContact.emails?.length > 0 ? (
                        selectedContact.emails.map((email) => (
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
                      {selectedContact.numbers?.length > 0 ? (
                        selectedContact.numbers.map((number) => (
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
