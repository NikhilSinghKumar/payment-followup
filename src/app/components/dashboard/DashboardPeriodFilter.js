"use client";

import { CalendarDays, Check, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PERIODS = [
  { value: "YTD", label: "YTD" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "FORTNIGHT", label: "14 Days" },
];

export default function DashboardPeriodFilter({
  period = "YTD",
  startDate = "",
  endDate = "",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [fromDate, setFromDate] = useState(startDate);
  const [toDate, setToDate] = useState(endDate);
  const dateRangeRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dateRangeRef.current &&
        !dateRangeRef.current.contains(event.target)
      ) {
        setDateRangeOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  function updatePeriod(value) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    params.delete("startDate");
    params.delete("endDate");
    setDateRangeOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  }

  function openDateRange() {
    setDateRangeOpen((value) => !value);
  }

  function applyDateRange() {
    if (!fromDate || !toDate) return;

    if (fromDate > toDate) {
      alert("Start date cannot be after end date.");
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "DATE_RANGE");
    params.set("startDate", fromDate);
    params.set("endDate", toDate);
    setDateRangeOpen(false);
    router.push(`${pathname}?${params.toString()}`);
  }

  const isDateRange = period === "DATE_RANGE";

  return (
    <div className="flex items-center gap-1.5">
      {/* QUICK PERIODS SEGMENTED PILLS */}
      <div
        role="radiogroup"
        aria-label="Collection period"
        className="flex items-center gap-0.5 rounded-lg border border-zinc-200/80 bg-zinc-100/90 p-0.5 dark:border-zinc-800 dark:bg-zinc-800/80"
      >
        {PERIODS.map((item) => {
          const active = period === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => updatePeriod(item.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
                active
                  ? "bg-white text-blue-600 shadow-xs dark:bg-zinc-900 dark:text-blue-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* CUSTOM DATE RANGE BUTTON */}
      <div ref={dateRangeRef} className="relative">
        <button
          type="button"
          onClick={openDateRange}
          className={`flex h-7.5 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium shadow-xs transition-all duration-150 ${
            isDateRange
              ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
              : "border-zinc-200/80 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5 text-zinc-500" />
          <span className="max-w-[130px] truncate">
            {isDateRange && startDate && endDate
              ? `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`
              : "Custom"}
          </span>
        </button>

        {/* DATE RANGE PANEL */}
        {dateRangeOpen && (
          <div className="absolute right-0 top-full z-50 mt-1.5 w-[280px] rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Custom Date Range
              </span>
              <button
                type="button"
                onClick={() => setDateRangeOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-800 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => setDateRangeOpen(false)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={applyDateRange}
                  disabled={!fromDate || !toDate}
                  className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-3 w-3" />
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatShortDate(dateString) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length < 3) return dateString;
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}
