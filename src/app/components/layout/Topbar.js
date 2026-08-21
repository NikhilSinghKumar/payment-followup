"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, Menu, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/actions/auth/logout";

export default function Topbar({
  breadcrumbs = [],
  user = {},
  onToggleSidebar,
  onToggleMobileSidebar,
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

  const lastBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
  const previousBreadcrumb =
    breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200/80 bg-white px-3 sm:px-6">
      {/* LEFT */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer shrink-0"
          aria-label="Open Mobile Menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop sidebar toggle button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
          aria-label="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb Navigation - Full on desktop, compact on mobile */}
        {breadcrumbs.length > 0 && (
          <nav className="flex min-w-0 items-center text-xs sm:text-sm">
            {/* Mobile View: Back link / Current page */}
            <div className="flex items-center gap-1 sm:hidden truncate">
              {previousBreadcrumb && previousBreadcrumb.href ? (
                <Link
                  href={previousBreadcrumb.href}
                  className="flex items-center gap-0.5 text-slate-500 hover:text-slate-800"
                >
                  <ChevronLeft size={16} />
                  <span className="truncate max-w-[90px]">
                    {previousBreadcrumb.label}
                  </span>
                </Link>
              ) : null}
              {previousBreadcrumb && <span className="text-slate-300">/</span>}
              <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                {lastBreadcrumb?.label}
              </span>
            </div>

            {/* Desktop / Tablet View: Full Trail */}
            <div className="hidden sm:flex items-center truncate">
              {breadcrumbs.map((item, index) => (
                <div key={item.label || index} className="flex items-center">
                  {index > 0 && <span className="mx-2 text-slate-300">/</span>}
                  {item.href && index < breadcrumbs.length - 1 ? (
                    <Link
                      href={item.href}
                      className="text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        index === breadcrumbs.length - 1
                          ? "font-medium text-slate-800"
                          : "text-slate-500"
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </nav>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-slate-600" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 rounded-lg p-1 sm:px-2 sm:py-1 hover:bg-slate-100 cursor-pointer transition-colors"
            aria-expanded={open}
            aria-label="User Account Menu"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-blue-600 font-semibold text-white text-xs sm:text-sm shrink-0">
              {user?.firstName?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="hidden sm:block text-left max-w-[120px] md:max-w-[160px] truncate">
              <div className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                {user?.firstName
                  ? `${user.firstName} ${user.lastName || ""}`.trim()
                  : "Account"}
              </div>
            </div>

            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-45 z-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
                <div className="text-sm text-slate-500 truncate mt-0.5">
                  {user?.email || "user@example.com"}
                </div>
              </div>

              <div className="p-1.5">
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
