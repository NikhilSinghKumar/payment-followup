"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckSquare, Square, X, AlertTriangle } from "lucide-react";
import SortDropdown from "./SortDropdown";
import BulkReminderModal from "../reminder/BulkReminderModal";

export default function InvoicesTableClient({ invoices = [] }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Invoices eligible for reminders (have outstanding balance > 0)
  const eligibleInvoices = invoices.filter(
    (inv) => Number(inv.outstandingAmount || inv.due || 0) > 0,
  );

  const overdueInvoices = invoices.filter((inv) => {
    if (Number(inv.outstandingAmount || inv.due || 0) <= 0) return false;
    if (inv.isOverdue) return true;
    if (inv.dueDate) {
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }
    return false;
  });

  const allEligibleSelected =
    eligibleInvoices.length > 0 &&
    eligibleInvoices.every((inv) => selectedIds.includes(inv.id));

  function toggleSelectAll() {
    if (allEligibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(eligibleInvoices.map((inv) => inv.id));
    }
  }

  function selectAllOverdue() {
    setSelectedIds(overdueInvoices.map((inv) => inv.id));
  }

  function toggleSelectInvoice(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  // Selected stats
  const selectedInvoicesList = invoices.filter((inv) =>
    selectedIds.includes(inv.id),
  );
  const selectedClientsCount = new Set(
    selectedInvoicesList.map((inv) => inv.clientId || inv.companyName),
  ).size;
  const selectedTotalDue = selectedInvoicesList.reduce(
    (sum, inv) => sum + Number(inv.outstandingAmount || inv.due || 0),
    0,
  );

  return (
    <div className="relative">
      {/* Quick Selection Toolbar (if overdue exist) */}
      <div className="mb-2 flex items-center justify-between px-1 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span>{invoices.length} invoices displayed</span>
          {overdueInvoices.length > 0 && (
            <button
              type="button"
              onClick={selectAllOverdue}
              className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-800 transition hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <AlertTriangle size={11} />
              <span>Select All Overdue ({overdueInvoices.length})</span>
            </button>
          )}
        </div>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-zinc-400 underline hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            Clear selection ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <div className="min-w-[1020px]">
            {/* Table Header */}
            <div className="grid grid-cols-[38px_44px_2.2fr_1fr_1.2fr_1fr_1fr_110px_120px_150px] items-center border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allEligibleSelected}
                  onChange={toggleSelectAll}
                  title="Select all pending invoices"
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div>S.N.</div>
              <div>Company</div>
              <div className="text-center">Invoice No.</div>
              <div className="text-center pl-2">
                <SortDropdown />
              </div>
              <div className="text-center">Paid</div>
              <div className="text-center">Outstanding</div>
              <div className="text-center">Due Date</div>
              <div className="text-center">Status</div>
              <div className="text-center">Actions</div>
            </div>

            {/* Table Rows */}
            {invoices.length > 0 ? (
              invoices.map((inv, index) => {
                let isOverdue = false;
                let formattedDate = "—";

                if (inv.dueDate) {
                  const due = new Date(inv.dueDate);
                  due.setHours(0, 0, 0, 0);
                  isOverdue = due < today;
                  formattedDate = due.toLocaleDateString("en-IN");
                }

                const isSelected = selectedIds.includes(inv.id);
                const isPendingDue =
                  Number(inv.outstandingAmount || inv.due || 0) > 0;

                return (
                  <div
                    key={inv.id}
                    onClick={(e) => {
                      // If clicked on action links or inputs, do not toggle row selection
                      if (e.target.closest("a, button, input")) return;
                      if (isPendingDue) toggleSelectInvoice(inv.id);
                    }}
                    className={`grid grid-cols-[38px_44px_2.2fr_1fr_1.2fr_1fr_1fr_110px_120px_150px] items-center border-b border-zinc-100 px-4 py-1.5 text-xs transition-colors dark:border-zinc-800/60 ${
                      isSelected
                        ? "bg-blue-50/60 dark:bg-blue-950/30"
                        : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                    } ${isPendingDue ? "cursor-pointer" : ""}`}
                  >
                    {/* Selection Checkbox */}
                    <div className="flex items-center justify-center">
                      {isPendingDue ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectInvoice(inv.id)}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-[10px] text-zinc-300 dark:text-zinc-600">
                          —
                        </span>
                      )}
                    </div>

                    {/* S.N. */}
                    <div className="font-medium text-zinc-700 dark:text-zinc-400">
                      {index + 1}
                    </div>

                    {/* Company */}
                    <div className="font-medium text-zinc-800 truncate pr-3 dark:text-zinc-200">
                      {inv.companyName ?? "Unknown"}
                      {inv.companyCode && (
                        <span className="ml-1 text-[10px] text-zinc-400">
                          ({inv.companyCode})
                        </span>
                      )}
                    </div>

                    {/* Invoice Number */}
                    <div className="font-medium text-center text-zinc-800 whitespace-nowrap dark:text-zinc-200">
                      {inv.invoiceNumber ?? "—"}
                    </div>

                    {/* Amount */}
                    <div className="font-medium text-center text-zinc-800 whitespace-nowrap dark:text-zinc-200">
                      ₹{Number(inv.invoiceAmount).toLocaleString("en-IN")}
                    </div>

                    {/* Paid */}
                    <div className="font-medium text-center text-emerald-600 whitespace-nowrap dark:text-emerald-400">
                      ₹{Number(inv.paidAmount).toLocaleString("en-IN")}
                    </div>

                    {/* Due */}
                    <div className="font-medium text-center text-red-600 whitespace-nowrap dark:text-red-400">
                      ₹{Number(inv.outstandingAmount).toLocaleString("en-IN")}
                    </div>

                    {/* Due Date */}
                    <div className="text-center text-zinc-700 whitespace-nowrap dark:text-zinc-300">
                      {formattedDate}
                    </div>

                    {/* Status */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={`inline-flex items-center justify-center min-w-[76px] px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          inv.status === "paid"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : inv.status === "partial"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : inv.status === "overdue"
                                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {inv.status}
                      </span>

                      {inv.status !== "paid" && inv.dueDays !== undefined && (
                        <span className="text-[10px] text-zinc-400">
                          {inv.dueDays > 0
                            ? `${inv.dueDays}d`
                            : inv.dueDays < 0
                              ? `In ${Math.abs(inv.dueDays)}d`
                              : "Today"}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="h-7 px-2.5 inline-flex items-center justify-center rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900"
                      >
                        View
                      </Link>
                      <Link
                        href={`/invoices/${inv.id}/edit`}
                        className="h-7 px-2.5 inline-flex items-center justify-center rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center text-xs text-zinc-400">
                No invoices found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 z-40 -translate-x-1/2 flex w-[calc(100%-2rem)] max-w-2xl flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/95 p-3 sm:px-5 sm:py-3 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2.5 sm:border-r sm:border-zinc-700 sm:pr-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shrink-0">
              {selectedIds.length}
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-100">
                {selectedIds.length} Invoice{selectedIds.length > 1 ? "s" : ""}{" "}
                Selected
              </div>
              <div className="text-[10px] text-zinc-400">
                <strong>{selectedClientsCount}</strong> client
                {selectedClientsCount > 1 ? "s" : ""} • Total:{" "}
                <strong>₹{selectedTotalDue.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>

          <div className="flex w-full sm:w-auto items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md transition hover:from-blue-500 hover:to-indigo-500 cursor-pointer"
            >
              <Mail size={14} />
              <span>Send Reminders ({selectedClientsCount})</span>
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer shrink-0"
              title="Deselect all"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Reminder Modal */}
      <BulkReminderModal
        selectedInvoiceIds={selectedIds}
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={() => {
          setSelectedIds([]);
        }}
      />
    </div>
  );
}
