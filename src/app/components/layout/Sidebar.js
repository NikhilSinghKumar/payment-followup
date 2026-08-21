"use client";

import Link from "next/link";
import Image from "next/image";
import { SIDEBAR_NAVIGATION } from "@/lib/navigation";
import SidebarItem from "./SidebarItem";

export default function Sidebar({ collapsed = false }) {
  return (
    <aside
      className={`flex h-screen ${
        collapsed ? "w-16" : "w-52"
      } flex-col border-r border-slate-200/80 bg-white transition-all duration-200 shrink-0 select-none`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-center border-b border-slate-200/80 px-3">
        <Link href="/dashboard" className="flex items-center justify-center">
          <Image
            src="/pafex_logo.png"
            alt="PAFEX Logistics"
            width={collapsed ? 36 : 120}
            height={100}
            priority
            referrerPolicy="no-referrer"
            className="h-12 w-auto object-contain"
          />
        </Link>
      </div>

      {/* Navigation - scrollbar hidden */}
      <div className="flex-1 overflow-y-auto px-2 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {SIDEBAR_NAVIGATION.map((section, index) => (
          <div key={index} className="mb-3.5 last:mb-0">
            {section.title && !collapsed && (
              <h2 className="mb-1 px-2.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </h2>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem key={item.href} {...item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
