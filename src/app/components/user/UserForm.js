"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Shield,
  Building,
  Lock,
  Check,
  AlertCircle,
  ArrowLeft,
  Save,
} from "lucide-react";

const INITIAL_STATE = {
  success: false,
  message: null,
};

export default function UserForm({
  mode = "create",
  companies = [],
  roles = [],
  initialData = {},
  action,
}) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/users");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <User size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isEdit
                ? `Edit User: ${initialData.firstName} ${initialData.lastName || ""}`
                : "Create New User"}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {isEdit
                ? "Update user profile, company affiliation, and role assignment."
                : "Add a new system user and grant company/role access."}
            </p>
          </div>
        </div>

        <Link
          href="/users"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft size={13} />
          <span>Back to Users</span>
        </Link>
      </div>

      {/* Form Content */}
      <form action={formAction} className="space-y-4 p-5">
        {/* Error / Success Feedback */}
        {state?.message && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
              state.success
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-200"
            }`}
          >
            {state.success ? <Check size={15} /> : <AlertCircle size={15} />}
            <span>{state.message}</span>
            {state.success && (
              <span className="ml-auto text-[11px] font-normal text-emerald-600">
                Redirecting...
              </span>
            )}
          </div>
        )}

        {/* SECTION 1: PERSONAL DETAILS */}
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Personal Information
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                name="firstName"
                required
                defaultValue={initialData.firstName || ""}
                placeholder="John"
                className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Last Name
              </label>
              <input
                name="lastName"
                defaultValue={initialData.lastName || ""}
                placeholder="Doe"
                className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                defaultValue={initialData.email || ""}
                placeholder="john.doe@company.com"
                className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Mobile Number
              </label>
              <input
                name="mobile"
                defaultValue={initialData.mobile || ""}
                placeholder="+91 9876543210"
                className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: COMPANY & ROLE ASSIGNMENT */}
        <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Company & Access Role
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Company <span className="text-red-500">*</span>
              </label>
              <select
                name="companyId"
                required
                defaultValue={initialData.companyId ?? ""}
                className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="roleId"
                required
                defaultValue={initialData.roleId ?? ""}
                className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="">Select Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Designation
              </label>
              <input
                name="designation"
                defaultValue={initialData.designation || ""}
                placeholder="e.g. Accounts Manager"
                className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: SECURITY / PASSWORD */}
        {!isEdit ? (
          <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Security Credentials
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialData.isActive !== false}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Active Account</span>
          </label>

          <div className="flex items-center gap-2">
            <Link
              href="/users"
              className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {pending ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>{isEdit ? "Update User" : "Create User"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
