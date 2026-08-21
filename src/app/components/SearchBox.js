"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // ✅ initialize once
  const [query, setQuery] = useState(() => searchParams.get("q") || "");

  useEffect(() => {
    const current = searchParams.get("q") || "";

    if (query === current) return;

    const delay = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }

      router.push(`${pathname}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(delay);
  }, [query, pathname, router]);

  return (
    <input
      type="text"
      placeholder="Search invoices by company, number..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-xs text-zinc-800 placeholder-zinc-400 shadow-2xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500"
    />
  );
}
