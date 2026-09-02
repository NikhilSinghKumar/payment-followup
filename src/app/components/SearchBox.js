"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef, useTransition } from "react";
import { Search, X } from "lucide-react";

export default function SearchBox({
  placeholder = "Search by invoice number, company, GST...",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);

  // Track what value this component last dispatched to prevent server response echo
  const lastDispatchedRef = useRef(urlQuery.trim());
  const isFocusedRef = useRef(false);

  // Sync state ONLY if URL query changed externally (e.g., browser back/forward or tab switch)
  // and the user is NOT actively typing inside the search input
  useEffect(() => {
    const trimmedUrlQuery = urlQuery.trim();
    if (
      trimmedUrlQuery !== lastDispatchedRef.current &&
      !isFocusedRef.current
    ) {
      setQuery(urlQuery);
      lastDispatchedRef.current = trimmedUrlQuery;
    }
  }, [urlQuery]);

  // Debounced search dispatch
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedQuery = query.trim();
      const currentUrlQuery = (searchParams.get("q") || "").trim();

      if (trimmedQuery !== currentUrlQuery) {
        lastDispatchedRef.current = trimmedQuery;
        const params = new URLSearchParams(searchParams.toString());

        if (trimmedQuery) {
          params.set("q", trimmedQuery);
        } else {
          params.delete("q");
        }

        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  function handleClear() {
    setQuery("");
    lastDispatchedRef.current = "";
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedQuery = query.trim();
      lastDispatchedRef.current = trimmedQuery;
      const params = new URLSearchParams(searchParams.toString());
      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
        placeholder={placeholder}
        value={query}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
        }}
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
