"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Shield,
  Building,
  Building2,
  Search,
  Eye,
  Edit2,
} from "lucide-react";

export default function UserTable({ users = [] }) {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const rolesList = Array.from(
    new Set(users.map((u) => u.roleName).filter(Boolean)),
  );

  const departmentsList = Array.from(
    new Set(users.map((u) => u.departmentName).filter(Boolean)),
  );

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.firstName} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    const company = (u.companyName || "").toLowerCase();
    const department = (u.departmentName || "").toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch =
      !query ||
      fullName.includes(query) ||
      email.includes(query) ||
      company.includes(query) ||
      department.includes(query);

    const matchesDepartment =
      departmentFilter === "ALL" || u.departmentName === departmentFilter;

    const matchesRole = roleFilter === "ALL" || u.roleName === roleFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.isActive) ||
      (statusFilter === "INACTIVE" && !u.isActive);

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search by name, email, department, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          {departmentsList.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-8.5 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="ALL">All Departments</option>
              {departmentsList.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Role Filter */}
          {rolesList.length > 0 && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-8.5 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="ALL">All Roles</option>
              {rolesList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8.5 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Compact Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
            <tr>
              <th className="py-2.5 pl-4 pr-3 font-semibold text-zinc-600 dark:text-zinc-400">
                User
              </th>
              <th className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Company
              </th>
              <th className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Department
              </th>
              <th className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Role
              </th>
              <th className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Designation
              </th>
              <th className="py-2.5 px-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Mobile
              </th>
              <th className="py-2.5 px-3 text-center font-semibold text-zinc-600 dark:text-zinc-400">
                Status
              </th>
              <th className="py-2.5 pr-4 pl-3 text-right font-semibold text-zinc-600 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-xs text-zinc-400"
                >
                  No users found matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const initials =
                  `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() ||
                  "U";

                return (
                  <tr
                    key={u.id}
                    className="transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                  >
                    {/* User & Email */}
                    <td className="py-2 pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-900 truncate dark:text-zinc-100">
                            {u.firstName} {u.lastName || ""}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono truncate dark:text-zinc-400">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                      <span className="font-medium">
                        {u.companyName || "—"}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-2 px-3">
                      {u.departmentName ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                          <Building2 size={11} className="text-indigo-500" />
                          <span>{u.departmentName}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="py-2 px-3">
                      {u.roleName ? (
                        <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-100 dark:border-purple-900">
                          {u.roleName}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400">
                      {u.designation || "—"}
                    </td>

                    {/* Mobile */}
                    <td className="py-2 px-3 text-zinc-600 font-mono text-[11px] dark:text-zinc-400">
                      {u.mobile || "—"}
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          u.isActive
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2 pr-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/users/${u.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          title="View user details"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </Link>
                        <Link
                          href={`/users/${u.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-medium text-amber-600 transition hover:border-amber-500 hover:bg-amber-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          title="Edit user"
                        >
                          <Edit2 size={12} />
                          <span>Edit</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Compact Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/60 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
          <span>
            Total: <strong>{filteredUsers.length}</strong>{" "}
            {filteredUsers.length === 1 ? "user" : "users"}
          </span>
          <span className="text-[11px] text-zinc-400">
            PAFEX User & Department Directory
          </span>
        </div>
      </div>
    </div>
  );
}
