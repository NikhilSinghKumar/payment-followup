import Link from "next/link";

import { getUsers } from "@/app/actions/user";
import UserTable from "../components/user/UserTable";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>

          <p className="text-sm text-slate-500">Manage company users.</p>
        </div>

        <Link
          href="/users/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + New User
        </Link>
      </div>

      <UserTable users={users} />
    </div>
  );
}
