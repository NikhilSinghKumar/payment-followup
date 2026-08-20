"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Check, AlertCircle, ArrowLeft, Save } from "lucide-react";
import { createPermission, updatePermission } from "@/app/actions/permission";

const INITIAL_STATE = {
  success: false,
  message: null,
};

export default function PermissionForm({ mode = "create", initialData = {} }) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const actionWithId = isEdit
    ? updatePermission.bind(null, initialData.id)
    : createPermission;

  const [state, formAction, pending] = useActionState(
    actionWithId,
    INITIAL_STATE,
  );

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/permissions");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
            <KeyRound size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isEdit
                ? `Edit Permission: ${initialData.permissionKey}`
                : "Create New Permission"}
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {isEdit
                ? "Update permission module, key, and capability description."
                : "Define a new granular access key for RBAC system roles."}
            </p>
          </div>
        </div>

        <Link
          href="/permissions"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft size={13} />
          <span>Back to List</span>
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Module Name <span className="text-red-500">*</span>
            </label>
            <input
              name="module"
              required
              defaultValue={initialData.module || ""}
              placeholder="e.g. invoices, clients, payments"
              className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Action Name <span className="text-red-500">*</span>
            </label>
            <input
              name="action"
              required
              defaultValue={initialData.action || ""}
              placeholder="e.g. view, create, edit, export"
              className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Permission Unique Key <span className="text-red-500">*</span>
            </label>
            <input
              name="permissionKey"
              defaultValue={initialData.permissionKey || ""}
              placeholder="e.g. invoices.view (auto-generated if blank)"
              className="h-8.5 w-full rounded-xl border border-zinc-200 px-3 text-xs font-mono text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={initialData.description || ""}
              placeholder="Describe what access or operations this permission grants..."
              className="w-full rounded-xl border border-zinc-200 p-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <Link
            href="/permissions"
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
                <span>
                  {isEdit ? "Update Permission" : "Create Permission"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
