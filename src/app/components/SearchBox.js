"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const current = searchParams.get("q") || "";
    if (query === current) return;

    const delay = setTimeout(() => {
      if (query) {
        router.push(`${pathname}?q=${query}`);
      } else {
        router.push(pathname);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [query, router, pathname, searchParams]);

  return (
    <input
      type="text"
      placeholder="Search client..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="h-[40px] px-3 rounded-lg border border-zinc-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  );
}
