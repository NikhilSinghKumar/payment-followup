import Link from "next/link";
import { Users, UserCheck, UserX, Plus } from "lucide-react";
import { getUsers } from "@/app/actions/user";
import UserTable from "@/app/components/user/UserTable";

export const metadata = {
  title: "Users Management | PAFEX",
  description: "Manage system users, company associations, and security roles.",
};

export default async function UsersPage() {
  const users = await getUsers();

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;

  return (
    <div className="space-y-4">
      {/* Top Header & Compact Metrics */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            User Management
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Metrics */}
          <Link
            href="/users/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus size={14} />
            <span>New User</span>
          </Link>
        </div>
      </div>

      <UserTable users={users} />
    </div>
  );
}
