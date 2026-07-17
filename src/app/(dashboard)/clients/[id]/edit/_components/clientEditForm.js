"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { updateClient } from "@/app/actions/client";
import Alert from "@/app/components/ui/Alert";

export default function ClientEditForm({ client }) {
  const updateClientWithId = updateClient.bind(null, client.id);
  const [state, formAction, pending] = useActionState(updateClientWithId, null);

  return (
    <>
      {/* Card */}
      <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-zinc-200 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-zinc-800">Edit Client</h2>

          <p className="text-sm text-zinc-500 mt-1">Update client details</p>
        </div>

        <Alert
          key={state?.success || state?.error}
          success={state?.success ? "Client updated successfully." : null}
          error={state?.error}
        />

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

          <div className="flex items-center justify-center gap-2">
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

            {/* GST Number */}
            <div>
              <label className="text-sm text-zinc-600 mb-1 block">
                GST Number *
              </label>

              <input
                name="gstNumber"
                defaultValue={client.gstNumber}
                placeholder="e.g. 07ABCDE1234F1Z5"
                required
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="tdsApplicable"
              name="tdsApplicable"
              type="checkbox"
              defaultChecked={client.tdsApplicable}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />

            <label
              htmlFor="tdsApplicable"
              className="text-sm text-zinc-600 cursor-pointer"
            >
              TDS Applicable
            </label>
          </div>
          {/* Status */}
          <div>
            <label className="text-sm text-zinc-600 mb-1 block">Status</label>

            <select
              name="isActive"
              defaultValue={client.isActive ? "true" : "false"}
              className="input-primary focus:ring-blue-500"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={pending}
            className="w-full h-[40px] px-4 py-2 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Updating..." : "Update Client"}
          </button>
        </form>
      </div>
    </>
  );
}
