"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { logout } from "@/app/actions/auth/logout";

export default function Topbar({
  breadcrumbs = [],
  user = {},
  onToggleSidebar,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-zinc-600 transition hover:bg-zinc-100"
        >
          <Menu size={20} />
        </button>

        <nav className="flex items-center text-sm">
          {breadcrumbs.map((item, index) => (
            <div key={item.label} className="flex items-center">
              {index > 0 && <span className="mx-2 text-zinc-300">/</span>}

              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-semibold text-zinc-800"
                    : "text-zinc-500"
                }
              >
                {item.label}
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        {/* Notification */}
        <button className="relative rounded-xl p-2 text-zinc-600 transition hover:bg-zinc-100">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 rounded-xl bg-white px-3 py-1.5 transition hover:bg-zinc-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 font-semibold text-white shadow-sm">
              {user?.firstName?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="text-left leading-tight">
              <div className="text-sm font-medium text-zinc-800">
                {user ? `${user.firstName} ${user.lastName}` : "Guest"}
              </div>
            </div>

            <ChevronDown
              size={16}
              className={`text-zinc-500 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
              <div className="border-b border-zinc-200 px-4 py-3">
                <div className="truncate text-sm text-zinc-500">
                  {user.email}
                </div>
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
