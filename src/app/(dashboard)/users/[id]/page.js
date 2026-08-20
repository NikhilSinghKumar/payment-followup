import Link from "next/link";
import { notFound } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Briefcase,
  Calendar,
  Clock,
  ArrowLeft,
  Edit2,
  KeyRound,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
} from "lucide-react";
import { getUserFullDetail } from "@/app/actions/user";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const user = await getUserFullDetail(resolvedParams.id);
  if (!user) return { title: "User Details | PAFEX" };
  return {
    title: `${user.firstName} ${user.lastName || ""} | User Details | PAFEX`,
    description: `Profile and role permissions for ${user.firstName} ${user.lastName || ""}`,
  };
}

export default async function UserDetailPage({ params }) {
  const resolvedParams = await params;
  const user = await getUserFullDetail(resolvedParams.id);

  if (!user) {
    notFound();
  }

  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
    "U";

  // Group permissions by module
  const permissionsByModule = (user.permissions || []).reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const formatDate = (date) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-5 py-2">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft size={14} />
          <span>Back to Users Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/users/${user.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Edit2 size={13} />
            <span>Edit User</span>
          </Link>
        </div>
      </div>

      {/* Main Profile Summary Card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-white p-6 dark:border-zinc-800 dark:from-zinc-800/40 dark:via-zinc-800/20 dark:to-zinc-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-md">
                {initials}
              </div> */}
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {user.firstName} {user.lastName || ""}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      user.isActive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {user.isActive ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={12} />
                        <span>Inactive</span>
                      </>
                    )}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-zinc-500 font-medium dark:text-zinc-400">
                  {user.designation || "Team Member"} •{" "}
                  {user.companyName || "No Company Assigned"}
                </p>
              </div>
            </div>

            {/* Quick Contact Badges */}
            <div className="flex flex-wrap gap-2">
              <a
                href={`mailto:${user.email}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-mono text-zinc-700 hover:border-blue-300 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <Mail size={13} className="text-blue-500" />
                <span>{user.email}</span>
              </a>
              {user.mobile && (
                <a
                  href={`tel:${user.mobile}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-mono text-zinc-700 hover:border-blue-300 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <Phone size={13} className="text-emerald-500" />
                  <span>{user.mobile}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 3-Column Info Grid */}
        <div className="grid grid-cols-1 divide-y border-zinc-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:border-zinc-800 dark:divide-zinc-800">
          {/* Card 1: Company Affiliation */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Building2 size={15} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Company Entity
                </h3>
              </div>
              {user.companyId && (
                <Link
                  href={`/companies/${user.companyId}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  <span>View</span>
                  <ExternalLink size={11} />
                </Link>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                {user.companyName || "—"}
              </div>
              {user.companyCode && (
                <div className="font-mono text-xs text-zinc-500">
                  Code:{" "}
                  <strong className="text-zinc-700 dark:text-zinc-300">
                    {user.companyCode}
                  </strong>
                </div>
              )}
              {user.companyCity && (
                <div className="text-zinc-500">
                  Location:{" "}
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {user.companyCity}
                  </span>
                </div>
              )}
              {user.designation && (
                <div className="text-zinc-500">
                  Designation:{" "}
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {user.designation}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Assigned Role & Access */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                  <Shield size={15} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Security Role
                </h3>
              </div>
              {user.roleId && (
                <Link
                  href={`/roles/${user.roleId}/edit`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline dark:text-purple-400"
                >
                  <span>Edit Role</span>
                  <ExternalLink size={11} />
                </Link>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {user.roleName || "No Role Assigned"}
                </span>
                {user.isSystemRole && (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    System
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {user.roleDescription || "Standard role access rights."}
              </p>
              <div className="text-[11px] text-zinc-400 pt-1">
                Total Capabilities:{" "}
                <strong>{user.permissions?.length || 0} permissions</strong>
              </div>
            </div>
          </div>

          {/* Card 3: Account Timestamps */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Calendar size={15} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Account Timeline
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Registered:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Last Updated:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {formatDate(user.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Last Active:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {formatDate(user.lastLoginAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Breakdown Matrix */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <KeyRound size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Granted Role Permissions
              </h2>
              <p className="text-xs text-zinc-500">
                Capabilities authorized for this user through their assigned
                role (
                <strong className="text-purple-600 dark:text-purple-400">
                  {user.roleName || "None"}
                </strong>
                ).
              </p>
            </div>
          </div>

          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            {user.permissions?.length || 0} Authorized
          </span>
        </div>

        {Object.keys(permissionsByModule).length === 0 ? (
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
            No permissions are assigned to this role yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
              <div
                key={moduleName}
                className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30"
              >
                <div className="mb-2 flex items-center justify-between border-b border-zinc-200/60 pb-1.5 dark:border-zinc-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    {moduleName}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {perms.length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {perms.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-white p-1.5 text-xs dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/60"
                    >
                      <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                        {p.permissionKey}
                      </span>
                      <span className="rounded bg-purple-50 px-1.5 py-0.2 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {p.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
