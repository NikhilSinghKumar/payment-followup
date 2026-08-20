"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Check,
  AlertCircle,
  ArrowLeft,
  Save,
  KeyRound,
} from "lucide-react";

const INITIAL_STATE = {
  success: false,
  message: null,
};

export default function RoleForm({
  mode = "create",
  companies = [],
  permissions = [],
  initialData = {},
  action,
}) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/roles");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  // Group permissions by module
  const groupedPermissions = permissions.reduce((groups, permission) => {
    if (!groups[permission.module]) {
      groups[permission.module] = [];
    }
    groups[permission.module].push(permission);
    return groups;
  }, {});

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
            <Shield size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isEdit
                ? `Edit Role: ${initialData.roleName}`
                : "Create New Role"}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {isEdit
                ? "Update role definition and permission matrix."
                : "Create a customized role and assign module-level permissions."}
            </p>
          </div>
        </div>

        <Link
          href="/roles"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft size={13} />
          <span>Back to Roles</span>
        </Link>
      </div>

      {/* Form Body */}
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

        {/* SECTION 1: ROLE INFO */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              name="roleName"
              required
              defaultValue={initialData.roleName || ""}
              placeholder="e.g. Finance Officer, Collection Lead"
              className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>

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
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <input
              name="description"
              defaultValue={initialData.description || ""}
              placeholder="Responsibilities and purpose of this role..."
              className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* SECTION 2: PERMISSIONS SELECTION */}
        <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Module Permissions Matrix
            </h3>
            <span className="text-[11px] text-zinc-400">
              Check the permissions granted to this role
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
              <div
                key={moduleName}
                className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40"
              >
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  {moduleName}
                </h4>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {perms.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-700 hover:border-purple-300 transition cursor-pointer dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      <input
                        type="checkbox"
                        name="permissionIds"
                        value={permission.id}
                        defaultChecked={
                          initialData.permissionIds?.includes(permission.id) ??
                          false
                        }
                        className="h-3.5 w-3.5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="capitalize font-medium text-[11px]">
                        {permission.action.replaceAll("_", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialData.isActive !== false}
              className="h-4 w-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
            />
            <span>Active Role</span>
          </label>

          <div className="flex items-center gap-2">
            <Link
              href="/roles"
              className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {pending ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>{isEdit ? "Update Role" : "Create Role"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
