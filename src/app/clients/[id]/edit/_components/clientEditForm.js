"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateClient } from "@/app/actions/client";

export default function ClientEditForm({ client }) {
  const updateClientWithId = updateClient.bind(null, client.id);

  const [state, formAction, pending] = useActionState(updateClientWithId, null);

  return (
    <>
      {/* Top Gradient */}
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-5" />

      {/* Card */}
      <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-zinc-200 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-zinc-800">Edit Client</h2>

          <p className="text-sm text-zinc-500 mt-1">
            Update client details and contact information
          </p>
        </div>

        {/* Error */}
        {state?.error && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm">
            {state.error}
          </div>
        )}

        {/* Success */}
        {state?.success && (
          <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-lg text-sm">
            Client updated successfully
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          {/* Company Name */}
          <div>
            <label className="text-sm text-zinc-600 mb-1 block">
              Company Name *
            </label>

            <input
              name="companyName"
              defaultValue={client.companyName}
              placeholder="e.g. ABC Pvt Ltd"
              required
              className="input-primary focus:ring-blue-500 caret-blue-500"
            />
          </div>

          {/* Company Code */}
          <div>
            <label className="text-sm text-zinc-600 mb-1 block">
              Company Code *
            </label>

            <input
              name="companyCode"
              defaultValue={client.companyCode}
              placeholder="e.g. ABC123"
              required
              className="input-primary focus:ring-blue-500 caret-blue-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full h-[40px] px-4 py-2 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Updating..." : "Update Client"}
          </button>

          {/* Back */}
          <Link
            href="/clients"
            className="inline-block text-sm text-blue-500 hover:underline"
          >
            ← Back to Clients
          </Link>
        </form>
      </div>
    </>
  );
}
