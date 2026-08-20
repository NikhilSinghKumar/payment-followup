import Link from "next/link";
import { KeyRound, Shield, Plus, Layers } from "lucide-react";
import { getPermissions } from "@/app/actions/permission";
import PermissionTable from "@/app/components/permission/PermissionTable";

export const metadata = {
  title: "Permissions | PAFEX",
  description: "Configure system permissions and RBAC capabilities.",
};

export default async function PermissionsPage() {
  const permissionsList = await getPermissions();

  const totalPerms = permissionsList.length;
  const modulesCount = new Set(permissionsList.map((p) => p.module)).size;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Permissions
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Metrics */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <KeyRound size={13} className="text-purple-500" />
              <span>
                Total: <strong>{totalPerms}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Layers size={13} className="text-blue-500" />
              <span>
                Modules: <strong>{modulesCount}</strong>
              </span>
            </div>
          </div>

          <Link
            href="/permissions/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus size={14} />
            <span>New Permission</span>
          </Link>
        </div>
      </div>

      <PermissionTable permissions={permissionsList} />
    </div>
  );
}
