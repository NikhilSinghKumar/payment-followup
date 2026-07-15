"use client";

import { Building2 } from "lucide-react";
import { useActionState } from "react";

import { createCompany } from "@/app/actions/company";
const INITIAL_STATE = {
  success: false,
  message: null,
};

export default function CompanyForm() {
  const [state, formAction, pending] = useActionState(
    createCompany,
    INITIAL_STATE,
  );
  return (
    <div className="mx-auto max-w-xl mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <div className="flex h-9 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <Building2 className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Create Company
          </h2>

          <p className="text-xs text-slate-500">Enter the company details.</p>
        </div>
      </div>

      <form action={formAction} className="space-y-3 p-4">
        {/* Company */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Company Name
            </label>

            <input
              name="companyName"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Company Code
            </label>

            <input
              name="companyCode"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* GST */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              GST Number
            </label>

            <input
              name="gstNumber"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Phone
            </label>

            <input
              name="phone"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Email
          </label>

          <input
            type="email"
            name="email"
            className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Address */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Address
            </label>

            <input
              name="address"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              City
            </label>

            <input
              name="city"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              State
            </label>

            <input
              name="state"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Country
            </label>

            <input
              name="country"
              defaultValue="India"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Pincode
            </label>

            <input
              name="pincode"
              placeholder="110020"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Active Company
          </label>

          {state.message && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                state.success
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {state.message}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-lg bg-blue-600 px-4 py-3 text-xs text-white disabled:opacity-50 cursor-pointer"
          >
            {pending ? "Saving..." : "Save Company"}
          </button>
        </div>
      </form>
    </div>
  );
}
