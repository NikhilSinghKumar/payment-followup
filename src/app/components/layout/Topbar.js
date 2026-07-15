"use client";

import { Bell, ChevronDown, Menu } from "lucide-react";

export default function Topbar({
  breadcrumbs = [],
  user = {},
  onToggleSidebar,
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      {/* ====================================== */}
      {/* LEFT */}
      {/* ====================================== */}

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 hover:bg-slate-100"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>

        <nav className="flex items-center text-sm">
          {breadcrumbs.map((item, index) => (
            <div key={item.label} className="flex items-center">
              {index > 0 && <span className="mx-2 text-slate-300">/</span>}

              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-medium text-slate-800"
                    : "text-slate-500"
                }
              >
                {item.label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* ====================================== */}
      {/* RIGHT */}
      {/* ====================================== */}

      <div className="flex items-center gap-5">
        <button className="relative rounded-lg p-2 hover:bg-slate-100">
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="text-left">
            <div className="text-sm font-medium">{user.name || "Guest"}</div>

            <div className="text-xs text-slate-500">{user.role || ""}</div>
          </div>

          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
