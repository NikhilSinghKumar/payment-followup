"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PERIODS = [
  { value: "YTD", label: "YTD" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "FORTNIGHT", label: "Fortnight" },
  { value: "DATE_RANGE", label: "Date Range" },
];

export default function DashboardPeriodFilter({
  period = "YTD",
  startDate = "",
  endDate = "",
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [fromDate, setFromDate] = useState(startDate);
  const [toDate, setToDate] = useState(endDate);

  const selectedPeriod =
    PERIODS.find((item) => item.value === period) || PERIODS[0];

  function updatePeriod(value) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("period", value);

    if (value !== "DATE_RANGE") {
      params.delete("startDate");
      params.delete("endDate");
    }

    setOpen(false);

    router.push(`${pathname}?${params.toString()}`);
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

    setOpen(false);

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <CalendarDays className="h-4 w-4" />

          <span>{selectedPeriod.label}</span>

          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="space-y-1">
              {PERIODS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => updatePeriod(item.value)}
                  className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    period === item.value
                      ? "bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {period === "DATE_RANGE" && (
              <div className="mt-3 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500">
                      From
                    </label>

                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500">
                      To
                    </label>

                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={applyDateRange}
                    disabled={!fromDate || !toDate}
                    className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
