"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { createClient } from "@/app/actions/client";
import Alert from "@/app/components/ui/Alert";
import { Building2, CheckCircle2, ArrowRight, Plus, Users } from "lucide-react";

export default function NewClientForm() {
  const [state, formAction, isPending] = useActionState(createClient, null);
  const [tdsEnabled, setTdsEnabled] = useState(false);
  const [tdsRate, setTdsRate] = useState("2.00");
  const [openingType, setOpeningType] = useState("DEBIT");
  const [resetKey, setResetKey] = useState(0);

  if (state?.success) {
    return (
      <div className="bg-zinc-50 flex items-center justify-center p-4 min-h-[500px]">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-md border border-zinc-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-800">
              Client Created Successfully!
            </h2>
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-zinc-700">
                {state.companyName || "The new client"}
              </span>{" "}
              has been added to your database.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            {state.clientId && (
              <Link
                href={`/clients/${state.clientId}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
              >
                View Client Profile <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              href="/clients"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-300 bg-white text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition"
            >
              <Users className="w-4 h-4" /> Clients List
            </Link>

            <button
              type="button"
              onClick={() => {
                setResetKey((prev) => prev + 1);
                window.location.reload();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-dashed border-zinc-300 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition"
            >
              <Plus className="w-4 h-4" /> Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={resetKey}
      className="bg-zinc-50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl">
        {/* Card */}
        <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-md border border-zinc-200 p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-medium text-xs uppercase tracking-wider mb-1">
                <Building2 className="w-4 h-4" /> Client Management
              </div>
              <h2 className="text-2xl font-semibold text-zinc-800">
                Add New Client
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Enter client details to create a new billing and follow-up
                record
              </p>
            </div>
            <Link
              href="/clients"
              className="text-xs text-zinc-500 hover:text-zinc-800 border border-zinc-200 rounded-lg px-2.5 py-1.5 transition"
            >
              Back to List
            </Link>
          </div>

          <Alert key={state?.error} error={state?.error} />

          {/* Form */}
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-zinc-700 mb-1 block">
                  Company Name <span className="text-red-500">*</span>
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
                <label className="text-sm font-medium text-zinc-700 mb-1 block">
                  Company Code <span className="text-red-500">*</span>
                </label>
                <input
                  name="companyCode"
                  placeholder="e.g. ABC123"
                  required
                  style={{ textTransform: "uppercase" }}
                  className="input-primary focus:ring-blue-500 caret-blue-500 font-mono text-sm"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Unique client identifier
                </p>
              </div>

              {/* GST Number (Optional) */}
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 flex items-center justify-between">
                  <span>GST Number</span>
                  <span className="text-xs font-normal text-zinc-400">
                    Optional
                  </span>
                </label>
                <input
                  name="gstNumber"
                  placeholder="e.g. 07ABCDE1234F1Z5"
                  className="input-primary focus:ring-blue-500 caret-blue-500 font-mono text-sm"
                  maxLength={15}
                  style={{ textTransform: "uppercase" }}
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  15-digit GSTIN (if registered)
                </p>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 flex items-center justify-between">
                  <span>Billing / Contact Email</span>
                  <span className="text-xs font-normal text-zinc-400">
                    Optional
                  </span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="accounts@client.com"
                  className="input-primary focus:ring-blue-500 caret-blue-500 text-sm"
                />
              </div>

              {/* Phone (Optional) */}
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1 flex items-center justify-between">
                  <span>Contact Phone</span>
                  <span className="text-xs font-normal text-zinc-400">
                    Optional
                  </span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  className="input-primary focus:ring-blue-500 caret-blue-500 text-sm"
                />
              </div>

              {/* Address (Optional) */}
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-zinc-700 mb-1 flex items-center justify-between">
                  <span>Registered Address</span>
                  <span className="text-xs font-normal text-zinc-400">
                    Optional
                  </span>
                </label>
                <input
                  name="address"
                  placeholder="e.g. Suite 402, Business Bay, Mumbai"
                  className="input-primary focus:ring-blue-500 caret-blue-500 text-sm"
                />
              </div>
            </div>

            {/* TDS Applicable & Rate */}
            <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 mt-2">
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
                  className="text-sm font-medium text-zinc-700 cursor-pointer select-none"
                >
                  Is TDS Applicable for this Client?
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
            <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
                  Opening Balance (Optional)
                </span>
                <span className="text-[11px] text-zinc-400">
                  Historical debt or initial advance
                </span>
              </div>

              {/* Type Switcher: Debit vs Credit */}
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                    openingType === "DEBIT"
                      ? "bg-white border-purple-300 text-purple-700 shadow-2xs font-semibold"
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
                      ? "bg-white border-emerald-300 text-emerald-700 shadow-2xs font-semibold"
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
                  <label className="text-xs font-medium text-zinc-600 mb-1 block">
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
                  <label className="text-xs font-medium text-zinc-600 mb-1 block">
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
                <label className="text-xs font-medium text-zinc-600 mb-1 block">
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

            {/* Submit & Cancel Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-[42px] px-4 py-2 rounded-xl text-white text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving Client..." : "Save Client"}
              </button>
              <Link
                href="/clients"
                className="h-[42px] px-5 flex items-center justify-center rounded-xl text-zinc-600 text-sm font-medium border border-zinc-200 hover:bg-zinc-100 transition"
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
