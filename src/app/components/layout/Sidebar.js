"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { SIDEBAR_NAVIGATION } from "@/lib/navigation";
import SidebarItem from "./SidebarItem";

export default function Sidebar({
  collapsed = false,
  mobileOpen = false,
  onClose,
}) {
  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          role="presentation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Sidebar Element */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-slate-200/80 bg-white select-none transition-all duration-300 ease-in-out lg:static lg:h-screen lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } ${collapsed ? "lg:w-16" : "w-64 sm:w-60 lg:w-56"} shrink-0`}
      >
        {/* Logo & Mobile Close */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 px-4 lg:justify-center lg:px-3">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center justify-center"
          >
            <Image
              src="/pafex_logo.png"
              alt="PAFEX Logistics"
              width={collapsed ? 36 : 120}
              height={32}
              priority
              referrerPolicy="no-referrer"
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation with smooth, visible custom scrollbar */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-2.5 py-3 pb-16">
          {SIDEBAR_NAVIGATION.map((section, index) => (
            <div key={index} className="mb-3 last:mb-0">
              {section.title && !collapsed && (
                <h2 className="mb-1 px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </h2>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    {...item}
                    collapsed={collapsed}
                    onNavigate={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
