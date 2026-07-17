"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createSubClient } from "@/app/actions/sub-client";

export default function SubClientForm({
  client,
  clientId,
  subClient = null,
  action,
  isEdit = false,
}) {
  const formServerAction = action ?? createSubClient.bind(null, clientId);
  const [state, formAction] = useActionState(formServerAction, {});

  return (
    <div className="bg-zinc-50 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/clients" className="hover:text-blue-600 hover:underline">
            Clients
          </Link>

          <span>/</span>
          {/* BreadCrum */}
          <Link
            href={`/clients/${clientId}`}
            className="hover:text-blue-600 hover:underline"
          >
            Parent Client
          </Link>

          <span>/</span>

          <Link
            href={`/clients/${clientId}?tab=sub-clients`}
            className="hover:text-blue-600 hover:underline"
          >
            Sub Clients
          </Link>

          <span>/</span>

          <span className="font-medium text-zinc-700">
            {isEdit ? "Edit" : "New"}
          </span>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-zinc-200 p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-zinc-800">
              {isEdit ? "Edit Sub Client" : "Add Sub Client"}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {isEdit ? "Update Sub Client details" : "Create Sub Client"}
            </p>
          </div>

          {state?.error && (
            <div className="mb-4 rounded bg-red-100 p-3 text-red-600">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="mb-4 rounded bg-green-100 p-3 text-green-600">
              {isEdit
                ? "Sub Client updated successfully."
                : "Sub Client created successfully."}
            </div>
          )}

          <div className="mb-4 rounded-xl">
            <p className="mt-1 text-base font-semibold text-zinc-600">
              {client.companyName}
            </p>

            {client.companyCode && (
              <p className="mt-1 text-sm text-zinc-400">
                {client.companyCode} - {client.gstNumber}
              </p>
            )}
          </div>

          <form action={formAction} className="space-y-4">
            {/* Company Name */}
            {isEdit && (
              <>
                <input type="hidden" name="clientId" value={clientId} />
                <input type="hidden" name="id" value={subClient.id} />
              </>
            )}
            <div>
              <label className="mb-1 block text-sm text-zinc-600">
                Company Name *
              </label>

              <input
                name="companyName"
                required
                defaultValue={subClient?.companyName ?? ""}
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            <div className="flex gap-2">
              {/* Company Code */}
              <div>
                <label className="mb-1 block text-sm text-zinc-600">
                  Company Code *
                </label>

                <input
                  name="companyCode"
                  placeholder="e.g. OTBLR"
                  required
                  defaultValue={subClient?.companyCode ?? ""}
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
                  defaultValue={subClient?.gstNumber ?? ""}
                  className="input-primary input-primary focus:ring-blue-500 caret-blue-500"
                />
              </div>
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
                defaultChecked={subClient?.tdsApplicable ?? false}
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
                {isEdit ? "Update Sub Client" : "Save Sub Client"}
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
