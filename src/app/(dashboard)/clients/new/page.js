"use client";
import { useActionState, useEffect, useState } from "react";
import { createClient } from "../../../actions/client";
import Alert from "@/app/components/ui/Alert";
import Link from "next/link";

export default function NewClientPage() {
  const [state, formAction] = useActionState(createClient, {});
  const [tdsEnabled, setTdsEnabled] = useState(false);
  const [tdsRate, setTdsRate] = useState("2.00");
  const [openingType, setOpeningType] = useState("DEBIT");

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

            {/* TDS Applicable & Rate */}
            <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-3.5">
              <div className="flex items-center gap-3">
                <input
                  id="tdsApplicable"
                  name="tdsApplicable"
                  type="checkbox"
                  checked={tdsEnabled}
                  onChange={(e) => setTdsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="tdsApplicable"
                  className="text-sm font-medium text-zinc-700 cursor-pointer"
                >
                  Is TDS Applicable?
                </label>
              </div>

              {tdsEnabled && (
                <div className="pt-2 pl-7 flex items-center gap-3 border-t border-zinc-200/60">
                  <label className="text-xs font-medium text-zinc-600">
                    TDS Rate (%):
                  </label>
                  <div className="relative w-28">
                    <input
                      name="tdsRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={tdsRate}
                      onChange={(e) => setTdsRate(e.target.value)}
                      placeholder="2.00"
                      className="input-primary py-1 px-2.5 text-xs text-right pr-6 focus:ring-blue-500 bg-white"
                    />
                    <span className="absolute right-2.5 top-1 text-xs text-zinc-400 font-semibold">
                      %
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    (Standard is 2%)
                  </span>
                </div>
              )}
            </div>

            {/* Opening Balance (Optional) */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-3 dark:border-purple-900/40 dark:bg-purple-950/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Opening Balance (Optional)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Historical debt or initial credit
                </span>
              </div>

              {/* Type Switcher: Debit vs Credit */}
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                    openingType === "DEBIT"
                      ? "bg-white border-purple-300 text-purple-700 shadow-2xs"
                      : "bg-purple-100/40 border-transparent text-zinc-600 hover:bg-white/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="openingBalanceType"
                    value="DEBIT"
                    checked={openingType === "DEBIT"}
                    onChange={() => setOpeningType("DEBIT")}
                    className="sr-only"
                  />
                  <span>Debit (Dr - Client Owes)</span>
                </label>

                <label
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                    openingType === "CREDIT"
                      ? "bg-white border-emerald-300 text-emerald-700 shadow-2xs"
                      : "bg-purple-100/40 border-transparent text-zinc-600 hover:bg-white/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="openingBalanceType"
                    value="CREDIT"
                    checked={openingType === "CREDIT"}
                    onChange={() => setOpeningType("CREDIT")}
                    className="sr-only"
                  />
                  <span>Credit (Cr - Initial Advance)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-zinc-600 mb-1 block">
                    {openingType === "CREDIT"
                      ? "Initial Credit (₹)"
                      : "Opening Balance (₹)"}
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
                  placeholder={
                    openingType === "CREDIT"
                      ? "e.g. Previous period advance balance"
                      : "e.g. Previous FY carried forward balance"
                  }
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
