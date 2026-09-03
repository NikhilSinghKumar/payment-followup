"use client";
import { useActionState, useEffect, useState } from "react";
import { createClient } from "../../../actions/client";
import Alert from "@/app/components/ui/Alert";
import Link from "next/link";

export default function NewClientPage() {
  const [state, formAction] = useActionState(createClient, {});

  return (
    <div className="bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="w-full max-w-xl bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-zinc-200 p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-zinc-800">
              Add New Client
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Enter client details to create a new record
            </p>
          </div>

          <Alert
            key={state?.success || state?.error}
            success={state?.success ? "Client created successfully." : null}
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
                placeholder="e.g. ABC123"
                required
                style={{ textTransform: "uppercase" }}
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div>

            {/* Email */}
            {/* <div>
              <label className="text-sm text-zinc-600 mb-1 block">Email</label>
              <input
                name="email"
                type="email"
                placeholder="e.g. contact@company.com"
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div> */}

            {/* Phone */}
            {/* <div>
              <label className="text-sm text-zinc-600 mb-1 block">Phone</label>
              <input
                name="phone"
                placeholder="e.g. +91 9876543210"
                className="input-primary focus:ring-blue-500 caret-blue-500"
              />
            </div> */}
            {/* GST Number */}
            <div>
              <label className="text-sm text-zinc-600 mb-1 block">
                GST Number.
              </label>
              <input
                name="gstNumber"
                placeholder="e.g. 07ABCDE1234F1Z5"
                className="input-primary focus:ring-blue-500 caret-blue-500"
                maxLength={15}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            {/* TDS Applicable */}
            <div className="flex items-center gap-3">
              <input
                id="tdsApplicable"
                name="tdsApplicable"
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="tdsApplicable"
                className="text-sm text-zinc-600 cursor-pointer"
              >
                Is TDS Applicable ?
              </label>
            </div>

            {/* Opening Balance (Optional) */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-3 dark:border-purple-900/40 dark:bg-purple-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Opening Balance (Optional)
                </span>
                <span className="text-[11px] text-zinc-400">
                  For historical/un-invoiced debt
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">
                    Amount (₹)
                  </label>
                  <input
                    name="openingBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="input-primary focus:ring-purple-500 caret-purple-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">
                    As of Date
                  </label>
                  <input
                    name="openingBalanceDate"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="input-primary focus:ring-purple-500 caret-purple-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-600 mb-1 block">
                  Notes / Reference
                </label>
                <input
                  name="openingBalanceNotes"
                  placeholder="e.g. Previous FY carried forward balance"
                  className="input-primary focus:ring-purple-500 caret-purple-500 bg-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className=" w-full h-[40px] mb-4 px-4 py-2 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
            >
              Save Client
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
