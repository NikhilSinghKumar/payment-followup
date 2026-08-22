"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Save, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { createCompany, updateCompany } from "@/app/actions/company";

const INITIAL_STATE = {
  success: false,
  message: null,
};

export default function CompanyForm({ mode = "create", initialData = {} }) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const actionWithId = isEdit
    ? updateCompany.bind(null, initialData.id)
    : createCompany;

  const [state, formAction, pending] = useActionState(
    actionWithId,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        router.push("/companies");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  return (
    <div className="mx-auto max-w-3xl mt-4 rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <Building2 size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">
              {isEdit
                ? `Edit Company: ${initialData.companyName || ""}`
                : "Create New Company"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isEdit
                ? "Update company credentials, contact details, and bank account."
                : "Register a new company entity in the system."}
            </p>
          </div>
        </div>

        <Link
          href="/companies"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft size={14} />
          <span>Back to List</span>
        </Link>
      </div>

      {/* Form Body */}
      <form action={formAction} className="space-y-5 p-6">
        {/* Toast / Feedback Banner */}
        {state.message && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-semibold ${
              state.success
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-200"
            }`}
          >
            {state.success ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{state.message}</span>
            {state.success && (
              <span className="ml-auto text-[11px] font-normal text-emerald-600">
                Redirecting...
              </span>
            )}
          </div>
        )}

        {/* SECTION 1: BASIC DETAILS */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Company Credentials
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                name="companyName"
                required
                defaultValue={initialData.companyName || ""}
                placeholder="e.g. PAFEX"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Company Code <span className="text-red-500">*</span>
              </label>
              <input
                name="companyCode"
                required
                defaultValue={initialData.companyCode || ""}
                placeholder="e.g. PAFEX"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono uppercase text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                GST Number
              </label>
              <input
                name="gstNumber"
                defaultValue={initialData.gstNumber || ""}
                placeholder="27AAACP1234A1Z5"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono uppercase text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                defaultValue={initialData.email || ""}
                placeholder="billing@company.com"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Phone / Mobile
              </label>
              <input
                name="phone"
                defaultValue={initialData.phone || ""}
                placeholder="+91 98765 43210"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ADDRESS & LOCATION */}
        <div className="border-t border-slate-100 pt-4 dark:border-zinc-800">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Address & Location
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Registered Address
              </label>
              <input
                name="address"
                defaultValue={initialData.address || ""}
                placeholder="Building, Street, Area"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                City
              </label>
              <input
                name="city"
                defaultValue={initialData.city || ""}
                placeholder="e.g. Mumbai"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                State
              </label>
              <input
                name="state"
                defaultValue={initialData.state || ""}
                placeholder="e.g. Maharashtra"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Pincode
              </label>
              <input
                name="pincode"
                defaultValue={initialData.pincode || ""}
                placeholder="400001"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Country
              </label>
              <input
                name="country"
                defaultValue={initialData.country || "India"}
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: BANK DETAILS FOR INVOICES & REMINDERS */}
        <div className="border-t border-slate-100 pt-4 dark:border-zinc-800">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Bank Account & Settlement Coordinates (For Payment Reminders)
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Bank Name
              </label>
              <input
                name="bankName"
                defaultValue={initialData.bankName || ""}
                placeholder="e.g. HDFC Bank"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Account Number
              </label>
              <input
                name="bankAccountNumber"
                defaultValue={initialData.bankAccountNumber || ""}
                placeholder="e.g. 50200012345678"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                IFSC Code
              </label>
              <input
                name="bankIfsc"
                defaultValue={initialData.bankIfsc || ""}
                placeholder="HDFC0000123"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono uppercase text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Branch / UPI ID
              </label>
              <input
                name="bankUpi"
                defaultValue={initialData.bankUpi || ""}
                placeholder="company@hdfcbank"
                className="h-8.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-zinc-800">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialData.isActive !== false}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Active Status</span>
          </label>

          <div className="flex items-center gap-2">
            <Link
              href="/companies"
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {pending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{isEdit ? "Update Company" : "Create Company"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
