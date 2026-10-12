"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Search,
  Building2,
  Check,
  CheckCircle2,
  AlertCircle,
  Filter,
  FileText,
  RotateCw,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateDisplay } from "@/lib/date-parser";
import {
  toggleTdsVerification,
  updateInvoiceTds,
  bulkVerifyTds,
} from "@/app/actions/tds";

export default function TdsManagementClient({
  initialClients = [],
  initialInvoices = [],
  initialSummary = {},
}) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selectedClientId, setSelectedClientId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isPending, startTransition] = useTransition();

  // Local editing modal state
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editTdsAmount, setEditTdsAmount] = useState("");
  const [editVerified, setEditVerified] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Filter invoices locally for instant response
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Client filter
      if (
        selectedClientId !== "ALL" &&
        Number(inv.clientId) !== Number(selectedClientId)
      ) {
        return false;
      }

      // Status filter
      if (statusFilter === "PENDING" && inv.isVerified) {
        return false;
      }
      if (statusFilter === "VERIFIED" && !inv.isVerified) {
        return false;
      }

      // Search filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = inv.invoiceNumber?.toLowerCase().includes(q);
        const nameMatch = inv.clientName?.toLowerCase().includes(q);
        const codeMatch = inv.clientCode?.toLowerCase().includes(q);
        if (!numMatch && !nameMatch && !codeMatch) return false;
      }

      return true;
    });
  }, [invoices, selectedClientId, statusFilter, searchQuery]);

  // Recalculate summary metrics based on current active view
  const summary = useMemo(() => {
    const list = filteredInvoices;
    return {
      count: list.length,
      grossBilled: list.reduce(
        (s, i) => s + Number(i.grossInvoiceAmount || 0),
        0,
      ),
      actualReceived: list.reduce(
        (s, i) => s + Number(i.actualPaymentReceived || 0),
        0,
      ),
      verifiedTds: list.reduce(
        (s, i) => s + (i.isVerified ? Number(i.tdsDeducted || 0) : 0),
        0,
      ),
      pendingTds: list.reduce(
        (s, i) => s + (!i.isVerified ? Number(i.tdsDeducted || 0) : 0),
        0,
      ),
      outstanding: list.reduce(
        (s, i) => s + Number(i.outstandingAmount || 0),
        0,
      ),
    };
  }, [filteredInvoices]);

  // Handle single invoice checkbox toggle (Optimistic + Server action)
  function handleToggleVerification(invoiceId, currentVerified) {
    const nextVerified = !currentVerified;

    // Optimistic UI update
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const rawRemaining =
            inv.grossInvoiceAmount -
            inv.actualPaymentReceived -
            inv.tdsDeducted;
          const isSettledWithTolerance =
            nextVerified && Math.abs(rawRemaining) < 1;

          return {
            ...inv,
            isVerified: nextVerified,
            verifiedTds: nextVerified ? inv.tdsDeducted : 0,
            pendingTds: !nextVerified ? inv.tdsDeducted : 0,
            outstandingAmount: nextVerified
              ? isSettledWithTolerance
                ? 0
                : Math.max(0, Number(rawRemaining.toFixed(2)))
              : Math.max(
                  0,
                  Number(
                    (
                      inv.grossInvoiceAmount - inv.actualPaymentReceived
                    ).toFixed(2),
                  ),
                ),
          };
        }
        return inv;
      }),
    );

    startTransition(async () => {
      try {
        await toggleTdsVerification(invoiceId, nextVerified);
        setActionMessage(
          `Invoice TDS marked as ${nextVerified ? "Verified ✓" : "Pending"}`,
        );
        setTimeout(() => setActionMessage(""), 3000);
      } catch (err) {
        // Rollback on error
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === invoiceId
              ? { ...inv, isVerified: currentVerified }
              : inv,
          ),
        );
        setActionMessage(`Error: ${err.message}`);
      }
    });
  }

  // Handle opening edit modal
  function openEditModal(inv) {
    setEditingInvoice(inv);
    setEditTdsAmount(String(inv.tdsDeducted || 0));
    setEditVerified(Boolean(inv.isVerified));
    setEditNotes(inv.tdsNotes || "");
  }

  // Handle saving modal edits
  function handleSaveEdit() {
    if (!editingInvoice) return;
    const newAmount = parseFloat(editTdsAmount) || 0;
    const invoiceId = editingInvoice.id;

    // Optimistic update
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const verified = editVerified;
          return {
            ...inv,
            tdsDeducted: newAmount,
            isVerified: verified,
            verifiedTds: verified ? newAmount : 0,
            pendingTds: !verified ? newAmount : 0,
            tdsNotes: editNotes,
            outstandingAmount: verified
              ? Math.max(
                  0,
                  inv.grossInvoiceAmount -
                    inv.actualPaymentReceived -
                    newAmount,
                )
              : Math.max(0, inv.grossInvoiceAmount - inv.actualPaymentReceived),
          };
        }
        return inv;
      }),
    );

    setEditingInvoice(null);

    startTransition(async () => {
      try {
        await updateInvoiceTds({
          invoiceId,
          tdsDeductedAmount: newAmount,
          isTdsVerified: editVerified,
          notes: editNotes,
        });
        setActionMessage("TDS amount & status updated successfully!");
        setTimeout(() => setActionMessage(""), 3000);
      } catch (err) {
        setActionMessage(`Error: ${err.message}`);
      }
    });
  }

  // Bulk actions
  function toggleSelectAll() {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map((inv) => inv.id));
    }
  }

  function handleBulkVerify(verifyStatus) {
    if (selectedIds.length === 0) return;

    startTransition(async () => {
      try {
        await bulkVerifyTds(selectedIds, verifyStatus);
        setInvoices((prev) =>
          prev.map((inv) =>
            selectedIds.includes(inv.id)
              ? {
                  ...inv,
                  isVerified: verifyStatus,
                  verifiedTds: verifyStatus ? inv.tdsDeducted : 0,
                  pendingTds: !verifyStatus ? inv.tdsDeducted : 0,
                }
              : inv,
          ),
        );
        setSelectedIds([]);
        setActionMessage(
          `Bulk updated ${selectedIds.length} invoices to ${verifyStatus ? "Verified" : "Pending"}!`,
        );
        setTimeout(() => setActionMessage(""), 3000);
      } catch (err) {
        setActionMessage(`Error: ${err.message}`);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              TDS Management System
            </h1>
            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Section 194C / 194J
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Reconcile client TDS deductions against Form 26AS. Actual Payment +
            Verified TDS totals to invoice amount.
          </p>
        </div>

        {actionMessage && (
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 shadow-2xs dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 size={14} />
            <span>{actionMessage}</span>
          </div>
        )}
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {/* Gross Invoiced */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Gross Invoiced
          </p>
          <p className="mt-1.5 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrency(summary.grossBilled)}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">
            {summary.count} Invoice{summary.count !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Cash/Bank Received */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Payment Received
          </p>
          <p className="mt-1.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.actualReceived)}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">Bank & Cash Inflow</p>
        </div>

        {/* Verified TDS */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-3.5 shadow-xs dark:border-emerald-950 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Verified TDS
            </p>
            <ShieldCheck
              size={14}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <p className="mt-1.5 text-lg font-bold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(summary.verifiedTds)}
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-700/80 dark:text-emerald-400">
            Confirmed in Form 26AS
          </p>
        </div>

        {/* Pending TDS */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5 shadow-xs dark:border-amber-950 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Pending TDS
            </p>
            <Clock size={14} className="text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-1.5 text-lg font-bold text-amber-700 dark:text-amber-300">
            {formatCurrency(summary.pendingTds)}
          </p>
          <p className="mt-0.5 text-[10px] text-amber-700/80 dark:text-amber-400">
            Awaiting 26AS Check
          </p>
        </div>

        {/* Total Settled / Reconciled */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-3.5 shadow-xs dark:border-blue-950 dark:bg-blue-950/20">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-800 dark:text-blue-300">
            Total Reconciled
          </p>
          <p className="mt-1.5 text-lg font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(summary.actualReceived + summary.verifiedTds)}
          </p>
          <p className="mt-0.5 text-[10px] text-blue-700/80 dark:text-blue-400">
            Paid + Verified TDS
          </p>
        </div>

        {/* Net Outstanding Balance */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Net Outstanding
          </p>
          <p
            className={`mt-1.5 text-lg font-bold ${
              summary.outstanding > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {formatCurrency(summary.outstanding)}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">Remaining Balance</p>
        </div>
      </div>

      {/* TOOLBAR CONTROLS: CLIENT PICKER, STATUS FILTER, SEARCH */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Client Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Building2 size={14} className="text-zinc-400" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-800 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="ALL">All Clients ({initialClients.length})</option>
              {initialClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} {c.companyCode ? `(${c.companyCode})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs: ALL / PENDING / VERIFIED */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-md px-2.5 py-1 transition ${
                statusFilter === "ALL"
                  ? "bg-white font-bold text-zinc-900 shadow-2xs dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              All Invoices
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`rounded-md px-2.5 py-1 transition ${
                statusFilter === "PENDING"
                  ? "bg-amber-100 font-bold text-amber-800 shadow-2xs dark:bg-amber-950 dark:text-amber-200"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Pending TDS
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("VERIFIED")}
              className={`rounded-md px-2.5 py-1 transition ${
                statusFilter === "VERIFIED"
                  ? "bg-emerald-100 font-bold text-emerald-800 shadow-2xs dark:bg-emerald-950 dark:text-emerald-200"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Verified TDS
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number or client..."
            className="h-8 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* BATCH ACTION BAR IF INVOICES ARE CHECKED */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <span>{selectedIds.length} invoices selected</span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkVerify(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 font-semibold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50"
            >
              <Check size={12} />
              <span>Mark All as Verified</span>
            </button>
            <button
              type="button"
              onClick={() => handleBulkVerify(false)}
              disabled={isPending}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1 font-semibold text-amber-800 shadow-2xs hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:bg-zinc-900 dark:text-amber-300"
            >
              <Clock size={12} />
              <span>Mark All as Pending</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN INTERACTIVE TDS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[1050px] table-auto border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300">
                <th className="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredInvoices.length > 0 &&
                      selectedIds.length === filteredInvoices.length
                    }
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Invoice Details</th>
                <th className="px-3 py-3 text-right">Invoice Total</th>
                <th className="px-3 py-3 text-right">Payment Received</th>
                <th className="px-3 py-3 text-right">TDS Deducted</th>
                <th className="px-4 py-3 text-center">TDS Verified (26AS)</th>
                <th className="px-3 py-3 text-right">Outstanding</th>
                <th className="px-3 py-3 text-center">Reconciliation Status</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-zinc-500">
                    No invoices match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isChecked = selectedIds.includes(inv.id);
                  const totalAccounted =
                    Number(inv.actualPaymentReceived || 0) +
                    Number(inv.tdsDeducted || 0);
                  const diff = Number(
                    (inv.grossInvoiceAmount - totalAccounted).toFixed(2),
                  );
                  const isEquationMatched = Math.abs(diff) < 1;
                  const isFullySettled =
                    isEquationMatched && Boolean(inv.isVerified);
                  const isTdsPendingVerification =
                    isEquationMatched && !inv.isVerified;

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 ${
                        isChecked ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      {/* Checkbox for selection */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(inv.id)
                                ? prev.filter((id) => id !== inv.id)
                                : [...prev, inv.id],
                            )
                          }
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Client info */}
                      <td className="px-3 py-3">
                        <Link
                          href={`/clients/${inv.clientId}`}
                          className="font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                        >
                          {inv.clientName}
                        </Link>
                        {inv.clientCode && (
                          <span className="ml-1 text-[10px] text-zinc-400">
                            ({inv.clientCode})
                          </span>
                        )}
                        <div className="text-[10px] text-zinc-400">
                          Config TDS:{" "}
                          {Number(inv.tdsRateUsed || inv.clientTdsRate || 2)}%
                        </div>
                      </td>

                      {/* Invoice Details */}
                      <td className="px-3 py-3">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        <div className="text-[10px] text-zinc-400">
                          Date: {formatDateDisplay(inv.invoiceDate)}
                        </div>
                      </td>

                      {/* Gross Invoice Total */}
                      <td className="px-3 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(inv.grossInvoiceAmount)}
                      </td>

                      {/* Payment Received (cash/bank) */}
                      <td className="px-3 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(inv.actualPaymentReceived)}
                      </td>

                      {/* TDS Deducted Amount (Overridable) */}
                      <td className="px-3 py-3 text-right">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(inv.tdsDeducted)}
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditModal(inv)}
                          className="text-[10px] text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                        >
                          Edit Amount
                        </button>
                      </td>

                      {/* TDS Verification Checkbox (The core requested checkbox!) */}
                      <td className="px-4 py-3 text-center">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                          <input
                            type="checkbox"
                            checked={Boolean(inv.isVerified)}
                            onChange={() =>
                              handleToggleVerification(inv.id, inv.isVerified)
                            }
                            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span
                            className={`text-[11px] font-bold ${
                              inv.isVerified
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {inv.isVerified ? "Verified ✓" : "Pending"}
                          </span>
                        </label>
                      </td>

                      {/* Outstanding */}
                      <td className="px-3 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-semibold ${
                              inv.outstandingAmount > 0
                                ? inv.isVerified
                                  ? "text-rose-600 dark:text-rose-400"
                                  : "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {formatCurrency(inv.outstandingAmount)}
                          </span>
                          {inv.outstandingAmount > 0 &&
                            !inv.isVerified &&
                            isEquationMatched && (
                              <span
                                className="text-[10px] text-zinc-500 dark:text-zinc-400"
                                title={`Pending TDS: ${formatCurrency(inv.tdsDeducted)}${
                                  Math.abs(
                                    inv.outstandingAmount - inv.tdsDeducted,
                                  ) >= 0.01
                                    ? ` | Round-off Diff: ${formatCurrency(
                                        Math.abs(
                                          inv.outstandingAmount -
                                            inv.tdsDeducted,
                                        ),
                                      )}`
                                    : ""
                                }\nCash Due from Client: ₹0.00`}
                              >
                                TDS Pending
                                {Math.abs(
                                  inv.outstandingAmount - inv.tdsDeducted,
                                ) >= 0.01 && (
                                  <span className="ml-0.5 text-zinc-400 font-normal">
                                    (
                                    {inv.outstandingAmount > inv.tdsDeducted
                                      ? "+"
                                      : ""}
                                    {(
                                      inv.outstandingAmount - inv.tdsDeducted
                                    ).toFixed(2)}
                                    )
                                  </span>
                                )}
                              </span>
                            )}
                        </div>
                      </td>

                      {/* Accounting Equation Check & Reconciliation Status */}
                      <td className="px-3 py-3 text-center">
                        {isFullySettled ? (
                          <div
                            className="inline-flex flex-col items-center gap-0.5"
                            title={`Reconciliation Status: 100% Settled & Closed\nPayment Received: ${formatCurrency(inv.actualPaymentReceived)}\n+ Verified TDS (26AS): ${formatCurrency(inv.tdsDeducted)}\n= Invoice Total: ${formatCurrency(inv.grossInvoiceAmount)}\nStatus: 100% Balanced & Verified in Form 26AS`}
                          >
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 shadow-2xs dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <CheckCircle2
                                size={12}
                                className="text-emerald-600 dark:text-emerald-400"
                              />
                              Fully Reconciled
                            </span>
                            <span className="text-[10px] font-medium text-emerald-600/90 dark:text-emerald-400/90">
                              100% Settled &bull; Verified in 26AS
                            </span>
                          </div>
                        ) : isTdsPendingVerification ? (
                          <div
                            className="inline-flex flex-col items-center gap-0.5"
                            title={`Reconciliation Status: Payment Accounted, TDS Pending Settlement\nPayment Received: ${formatCurrency(inv.actualPaymentReceived)}\n+ TDS Deducted: ${formatCurrency(inv.tdsDeducted)} (Pending Form 26AS Verification)\n= Accounted Total: ${formatCurrency(totalAccounted)}\nInvoice Gross: ${formatCurrency(inv.grossInvoiceAmount)}${
                              Math.abs(diff) >= 0.01
                                ? `\nRound-off Diff: ${formatCurrency(Math.abs(diff))}`
                                : ""
                            }\nStatus: Cash payment received matches invoice minus client TDS deduction. Awaiting Form 26AS verification.`}
                          >
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 shadow-2xs dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300">
                              <Clock
                                size={12}
                                className="text-amber-600 dark:text-amber-400"
                              />
                              TDS Pending (26AS)
                            </span>
                            <span className="text-[10px] font-medium text-amber-700/90 dark:text-amber-400/90">
                              Cash Recvd &bull; TDS Unverified
                              {Math.abs(diff) >= 0.01
                                ? ` (±${formatCurrency(Math.abs(diff))})`
                                : ""}
                            </span>
                          </div>
                        ) : diff < -0.01 ? (
                          <div
                            className="inline-flex flex-col items-center gap-0.5"
                            title={`Equation Breakdown:\nPayment Received: ${formatCurrency(inv.actualPaymentReceived)}\n+ TDS Deducted: ${formatCurrency(inv.tdsDeducted)}\n= Total Settled: ${formatCurrency(totalAccounted)}\nExceeds Invoice Total (${formatCurrency(inv.grossInvoiceAmount)}) by ${formatCurrency(Math.abs(diff))}`}
                          >
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 shadow-2xs dark:border-purple-800/80 dark:bg-purple-950/40 dark:text-purple-300">
                              <AlertCircle
                                size={12}
                                className="text-purple-600 dark:text-purple-400"
                              />
                              Excess Settled
                            </span>
                            <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">
                              +{formatCurrency(Math.abs(diff))} over total
                            </span>
                          </div>
                        ) : (
                          <div
                            className="inline-flex flex-col items-center gap-0.5"
                            title={`Equation Breakdown:\nPayment Received: ${formatCurrency(inv.actualPaymentReceived)}\n+ TDS Deducted: ${formatCurrency(inv.tdsDeducted)}\n= Accounted: ${formatCurrency(totalAccounted)}\nPending Balance: ${formatCurrency(diff)} of ${formatCurrency(inv.grossInvoiceAmount)}`}
                          >
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 shadow-2xs dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300">
                              <Clock
                                size={12}
                                className="text-amber-600 dark:text-amber-400"
                              />
                              Pending Balance
                            </span>
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              {formatCurrency(diff)} remaining
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(inv)}
                            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                            title="Edit TDS Settings"
                          >
                            <FileText size={14} />
                          </button>
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                            title="View Invoice"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT / OVERRIDE MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Edit TDS for Invoice #{editingInvoice.invoiceNumber}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {editingInvoice.clientName} • Invoice Total:{" "}
              {formatCurrency(editingInvoice.grossInvoiceAmount)}
            </p>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                    TDS Deducted Amount (₹){" "}
                    <span className="font-normal text-zinc-400">
                      (Manual Override)
                    </span>
                  </label>
                  {(() => {
                    const remainingBalance = Math.max(
                      0,
                      editingInvoice.grossInvoiceAmount -
                        editingInvoice.actualPaymentReceived,
                    );
                    const currentVal = parseFloat(editTdsAmount) || 0;
                    const diffWithBalance = Math.abs(
                      remainingBalance - currentVal,
                    );
                    if (diffWithBalance > 0.001 && diffWithBalance <= 5) {
                      return (
                        <button
                          type="button"
                          onClick={() =>
                            setEditTdsAmount(remainingBalance.toFixed(2))
                          }
                          className="text-[11px] font-semibold text-blue-600 underline hover:text-blue-800 dark:text-blue-400"
                        >
                          Match Remaining ({formatCurrency(remainingBalance)})
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editTdsAmount}
                  onChange={(e) => setEditTdsAmount(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                {(() => {
                  const remainingBalance = Math.max(
                    0,
                    editingInvoice.grossInvoiceAmount -
                      editingInvoice.actualPaymentReceived,
                  );
                  const currentVal = parseFloat(editTdsAmount) || 0;
                  const diffWithBalance = Number(
                    Math.abs(remainingBalance - currentVal).toFixed(2),
                  );
                  if (diffWithBalance > 0.001 && diffWithBalance <= 5) {
                    return (
                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        💡 Unpaid invoice balance is{" "}
                        {formatCurrency(remainingBalance)} while calculated 2%
                        TDS is {formatCurrency(currentVal)} (difference of{" "}
                        {formatCurrency(diffWithBalance)} due to decimal points
                        / rounding). Click &ldquo;Match Remaining&rdquo; if
                        client rounded their deduction.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editVerified}
                    onChange={(e) => setEditVerified(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      TDS Verified (Form 26AS Confirmed)
                    </span>
                    <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      If unchecked, the amount remains in Pending TDS status.
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="mb-1 block font-medium text-zinc-700 dark:text-zinc-300">
                  Notes / Form 16A Reference
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Q3 TRACES verification"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Equation preview */}
              {(() => {
                const parsedTds = parseFloat(editTdsAmount) || 0;
                const totalSettled =
                  editingInvoice.actualPaymentReceived + parsedTds;
                const diff = editingInvoice.grossInvoiceAmount - totalSettled;
                const isMatch = Math.abs(diff) < 1;

                return (
                  <div className="space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-800/80">
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Payment + TDS:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(editingInvoice.actualPaymentReceived)} +{" "}
                        {formatCurrency(parsedTds)} ={" "}
                        {formatCurrency(totalSettled)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Invoice Total:</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(editingInvoice.grossInvoiceAmount)}
                      </span>
                    </div>
                    <div className="border-t border-zinc-200 pt-1.5 dark:border-zinc-700">
                      {isMatch ? (
                        editVerified ? (
                          <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={13} />
                            <span>
                              Fully Settled & Reconciled: Cash payment + TDS
                              matches invoice total (Verified in Form 26AS).
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                            <Clock size={13} />
                            <span>
                              Payment Accounted (TDS Pending 26AS): Cash
                              received + TDS accounts for invoice, but Form 26AS
                              verification is pending.
                            </span>
                          </div>
                        )
                      ) : diff < -0.01 ? (
                        <div className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
                          <AlertCircle size={13} />
                          <span>
                            Excess Settled: Payment + TDS exceeds invoice total
                            by {formatCurrency(Math.abs(diff))}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                          <Clock size={13} />
                          <span>
                            Pending Balance: {formatCurrency(diff)} remaining to
                            settle
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingInvoice(null)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
