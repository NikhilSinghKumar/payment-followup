import Link from "next/link";

import { getRoles } from "@/app/actions/role";

import RoleTable from "@/app/components/role/RoleTable";

export default async function RolesPage() {
  const roles = await getRoles();

  return (
    <div className="space-y-6">
      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex items-center justify-end">
        <Link
          href="/roles/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Role
        </Link>
      </div>

      {/* ===================================== */}
      {/* TABLE */}
      {/* ===================================== */}

      <RoleTable roles={roles} />
    </div>
  );
}
