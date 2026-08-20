"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { getNotificationAuditLogs } from "@/app/actions/notificationSettings";

export default function NotificationLogsTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isPending, startTransition] = useTransition();

  function loadLogs(pageNumber = 1, status = statusFilter, query = search) {
    setLoading(true);
    startTransition(async () => {
      const res = await getNotificationAuditLogs({
        page: pageNumber,
        limit: 15,
        status,
        search: query,
      });

      setLoading(false);
      if (res && !res.error) {
        setLogs(res.logs || []);
        setPage(res.page || 1);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || 0);
      }
    });
  }

  useEffect(() => {
    loadLogs(1, statusFilter, search);
  }, [statusFilter]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadLogs(1, statusFilter, search);
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-sm"
        >
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search recipient email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </form>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex rounded-xl border border-zinc-200 bg-white p-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800">
            {["ALL", "DELIVERED", "FAILED", "PENDING"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  statusFilter === st
                    ? "bg-blue-600 text-white"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {st === "ALL" ? "All Logs" : st}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadLogs(page, statusFilter, search)}
            disabled={loading}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-[110px_1.8fr_2fr_1.2fr_100px_130px] items-center border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
          <div>Channel / Status</div>
          <div>Recipient</div>
          <div>Subject</div>
          <div>Related Entity</div>
          <div className="text-center">Sent At</div>
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-xs text-zinc-500">
            <RefreshCw size={16} className="animate-spin mr-2" />
            <span>Loading delivery logs...</span>
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {logs.map((log) => {
              const isDelivered =
                log.status === "DELIVERED" || log.status === "SENT";
              const isFailed = log.status === "FAILED";

              return (
                <div
                  key={log.id}
                  className="grid grid-cols-[110px_1.8fr_2fr_1.2fr_100px_130px] items-center px-4 py-2 text-xs transition hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                >
                  {/* Channel & Status */}
                  <div className="flex items-center gap-1.5">
                    {log.channel === "EMAIL" ? (
                      <span className="rounded bg-blue-50 p-1 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        <Mail size={12} />
                      </span>
                    ) : (
                      <span className="rounded bg-emerald-50 p-1 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        <MessageSquare size={12} />
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                        isDelivered
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : isFailed
                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>

                  {/* Recipient */}
                  <div className="font-mono text-zinc-800 truncate pr-2 dark:text-zinc-200">
                    {log.recipient}
                  </div>

                  {/* Subject */}
                  <div
                    className="text-zinc-700 truncate pr-2 dark:text-zinc-300"
                    title={log.subject}
                  >
                    {log.subject || "Notification"}
                    {log.errorMessage && (
                      <p
                        className="text-[10px] text-red-500 truncate"
                        title={log.errorMessage}
                      >
                        Err: {log.errorMessage}
                      </p>
                    )}
                  </div>

                  {/* Related Entity */}
                  <div className="text-[11px] text-zinc-500 truncate">
                    {log.clientName && (
                      <Link
                        href={`/clients/${log.clientId}`}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400 block truncate"
                      >
                        {log.clientName}
                      </Link>
                    )}
                    {log.invoiceNumber && (
                      <Link
                        href={`/invoices/${log.invoiceId}`}
                        className="text-[10px] text-zinc-400 hover:underline block truncate"
                      >
                        Inv #{log.invoiceNumber}
                      </Link>
                    )}
                    {!log.clientName && !log.invoiceNumber && <span>—</span>}
                  </div>

                  {/* Sent At */}
                  <div className="text-center text-[10px] text-zinc-400">
                    {log.sentAt || log.createdAt
                      ? new Date(
                          log.sentAt || log.createdAt,
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1">
                    {log.invoiceId && (
                      <Link
                        href={`/invoices/${log.invoiceId}`}
                        className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <span>Invoice</span>
                        <ExternalLink size={9} />
                      </Link>
                    )}
                    {log.clientId && !log.invoiceId && (
                      <Link
                        href={`/clients/${log.clientId}`}
                        className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        <span>Client</span>
                        <ExternalLink size={9} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-zinc-400">
            No notification delivery logs found for the selected criteria.
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
          <span>
            Showing <strong>{logs.length}</strong> of{" "}
            <strong>{totalCount}</strong> logs
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => loadLogs(page - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => loadLogs(page + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
