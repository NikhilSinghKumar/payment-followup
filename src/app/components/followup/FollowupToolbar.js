"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Calendar, X, Plus, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function FollowupToolbar({ totalCount = 0 }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") || "";
  const currentStartDate = searchParams.get("startDate") || "";
  const currentEndDate = searchParams.get("endDate") || "";
  const currentDate = searchParams.get("date") || "";

  const [query, setQuery] = useState(currentQuery);
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  // Close popup on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target)
      ) {
        setIsDateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search query update
  useEffect(() => {
    const timer = setTimeout(() => {
      const urlQuery = searchParams.get("q") || "";
      if (query !== urlQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (query.trim()) {
          params.set("q", query.trim());
        } else {
          params.delete("q");
        }
        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  function applyDateRange(sVal, eVal) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");

    if (sVal) params.set("startDate", sVal);
    else params.delete("startDate");

    if (eVal) params.set("endDate", eVal);
    else params.delete("endDate");

    setIsDateOpen(false);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleApply() {
    applyDateRange(startDate, endDate);
  }

  function handleQuickRange(preset) {
    const today = new Date();
    const formatDateStr = (d) => d.toISOString().slice(0, 10);

    if (preset === "today") {
      const d = formatDateStr(today);
      setStartDate(d);
      setEndDate(d);
      applyDateRange(d, d);
    } else if (preset === "next_7_days") {
      const next7 = new Date(today);
      next7.setDate(next7.getDate() + 7);
      const s = formatDateStr(today);
      const e = formatDateStr(next7);
      setStartDate(s);
      setEndDate(e);
      applyDateRange(s, e);
    } else if (preset === "past_30_days") {
      const past30 = new Date(today);
      past30.setDate(past30.getDate() - 30);
      const s = formatDateStr(past30);
      const e = formatDateStr(today);
      setStartDate(s);
      setEndDate(e);
      applyDateRange(s, e);
    } else if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const s = formatDateStr(firstDay);
      const e = formatDateStr(lastDay);
      setStartDate(s);
      setEndDate(e);
      applyDateRange(s, e);
    } else if (preset === "clear") {
      setStartDate("");
      setEndDate("");
      applyDateRange("", "");
    }
  }

  function clearAllFilters() {
    setQuery("");
    setStartDate("");
    setEndDate("");
    setIsDateOpen(false);
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasActiveDateRange = Boolean(
    currentStartDate || currentEndDate || currentDate,
  );
  const hasActiveFilters = Boolean(currentQuery || hasActiveDateRange);

  let dateLabel = "Date Range";
  if (currentStartDate && currentEndDate) {
    if (currentStartDate === currentEndDate) {
      dateLabel = `Date: ${formatDisplayDate(currentStartDate)}`;
    } else {
      dateLabel = `${formatDisplayDate(currentStartDate)} – ${formatDisplayDate(currentEndDate)}`;
    }
  } else if (currentStartDate) {
    dateLabel = `From ${formatDisplayDate(currentStartDate)}`;
  } else if (currentEndDate) {
    dateLabel = `Until ${formatDisplayDate(currentEndDate)}`;
  } else if (currentDate) {
    dateLabel = `Date: ${formatDisplayDate(currentDate)}`;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search & Date Range Controls */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search Box */}
        <div className="relative min-w-[260px] flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company name, company code..."
            className="h-10 w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-8 text-sm text-zinc-800 placeholder-zinc-400 shadow-xs transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                const params = new URLSearchParams(searchParams.toString());
                params.delete("q");
                startTransition(() => {
                  router.push(`${pathname}?${params.toString()}`);
                });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date Range Dropdown */}
        <div className="relative" ref={dateDropdownRef}>
          <button
            type="button"
            onClick={() => setIsDateOpen((prev) => !prev)}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium shadow-xs transition ${
              hasActiveDateRange
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <Calendar className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            <span className="max-w-[210px] truncate">{dateLabel}</span>
            {hasActiveDateRange && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickRange("clear");
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-blue-200/60 dark:hover:bg-blue-900/60"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </button>

          {/* Date Range Popover */}
          {isDateOpen && (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-76 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:left-auto sm:right-0">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Filter by Date Range
                </span>
                <button
                  type="button"
                  onClick={() => setIsDateOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Quick Presets */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickRange("today")}
                  className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRange("next_7_days")}
                  className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Next 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRange("past_30_days")}
                  className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Past 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRange("this_month")}
                  className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  This Month
                </button>
              </div>

              {/* Date Range Inputs */}
              <div className="mt-3.5 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3.5 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => handleQuickRange("clear")}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!startDate && !endDate}
                  className="rounded-md bg-blue-600 px-3.5 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reset All Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Reset search & date range"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Link
          href="/followups/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} />
          <span>Add Follow-up</span>
        </Link>
      </div>
    </div>
  );
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
