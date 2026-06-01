"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useEffect, useState, useTransition } from "react";

import {
  createClientLocation,
  updateClientLocation,
} from "@/app/actions/clientLocations";

import { CLIENT_LOCATION_TYPES } from "@/lib/validations/clientLocation";

// =====================================================
// INITIAL FORM
// =====================================================

const initialForm = {
  name: "",
  code: "",
  type: "branch",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  gstNumber: "",
  isPrimary: false,
  isActive: true,
};

// =====================================================
// COMPONENT
// =====================================================

export default function LocationForm({ clientId, client, location = null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(initialForm);

  // =====================================================
  // PREFILL
  // =====================================================

  useEffect(() => {
    if (!location) return;

    setForm({
      name: location.name || "",
      code: location.code || "",
      type: location.type || "branch",
      address: location.address || "",
      city: location.city || "",
      state: location.state || "",
      pincode: location.pincode || "",
      country: location.country || "India",
      gstNumber: location.gstNumber || "",
      isPrimary: location.isPrimary || false,
      isActive: location.isActive ?? true,
    });
  }, [location]);

  // =====================================================
  // CHANGE
  // =====================================================

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

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
        let response;

        // =====================================
        // UPDATE
        // =====================================

        if (location?.id) {
          response = await updateClientLocation(location.id, {
            clientId,

            ...form,
          });
        }

        // =====================================
        // CREATE
        // =====================================
        else {
          response = await createClientLocation({
            clientId,

            ...form,
          });
        }

        // =====================================
        // ERROR
        // =====================================

        if (!response?.success) {
          setError(response?.error || "Something went wrong");
          return;
        }

        // =====================================
        // SUCCESS
        // =====================================

        setSuccess(true);

        router.push(`/clients/${clientId}?tab=locations`);
        router.refresh();
      } catch (err) {
        console.error(err);

        setError("Failed to save location");
      }
    });
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* TOP BAR */}
        <div className="mb-5 h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400" />

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {/* LEFT */}
          <div>
            {/* BREADCRUMB */}
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Link href="/clients" className="hover:text-zinc-800">
                Clients
              </Link>

              <span>/</span>

              <Link
                href={`/clients/${clientId}?tab=locations`}
                className="hover:text-zinc-800"
              >
                Locations
              </Link>

              <span>/</span>

              <span className="text-zinc-800">{location ? "Edit" : "New"}</span>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            <Link
              href={`/clients/${clientId}?tab=locations`}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              ← Back to Locations
            </Link>
          </div>
        </div>

        {/* CARD */}
        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-md backdrop-blur-md">
          {/* ===================================== */}
          {/* HEADER */}
          {/* ===================================== */}

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {/* LEFT */}
            <div>
              {/* TITLE */}
              <div className="mt-3">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
                  {location ? "Edit Location" : "Add Location"}
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                  Create and manage office, branch, warehouse, or billing
                  locations.
                </p>
              </div>
            </div>
          </div>

          {/* ===================================== */}
          {/* ALERTS */}
          {/* ===================================== */}

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              Location saved successfully
            </div>
          )}

          <div className="mt-5 py-3">
            <div className="mt-1 flex items-center gap-2">
              <p className="text-base font-semibold text-zinc-800">
                {client.companyName}
              </p>

              <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-zinc-600 border border-zinc-200">
                {client.companyCode}
              </span>
            </div>
          </div>

          {/* ===================================== */}
          {/* FORM */}
          {/* ===================================== */}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ===================================== */}
            {/* ADDRESS */}
            {/* ===================================== */}

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Address
              </h2>

              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  Buildiing No. / Street / Locality
                </label>

                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Enter  Building No. / Street / Locality .."
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>

              {/* GRID */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* NAME */}
                <div>
                  <label className="mb-1 block text-sm text-zinc-600">
                    Location Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Delhi HO"
                    required
                    className="input-primary focus:ring-blue-500 caret-blue-500"
                  />
                </div>
                {/* CODE */}
                <div>
                  <label className="mb-1 block text-sm text-zinc-600">
                    Location Code
                  </label>

                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    placeholder="DL899"
                    className="input-primary focus:ring-blue-500 caret-blue-500"
                  />
                </div>

                {/* TYPE */}
                <div>
                  <label className="mb-1 block text-sm text-zinc-600">
                    Location Type
                  </label>

                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="input-primary focus:ring-blue-500"
                  >
                    {CLIENT_LOCATION_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* GRID */}
            <div className="grid gap-4 md:grid-cols-4">
              {/* CITY */}
              <div>
                <label className="mb-1 block text-sm text-zinc-600">City</label>

                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Delhi"
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>

              {/* STATE */}
              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  State
                </label>

                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Delhi"
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>

              {/* PINCODE */}
              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  Pincode
                </label>

                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="110001"
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>

              {/* COUNTRY */}
              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  Country
                </label>

                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="India"
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>
            </div>

            {/* ===================================== */}
            {/* GST */}
            {/* ===================================== */}

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Tax Information
              </h2>

              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  GST Number
                </label>

                <input
                  name="gstNumber"
                  value={form.gstNumber}
                  onChange={handleChange}
                  placeholder="29ABCDE1234F1Z5"
                  className="input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>
            </div>

            {/* ===================================== */}
            {/* SETTINGS */}
            {/* ===================================== */}

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Settings
              </h2>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* PRIMARY */}
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="isPrimary"
                    checked={form.isPrimary}
                    onChange={handleChange}
                    className="mt-1"
                  />

                  <div>
                    <p className="font-medium text-zinc-800">
                      Primary Location
                    </p>
                  </div>
                </label>

                {/* ACTIVE */}
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="mt-1"
                  />

                  <div>
                    <p className="font-medium text-zinc-800">Active</p>
                  </div>
                </label>
              </div>
            </div>

            {/* ===================================== */}
            {/* ACTIONS */}
            {/* ===================================== */}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={isPending}
                className="h-[44px] rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.01] hover:shadow-lg disabled:opacity-50"
              >
                {isPending
                  ? "Saving..."
                  : location
                    ? "Update Location"
                    : "Create Location"}
              </button>

              <Link
                href={`/clients/${clientId}?tab=locations`}
                className="text-sm text-blue-500 hover:underline"
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
