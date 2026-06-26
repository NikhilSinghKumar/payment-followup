"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createSubClient } from "@/app/actions/sub-client";

export default function NewSubClientForm({ clientId }) {
  const createSubClientAction = createSubClient.bind(null, clientId);

  const [state, formAction] = useActionState(createSubClientAction, {});

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-5" />

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-zinc-200 p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-zinc-800">
              Add New Sub Client
            </h2>

            <p className="text-sm text-zinc-500 mt-1">
              Create Sub Client under Parent Client
            </p>
          </div>

          {state?.error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-red-600">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="mb-4 rounded bg-green-100 p-3 text-green-600">
              Sub Client created successfully.
            </div>
          )}

          <form action={formAction} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="mb-1 block text-sm text-zinc-600">
                Company Name *
              </label>

              <input
                name="companyName"
                required
                placeholder="e.g. OTIS Elevator Bangalore"
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* Company Code */}
            <div>
              <label className="mb-1 block text-sm text-zinc-600">
                Company Code
              </label>

              <input
                name="companyCode"
                placeholder="e.g. OTBLR"
                className="input-primary input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* GST */}
            <div>
              <label className="mb-1 block text-sm text-zinc-600">
                GST Number *
              </label>

              <input
                name="gstNumber"
                required
                placeholder="29ABCDE1234F1Z5"
                className="input-primary input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* Address */}
            {/* <div>
              <label className="mb-1 block text-sm text-zinc-600">
                Address
              </label>

              <textarea name="address" rows={3} className="input-primary" />
            </div> */}

            {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-600">City</label>

                <input name="city" className="input-primary" />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  State
                </label>

                <input name="state" className="input-primary" />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  Pincode
                </label>

                <input name="pincode" className="input-primary" />
              </div>
            </div> */}

            {/* TDS */}
            <div className="flex items-center gap-3">
              <input
                id="tdsApplicable"
                name="tdsApplicable"
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 text-blue-600"
              />

              <label
                htmlFor="tdsApplicable"
                className="cursor-pointer text-sm text-zinc-600"
              >
                Is TDS Applicable?
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-5 text-sm font-medium text-white shadow hover:shadow-lg cursor-pointer"
              >
                Save Sub Client
              </button>

              <Link
                href={`/clients/${clientId}?tab=sub-clients`}
                className="flex h-10 items-center rounded-lg border border-zinc-300 px-5 text-sm text-zinc-700 hover:bg-zinc-50"
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
