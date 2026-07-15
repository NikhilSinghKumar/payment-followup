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

  console.log("Topbar user:", user);

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
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* LEFT */}

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 hover:bg-slate-100"
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

      {/* RIGHT */}

      <div className="flex items-center gap-5">
        <button className="relative rounded-lg p-2 hover:bg-slate-100">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
              {user?.firstName?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="text-left">
              <div className="text-sm font-medium">
                {user ? `${user.firstName} ${user.lastName}` : "Guest"}
              </div>
            </div>

            <ChevronDown size={16} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="text-sm text-slate-500 truncate">
                  {user.email}
                </div>
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut size={14} />
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
