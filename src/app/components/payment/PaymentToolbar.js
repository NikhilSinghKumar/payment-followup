"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Calendar, X, Plus, Mail } from "lucide-react";
import Link from "next/link";
import ImportPayments from "./ImportPayments";
import ExportPayments from "./ExportPayments";
import BulkPaymentNotificationModal from "./BulkPaymentNotificationModal";

export default function PaymentToolbar({ totalCount = 0 }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") || "";
  const currentDate = searchParams.get("date") || "";
  const currentStartDate = searchParams.get("startDate") || "";
  const currentEndDate = searchParams.get("endDate") || "";

  const [query, setQuery] = useState(currentQuery);
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  // Sync internal states when URL params change
  useEffect(() => {
    setSelectedDate(currentDate);
  }, [currentDate]);

  useEffect(() => {
    setStartDate(currentStartDate);
  }, [currentStartDate]);

  useEffect(() => {
    setEndDate(currentEndDate);
  }, [currentEndDate]);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

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

  function applyDateFilter(dateVal, startVal, endVal) {
    const params = new URLSearchParams(searchParams.toString());

    if (dateVal) {
      params.set("date", dateVal);
      params.delete("startDate");
      params.delete("endDate");
    } else if (startVal || endVal) {
      params.delete("date");
      if (startVal) params.set("startDate", startVal);
      else params.delete("startDate");
      if (endVal) params.set("endDate", endVal);
      else params.delete("endDate");
    } else {
      params.delete("date");
      params.delete("startDate");
      params.delete("endDate");
    }

    setIsDateOpen(false);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function handleSingleDateApply() {
    if (!selectedDate) return;
    setStartDate("");
    setEndDate("");
    applyDateFilter(selectedDate, "", "");
  }

  function handleApplyRange() {
    setSelectedDate("");
    applyDateFilter("", startDate, endDate);
  }

  function handleQuickDate(preset) {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const formatDateStr = (d) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === "today") {
      const d = formatDateStr(today);
      setSelectedDate(d);
      setStartDate("");
      setEndDate("");
      applyDateFilter(d, "", "");
    } else if (preset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const d = formatDateStr(y);
      setSelectedDate(d);
      setStartDate("");
      setEndDate("");
      applyDateFilter(d, "", "");
    } else if (preset === "this_month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const s = formatDateStr(firstDay);
      const e = formatDateStr(lastDay);
      setSelectedDate("");
      setStartDate(s);
      setEndDate(e);
      applyDateFilter("", s, e);
    } else if (preset === "clear") {
      setSelectedDate("");
      setStartDate("");
      setEndDate("");
      applyDateFilter("", "", "");
    }
  }

  const hasActiveDate = Boolean(
    currentDate || currentStartDate || currentEndDate,
  );

  let dateLabel = "Filter Date";
  if (currentDate) {
    dateLabel = formatDisplayDate(currentDate);
  } else if (currentStartDate && currentEndDate) {
    dateLabel = `${formatDisplayDate(currentStartDate)} – ${formatDisplayDate(currentEndDate)}`;
  } else if (currentStartDate) {
    dateLabel = `From ${formatDisplayDate(currentStartDate)}`;
  } else if (currentEndDate) {
    dateLabel = `To ${formatDisplayDate(currentEndDate)}`;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Search & Date Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative w-44 sm:w-48 md:w-52 shrink-0">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, receipt..."
              className="h-9 w-full rounded-lg border border-zinc-300 bg-white pl-8 pr-7 text-xs text-zinc-800 placeholder-zinc-400 shadow-xs transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("q");
                  startTransition(() => {
                    router.replace(`${pathname}?${params.toString()}`, {
                      scroll: false,
                    });
                  });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter Dropdown (Fixed width to avoid any shift/bounce) */}
          <div className="relative w-36 sm:w-40 shrink-0" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDateOpen((prev) => !prev)}
              title={hasActiveDate ? dateLabel : "Filter by Date"}
              className={`inline-flex h-9 w-full items-center justify-between rounded-lg border px-2.5 text-xs font-medium shadow-xs transition ${
                hasActiveDate
                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <span className="truncate text-left">{dateLabel}</span>
              </div>
              {hasActiveDate && (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickDate("clear");
                  }}
                  className="ml-1 shrink-0 rounded-full p-0.5 text-blue-600 hover:bg-blue-200/60 dark:text-blue-300 dark:hover:bg-blue-900/60"
                  title="Clear date filter"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>

            {/* Date Filter Popover */}
            {isDateOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Filter by Payment Date
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
                    onClick={() => handleQuickDate("today")}
                    className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate("yesterday")}
                    className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDate("this_month")}
                    className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    This Month
                  </button>
                </div>

                {/* Specific Date Picker */}
                <div className="mt-3 space-y-1">
                  <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                    Specific Date
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && selectedDate) {
                          e.preventDefault();
                          handleSingleDateApply();
                        }
                      }}
                      className="h-8 flex-1 min-w-0 rounded-md border border-zinc-300 bg-white px-2.5 text-xs text-zinc-800 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    />
                    <button
                      type="button"
                      onClick={handleSingleDateApply}
                      disabled={!selectedDate}
                      className="h-8 rounded-md bg-blue-600 px-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="relative my-2.5 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <span className="relative bg-white px-2 text-[10px] uppercase text-zinc-400 dark:bg-zinc-900">
                    Or Date Range
                  </span>
                </div>

                {/* Date Range Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      From
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      To
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
                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleQuickDate("clear")}
                    className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyRange}
                    disabled={!startDate && !endDate}
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Send Bulk Payment Notifications */}
          <button
            type="button"
            onClick={() => setBulkEmailOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 shadow-xs transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shrink-0"
            title="Send bulk payment acknowledgment receipts to clients by date, month, or batch"
          >
            <Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">Notify Clients</span>
          </button>

          <Link
            href="/api/import-payments-sample"
            className="inline-flex h-9 items-center whitespace-nowrap rounded-lg border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 shrink-0"
          >
            Sample CSV
          </Link>

          <ImportPayments />

          <ExportPayments totalCount={totalCount} />

          <Link
            href="/payments/new"
            className="inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-lg bg-blue-600 px-3 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 shrink-0"
          >
            <Plus size={14} />
            <span>Add Payment</span>
          </Link>
        </div>
      </div>

      {/* Global Bulk Payment Notification Modal */}
      <BulkPaymentNotificationModal
        isOpen={bulkEmailOpen}
        onClose={() => setBulkEmailOpen(false)}
        initialDate={
          currentDate ||
          (currentStartDate === currentEndDate ? currentStartDate : "")
        }
      />
    </>
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
