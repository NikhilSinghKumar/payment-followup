"use client";

import Link from "next/link";

import { SIDEBAR_NAVIGATION } from "@/lib/navigation";

import SidebarItem from "./SidebarItem";

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo */}

      <Link href="/dashboard" className="border-b px-6 py-6">
        <h1 className="text-2xl font-bold text-blue-600">PAYFOLO</h1>

        <p className="text-sm text-slate-500">Payment Follow-up</p>
      </Link>

      {/* Navigation */}

      <div className="flex-1 overflow-y-auto p-4">
        {SIDEBAR_NAVIGATION.map((section, index) => (
          <div key={index} className="mb-8">
            <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </h2>

            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
