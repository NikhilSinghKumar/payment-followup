"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search, X } from "lucide-react";

export default function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);

  // Sync state if URL query param changes externally
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentUrlQuery = searchParams.get("q") || "";
      if (query.trim() !== currentUrlQuery.trim()) {
        const params = new URLSearchParams(searchParams.toString());

        if (query.trim()) {
          params.set("q", query.trim());
        } else {
          params.delete("q");
        }

        startTransition(() => {
          router.push(`${pathname}?${params.toString()}`);
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  function handleClear() {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }
  }

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
        <Search className="h-4 w-4" />
      </div>

      <input
        type="text"
        placeholder="Search by invoice number, company, GST..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-8 text-xs text-zinc-800 placeholder-zinc-400 shadow-2xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500"
      />

      {query && (
        <button
          type="button"
          onClick={handleClear}
          title="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
