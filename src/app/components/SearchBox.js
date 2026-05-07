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
      placeholder="Search..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="h-[40px] px-3 rounded-lg border border-zinc-300 text-sm bg-white dark:placeholder:text-zinc-500 dark:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  );
}
