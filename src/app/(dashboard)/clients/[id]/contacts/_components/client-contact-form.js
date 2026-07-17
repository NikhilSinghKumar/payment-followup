"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useEffect, useState, useTransition } from "react";
import ContactPreferencesSection from "./contact-preferences-section";
import ContactEmailsSection from "./contact-emails-section";
import ContactLocationsSection from "./contact-locations-section";
import ContactInformationSection from "./contact-information-section";
import ContactNumbersSection from "./contact-numbers-section";

import {
  createClientContact,
  updateClientContact,
} from "@/app/actions/clientContacts";

const initialForm = {
  name: "",
  designation: "",
  department: "",

  status: "active",

  isPrimary: false,

  receivesInvoice: false,
  receivesFollowup: false,
  receivesEscalation: false,

  notes: "",
};

// =====================================================
// COMPONENT
// =====================================================

export default function ClientContactForm({
  clientId,
  client,
  locations = [],
  contact = null,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [emails, setEmails] = useState([
    {
      email: "",
      label: "work",
      isPrimary: true,
    },
  ]);

  const [numbers, setNumbers] = useState([
    {
      number: "",
      type: "mobile",
      countryCode: "+91",
      isPrimary: true,
      isWhatsapp: false,
    },
  ]);

  const [selectedLocations, setSelectedLocations] = useState([]);

  // =====================================================
  // PREFILL
  // =====================================================

  useEffect(() => {
    if (!contact) return;

    setForm({
      name: contact.name || "",
      designation: contact.designation || "",
      department: contact.department || "",
      status: contact.status || "active",
      isPrimary: contact.isPrimary || false,
      receivesInvoice: contact.receivesInvoice || false,
      receivesFollowup: contact.receivesFollowup || false,
      receivesEscalation: contact.receivesEscalation || false,
      notes: contact.notes || "",
    });

    setEmails(
      contact.emails?.length
        ? contact.emails
        : [
            {
              email: "",
              label: "work",
              isPrimary: true,
            },
          ],
    );

    setNumbers(
      contact.numbers?.length
        ? contact.numbers
        : [
            {
              number: "",
              type: "mobile",
              countryCode: "+91",
              isPrimary: true,
              isWhatsapp: false,
            },
          ],
    );

    setSelectedLocations(
      contact.locations?.map((location) => location.id) || [],
    );
  }, [contact]);

  // =====================================================
  // CHANGE
  // =====================================================

  function handleChange(e) {
    const { name, value, checked, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess(false);

    startTransition(async () => {
      try {
        const payload = {
          clientId,
          ...form,
          emails: emails.filter((email) => email.email.trim()),
          numbers: numbers.filter((number) => number.number.trim()),
          locationIds: selectedLocations,
        };

        let response;
        if (contact?.id) {
          response = await updateClientContact(contact.id, payload);
        } else {
          response = await createClientContact(payload);
        }

        if (!response?.success) {
          setError(response?.error || "Something went wrong");
          return;
        }

        setSuccess(true);
        router.push(`/clients/${clientId}?tab=contacts`);
        router.refresh();
      } catch (err) {
        console.error(err);
        setError("Failed to save contact");
      }
    });
  }

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto w-full max-w-4xl">
        {/* BREADCRUMB */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Link href="/clients" className="hover:text-zinc-800">
                Clients
              </Link>

              <span>/</span>

              <Link
                href={`/clients/${clientId}?tab=contacts`}
                className="hover:text-zinc-800"
              >
                Contacts
              </Link>

              <span>/</span>

              <span className="text-zinc-800">{contact ? "Edit" : "New"}</span>
            </div>
          </div>
        </div>

        {/* CARD */}

        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-md backdrop-blur-md">
          {/* TITLE */}

          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              {contact ? "Edit Contact" : "Add Contact"}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage payment follow-up contacts.
            </p>
          </div>

          {/* ALERTS */}

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              Contact saved successfully
            </div>
          )}

          {/* CLIENT */}

          <div className="py-3">
            <div className="mt-1 flex items-center gap-2">
              <p className="text-base font-semibold text-zinc-800">
                {client.companyName}
              </p>

              <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-600">
                {client.companyCode}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <ContactInformationSection
              form={form}
              handleChange={handleChange}
            />

            <ContactPreferencesSection
              form={form}
              handleChange={handleChange}
            />

            <ContactEmailsSection emails={emails} setEmails={setEmails} />

            <ContactNumbersSection numbers={numbers} setNumbers={setNumbers} />

            {/* <ContactLocationsSection
              locations={locations}
              selectedLocations={selectedLocations}
              setSelectedLocations={setSelectedLocations}
            /> */}

            {/* ===================================== */}
            {/* ACTIONS */}
            {/* ===================================== */}

            <div className="flex justify-start gap-3 border-t border-zinc-200 pt-6">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isPending
                  ? "Saving..."
                  : contact
                    ? "Update Contact"
                    : "Create Contact"}
              </button>

              <Link
                href={`/clients/${clientId}?tab=contacts`}
                className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
