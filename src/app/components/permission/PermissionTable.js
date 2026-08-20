"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Search, Shield, Edit2, Layers, Tag } from "lucide-react";

export default function PermissionTable({ permissions = [] }) {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");

  const modulesList = Array.from(
    new Set(permissions.map((p) => p.module).filter(Boolean)),
  );

  const filtered = permissions.filter((p) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      p.permissionKey.toLowerCase().includes(query) ||
      p.module.toLowerCase().includes(query) ||
      p.action.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query));

    const matchesModule = moduleFilter === "ALL" || p.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  // Group by module
  const grouped = filtered.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search permissions by key, module, action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-8.5 rounded-xl border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="ALL">All Modules ({modulesList.length})</option>
            {modulesList.map((m) => (
              <option key={m} value={m}>
                {m.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grouped or Table Cards */}
      {Object.keys(grouped).length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          No permissions found matching your search.
        </div>
      ) : (
        <div className="grid gap-4">
          {Object.entries(grouped).map(([moduleName, items]) => (
            <div
              key={moduleName}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Module Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Layers size={13} />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    {moduleName} Module
                  </h3>
                  <span className="rounded-full bg-zinc-200/80 px-2 py-0.2 text-[10px] font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {items.length}{" "}
                    {items.length === 1 ? "permission" : "permissions"}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {items.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex flex-col gap-2 px-4 py-2.5 transition hover:bg-zinc-50/60 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <KeyRound size={12} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {perm.permissionKey}
                          </span>
                          <span className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-semibold uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {perm.action}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {perm.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      {perm.rolesCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          <Shield size={10} />
                          <span>
                            {perm.rolesCount}{" "}
                            {perm.rolesCount === 1 ? "role" : "roles"}
                          </span>
                        </span>
                      )}

                      <Link
                        href={`/permissions/${perm.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-amber-600 transition hover:border-amber-500 hover:bg-amber-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        title="Edit permission"
                      >
                        <Edit2 size={11} />
                        <span>Edit</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
