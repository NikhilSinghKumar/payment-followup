"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Download, ChevronDown, Check, FileSpreadsheet } from "lucide-react";

export default function ExportPayments({ totalCount = 0 }) {
  const searchParams = useSearchParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef(null);

  const query = searchParams.get("q") || "";
  const date = searchParams.get("date") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const hasFilter = Boolean(query || date || startDate || endDate);

  const filteredHref = `/api/export-payments?${searchParams.toString()}`;
  const allHref = `/api/export-payments?all=true`;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleTriggerDownload(url) {
    setIsExporting(true);
    setDropdownOpen(false);

    // Trigger download using standard anchor
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
    }, 1500);
  }

  // If no filters are active, a single clean direct download button
  if (!hasFilter) {
    return (
      <a
        id="export-payments-btn"
        href={allHref}
        onClick={() => {
          setIsExporting(true);
          setTimeout(() => setIsExporting(false), 1500);
        }}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm font-medium text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        title="Download all payment records as CSV (includes client & company code)"
      >
        <Download className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
      </a>
    );
  }

  // If filters are active, provide direct filtered download with dropdown for all
  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      <div className="inline-flex rounded-lg border border-zinc-300 bg-white shadow-xs dark:border-zinc-700 dark:bg-zinc-900">
        {/* Main action: Export filtered results */}
        <button
          id="export-payments-filtered-btn"
          type="button"
          onClick={() => handleTriggerDownload(filteredHref)}
          className="inline-flex h-10 items-center gap-1.5 rounded-l-lg px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
          title={`Export ${totalCount} filtered payment records as CSV`}
        >
          <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>
            {isExporting ? "Exporting..." : `Export CSV (${totalCount})`}
          </span>
        </button>

        {/* Dropdown toggle for Export All */}
        <button
          id="export-payments-dropdown-toggle"
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="inline-flex h-10 items-center border-l border-zinc-200 px-2 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          title="Export options"
          aria-expanded={dropdownOpen}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Dropdown Popover */}
      {dropdownOpen && (
        <div
          id="export-payments-menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="px-2.5 py-1.5 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Export Payment Data
          </div>

          <button
            type="button"
            onClick={() => handleTriggerDownload(filteredHref)}
            className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                Filtered Payments ({totalCount})
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Export only currently matching search & date criteria
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerDownload(allHref)}
            className="mt-1 flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <FileSpreadsheet className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                All Payments
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Export all historical payment records with client & company code
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
