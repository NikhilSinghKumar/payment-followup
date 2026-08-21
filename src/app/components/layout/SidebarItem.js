"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarItem({
  title,
  href,
  icon: Icon,
  collapsed = false,
  onNavigate,
}) {
  const pathname = usePathname();

  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={() => {
        if (onNavigate) onNavigate();
      }}
      title={collapsed ? title : undefined}
      className={`group flex items-center ${
        collapsed ? "justify-center px-2 py-2" : "gap-3.5 px-5 py-1.5 sm:py-1.5"
      } rounded-lg text-[14px] font-medium transition-all ${
        active
          ? "bg-blue-600 text-white shadow-xs font-semibold"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon size={18} className="shrink-0" />

      {!collapsed && <span className="truncate">{title}</span>}
    </Link>
  );
}
