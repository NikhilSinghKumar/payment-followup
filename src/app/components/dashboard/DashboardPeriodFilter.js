"use client";

import { CalendarDays, Check } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PERIODS = [
  { value: "YTD", label: "YTD" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "FORTNIGHT", label: "Fortnight" },
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
    <div className="relative flex flex-wrap items-center gap-2">
      {/* QUICK PERIODS */}
      <div
        role="radiogroup"
        aria-label="Collection period"
        className="flex items-center gap-4 rounded-xl px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"
      >
        {PERIODS.map((item) => {
          const active = period === item.value;

          return (
            <label
              key={item.value}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="radio"
                name="dashboard-period"
                value={item.value}
                checked={active}
                onChange={() => updatePeriod(item.value)}
                className="h-4 w-4 accent-blue-600"
              />

              <span
                className={`text-sm font-medium transition ${
                  active
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {item.label}
              </span>
            </label>
          );
        })}
      </div>

      <div ref={dateRangeRef} className="relative">
        {/* DATE RANGE */}
        <button
          type="button"
          onClick={openDateRange}
          className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium shadow-sm transition ${
            isDateRange
              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
        >
          <CalendarDays className="h-4 w-4" />

          <span>
            {isDateRange && startDate && endDate
              ? `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`
              : "Date Range"}
          </span>
        </button>

        {/* DATE RANGE PANEL */}
        {dateRangeOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-[310px] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="space-y-3">
              {/* FROM */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  From date
                </label>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                />
              </div>

              {/* TO */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  To date
                </label>

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setDateRangeOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={applyDateRange}
                  disabled={!fromDate || !toDate}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
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

/**
 * Format YYYY-MM-DD
 * as DD MMM
 */
function formatShortDate(dateString) {
  const [year, month, day] = dateString.split("-");

  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}
