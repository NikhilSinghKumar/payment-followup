"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarItem({ title, href, icon: Icon }) {
  const pathname = usePathname();

  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
        active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <Icon size={20} />

      <span className="text-sm font-medium">{title}</span>
    </Link>
  );
}
