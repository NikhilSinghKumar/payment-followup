"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getInvoicesForPayment,
  allocatePaymentToInvoices,
} from "@/app/actions/payment";
import AwbDetailsPopover from "./AwbDetailsPopover";
import {
  Sparkles,
  RotateCcw,
  Search,
  Check,
  AlertCircle,
  Clock,
  Layers,
  CheckCircle2,
  Calendar,
  Building2,
  Receipt,
  CreditCard,
} from "lucide-react";

export default function AllocatePaymentModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}) {
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [subClients, setSubClients] = useState([]);
  const [filterSubClientId, setFilterSubClientId] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Key-value store of invoiceId -> numeric allocation amount
  const [allocations, setAllocations] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [isPending, startTransition] = useTransition();

  const clientId = payment?.client?.id || payment?.clientId;
  const availableUnallocated = Math.max(
    Number(payment?.unallocatedAmount || 0),
    0,
  );

  // Load client invoices when modal opens
  useEffect(() => {
    if (!isOpen || !clientId) return;

    let isMounted = true;
    setLoadingInvoices(true);
    setAllocations({});
    setFeedback(null);
    setSearchQuery("");

    // If payment is tagged to a specific subclient, pre-select that filter
    if (payment?.subClientId) {
      setFilterSubClientId(String(payment.subClientId));
    } else {
      setFilterSubClientId("ALL");
    }

    getInvoicesForPayment(clientId)
      .then((res) => {
        if (!isMounted) return;
        setInvoices(res.invoices || []);
        setSubClients(res.subClients || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setFeedback({
          type: "error",
          message: err?.message || "Failed to load client invoices.",
        });
      })
      .finally(() => {
        if (isMounted) setLoadingInvoices(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, clientId, payment?.subClientId]);

  // Filter invoices by selected subclient and search query
  const displayedInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (filterSubClientId !== "ALL") {
        if (Number(inv.subClientId) !== Number(filterSubClientId)) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const num = inv.invoiceNumber?.toLowerCase() || "";
        const subName = inv.subClientName?.toLowerCase() || "";
        if (!num.includes(q) && !subName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, filterSubClientId, searchQuery]);

  // Total amount currently allocated across all invoices in draft
  const totalDraftAllocated = useMemo(() => {
    return (
      Math.round(
        Object.values(allocations).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0,
        ) * 100,
      ) / 100
    );
  }, [allocations]);

  // Remaining available unallocated funds from this payment
  const remainingAvailable = Math.max(
    Math.round((availableUnallocated - totalDraftAllocated) * 100) / 100,
    0,
  );

  const isOverAllocated = totalDraftAllocated > availableUnallocated + 0.01;

  // AUTO-FILL FIFO: Distribute unallocated funds starting from oldest invoice
  function handleAutoFillFIFO() {
    if (availableUnallocated <= 0) return;

    let fundsLeft = availableUnallocated;
    const newAllocations = {};

    // Sort target invoices: priority to displayed ones, but take all client invoices
    const targetInvoices =
      filterSubClientId !== "ALL" && displayedInvoices.length > 0
        ? [
            ...displayedInvoices,
            ...invoices.filter((inv) => !displayedInvoices.includes(inv)),
          ]
        : invoices;

    for (const inv of targetInvoices) {
      if (fundsLeft <= 0) break;
      const due = Number(inv.due || inv.outstandingAmount || 0);
      if (due <= 0) continue;

      const allocateForThis = Math.min(due, fundsLeft);
      if (allocateForThis > 0) {
        newAllocations[inv.id] = Math.round(allocateForThis * 100) / 100;
        fundsLeft = Math.round((fundsLeft - allocateForThis) * 100) / 100;
      }
    }

    setAllocations(newAllocations);
    setFeedback({
      type: "info",
      message: `Auto-filled FIFO: Distributed across ${
        Object.keys(newAllocations).length
      } invoice(s). You can adjust any amount manually.`,
    });
  }

  // Clear all entered allocations
  function handleClearAll() {
    setAllocations({});
    setFeedback(null);
  }

  // Handle manual input change for a specific invoice
  function handleManualAmountChange(invoiceId, rawValue) {
    setFeedback(null);
    if (rawValue === "") {
      setAllocations((prev) => {
        const next = { ...prev };
        delete next[invoiceId];
        return next;
      });
      return;
    }

    const val = Number(rawValue);
    if (isNaN(val) || val < 0) return;

    setAllocations((prev) => ({
      ...prev,
      [invoiceId]: rawValue,
    }));
  }

  // Fill max possible amount for a single invoice row
  function handleFillMaxRow(invoice) {
    setFeedback(null);
    const due = Number(invoice.due || invoice.outstandingAmount || 0);
    const currentForThis = Number(allocations[invoice.id] || 0);
    const poolAvailable = remainingAvailable + currentForThis;
    const amountToSet = Math.min(due, poolAvailable);

    if (amountToSet <= 0) return;

    setAllocations((prev) => ({
      ...prev,
      [invoice.id]: Math.round(amountToSet * 100) / 100,
    }));
  }

  // Clear a single invoice allocation
  function handleClearRow(invoiceId) {
    setAllocations((prev) => {
      const next = { ...prev };
      delete next[invoiceId];
      return next;
    });
  }

  // Submit allocations to server
  function handleConfirmAllocation() {
    if (totalDraftAllocated <= 0) {
      setFeedback({
        type: "error",
        message: "Please allocate an amount to at least one invoice.",
      });
      return;
    }

    if (isOverAllocated) {
      setFeedback({
        type: "error",
        message: `Total allocated amount (₹${totalDraftAllocated.toLocaleString(
          "en-IN",
        )}) exceeds the available unallocated balance (₹${availableUnallocated.toLocaleString(
          "en-IN",
        )}).`,
      });
      return;
    }

    const payload = Object.entries(allocations)
      .map(([invoiceId, amount]) => ({
        invoiceId: Number(invoiceId),
        amount: Number(amount),
      }))
      .filter((item) => item.amount > 0);

    startTransition(async () => {
      setFeedback(null);
      const res = await allocatePaymentToInvoices(payment.id, payload);

      if (res?.error) {
        setFeedback({
          type: "error",
          message: res.error,
        });
      } else {
        setFeedback({
          type: "success",
          message: `Successfully allocated ₹${totalDraftAllocated.toLocaleString(
            "en-IN",
          )} across ${payload.length} invoice(s).`,
        });

        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 bg-white text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="border-b border-zinc-200 bg-zinc-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-2xs">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Allocate Payment to Invoices
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                    Distribute unallocated payment funds across outstanding
                    invoices manually or using auto-fill FIFO.
                  </DialogDescription>
                </div>
              </div>

              {/* Payment Receipt / Reference Pill */}
              <div className="flex items-center gap-2 text-right">
                <span className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-mono font-medium text-zinc-700 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {payment?.receiptNumber
                    ? `Receipt #${payment.receiptNumber}`
                    : `Payment #${payment?.id}`}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Payment Details Meta Strip */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {payment?.client?.companyName || "Client"}
              </span>
              {payment?.client?.companyCode && (
                <span className="text-zinc-400">
                  ({payment.client.companyCode})
                </span>
              )}
            </div>

            {payment?.subClient?.companyName && (
              <div className="flex items-center gap-1">
                <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  Subclient: {payment.subClient.companyName}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>{formatDate(payment?.paymentDate)}</span>
            </div>

            {payment?.method && (
              <div className="flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                <span className="capitalize">{payment.method}</span>
              </div>
            )}

            {payment?.reference && (
              <div
                className="flex items-center gap-1"
                title={payment.reference}
              >
                <Receipt className="h-3.5 w-3.5 text-zinc-400" />
                <span className="max-w-[140px] truncate">
                  Ref: {payment.reference}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Balance Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 border-b border-zinc-200 bg-white px-6 py-3 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Total Payment
            </p>
            <p className="mt-0.5 text-sm font-bold text-zinc-900 dark:text-zinc-100">
              ₹
              {Number(payment?.amount || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Already Allocated
            </p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              ₹
              {Number(payment?.allocatedAmount || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-2.5 dark:border-blue-900/50 dark:bg-blue-950/30">
            <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
              Available to Allocate
            </p>
            <p className="mt-0.5 text-sm font-bold text-blue-700 dark:text-blue-300">
              ₹
              {availableUnallocated.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>

          <div
            className={`rounded-lg border p-2.5 ${
              isOverAllocated
                ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
                : remainingAvailable === 0
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                  : "border-orange-200 bg-orange-50/60 dark:border-orange-900/50 dark:bg-orange-950/30"
            }`}
          >
            <p
              className={`text-[11px] font-medium ${
                isOverAllocated
                  ? "text-red-700 dark:text-red-300"
                  : remainingAvailable === 0
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-orange-700 dark:text-orange-300"
              }`}
            >
              {isOverAllocated
                ? "Exceeds Available!"
                : remainingAvailable === 0
                  ? "All Available Allocated"
                  : "Remaining Unallocated"}
            </p>
            <p
              className={`mt-0.5 text-sm font-bold ${
                isOverAllocated
                  ? "text-red-700 dark:text-red-300"
                  : remainingAvailable === 0
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-orange-700 dark:text-orange-300"
              }`}
            >
              {isOverAllocated
                ? `- ₹${(
                    totalDraftAllocated - availableUnallocated
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                : `₹${remainingAvailable.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}`}
            </p>
          </div>
        </div>

        {/* Toolbar: FIFO Button, Subclient Filter, Search, Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50/50 px-6 py-2.5 dark:border-zinc-800 dark:bg-zinc-850/40">
          <div className="flex items-center gap-2">
            {/* Auto-Fill FIFO Button */}
            <button
              type="button"
              onClick={handleAutoFillFIFO}
              disabled={
                loadingInvoices ||
                invoices.length === 0 ||
                availableUnallocated <= 0
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-purple-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              title="Automatically distribute available amount to the oldest invoices first"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Auto-Fill FIFO</span>
            </button>

            {/* Clear All Button */}
            {totalDraftAllocated > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
              >
                <RotateCcw className="h-3 w-3 text-zinc-400" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Subclient Filter */}
            {subClients.length > 0 && (
              <select
                value={filterSubClientId}
                onChange={(e) => setFilterSubClientId(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-700 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="ALL">All Subclients ({invoices.length})</option>
                {subClients.map((sub) => {
                  const count = invoices.filter(
                    (i) => Number(i.subClientId) === Number(sub.id),
                  ).length;
                  return (
                    <option key={sub.id} value={String(sub.id)}>
                      {sub.companyName} ({count})
                    </option>
                  );
                })}
              </select>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search invoice #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-44 rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-800 shadow-2xs placeholder:text-zinc-400 focus:border-blue-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`flex items-center gap-2 border-b px-6 py-2 text-xs font-medium ${
              feedback.type === "error"
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                : feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
            }`}
          >
            {feedback.type === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Invoices List / Table */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] divide-y divide-zinc-100 dark:divide-zinc-800">
          {loadingInvoices ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Loading client outstanding invoices...
              </p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Check className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No Outstanding Invoices
              </p>
              <p className="mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">
                All invoices for this client are currently settled. There are no
                unsettled invoices to allocate this payment to.
              </p>
            </div>
          ) : displayedInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                No invoices match your filter or search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterSubClientId("ALL");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Clear filters ({invoices.length} total available)
              </button>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {displayedInvoices.map((inv) => {
                const due = Number(inv.due || inv.outstandingAmount || 0);
                const currentAlloc = Number(allocations[inv.id] || 0);
                const isSettling = currentAlloc > 0;
                const remainingAfter = Math.max(
                  Math.round((due - currentAlloc) * 100) / 100,
                  0,
                );
                const isExceeding = currentAlloc > due + 0.01;

                return (
                  <div
                    key={inv.id}
                    className={`flex flex-col gap-3 p-3.5 transition sm:flex-row sm:items-center sm:justify-between ${
                      isSettling
                        ? "bg-blue-50/30 dark:bg-blue-950/20"
                        : "bg-white hover:bg-zinc-50/60 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    {/* Invoice Meta */}
                    <div className="flex items-start gap-3 min-w-[240px]">
                      <div className="mt-0.5">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold ${
                            isSettling
                              ? "border-blue-500 bg-blue-600 text-white"
                              : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
                          }`}
                        >
                          {isSettling ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <span className="text-[10px]">INV</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {inv.invoiceNumber}
                          </span>

                          {inv.isOpeningBalance && (
                            <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-700 dark:bg-purple-950/70 dark:text-purple-300">
                              Opening Bal
                            </span>
                          )}

                          {inv.isOverdue && !inv.isOpeningBalance && (
                            <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-red-700 dark:bg-red-950/70 dark:text-red-300">
                              Overdue
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          {inv.subClientName && (
                            <span className="rounded bg-purple-50 px-1 py-0.2 font-medium text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                              {inv.subClientName}
                            </span>
                          )}
                          <span>Due: {formatDate(inv.dueDate)}</span>
                          <span className="text-zinc-300 dark:text-zinc-700">
                            •
                          </span>
                          <span>
                            Total: ₹
                            {Number(
                              inv.invoiceAmount || inv.netPayableAmount || 0,
                            ).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* AWB Popover if present */}
                        {inv.awbs && inv.awbs.length > 0 && (
                          <div className="mt-1">
                            <AwbDetailsPopover
                              awbs={inv.awbs}
                              invoiceNumber={inv.invoiceNumber}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Outstanding Balance */}
                    <div className="shrink-0 text-left sm:text-right min-w-[110px]">
                      <p className="text-[10px] uppercase font-semibold text-zinc-400">
                        Current Due
                      </p>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        ₹
                        {due.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {/* Allocation Input Controls */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-semibold text-zinc-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={due}
                          step="0.01"
                          placeholder="0.00"
                          value={
                            allocations[inv.id] !== undefined
                              ? allocations[inv.id]
                              : ""
                          }
                          onChange={(e) =>
                            handleManualAmountChange(inv.id, e.target.value)
                          }
                          className={`h-8 w-28 rounded-lg border pl-6 pr-2 text-xs font-semibold shadow-2xs focus:outline-hidden ${
                            isExceeding
                              ? "border-red-400 bg-red-50 text-red-700 focus:border-red-500"
                              : isSettling
                                ? "border-blue-400 bg-blue-50/50 text-blue-900 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-200"
                                : "border-zinc-200 bg-white text-zinc-800 focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          }`}
                        />
                      </div>

                      {/* Quick Full / Max Button */}
                      <button
                        type="button"
                        onClick={() => handleFillMaxRow(inv)}
                        disabled={
                          due <= 0 ||
                          (remainingAvailable <= 0 && currentAlloc === 0)
                        }
                        className="h-8 rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-[11px] font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
                        title="Allocate maximum available for this invoice"
                      >
                        Full
                      </button>

                      {/* Clear Button */}
                      {isSettling && (
                        <button
                          type="button"
                          onClick={() => handleClearRow(inv.id)}
                          className="h-8 rounded-lg px-1.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          title="Clear allocation"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Resulting Status Badge */}
                    <div className="shrink-0 text-right min-w-[110px]">
                      {isExceeding ? (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/70 dark:text-red-300">
                          Exceeds Due!
                        </span>
                      ) : isSettling ? (
                        remainingAfter === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <Check className="h-3 w-3" /> Fully Settled
                          </span>
                        ) : (
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            Leaves ₹{remainingAfter.toLocaleString("en-IN")}
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-zinc-400">
                          Unallocated
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/90 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-850/60">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">
              Allocating:
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              ₹
              {totalDraftAllocated.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-zinc-400">/</span>
            <span className="text-zinc-500 dark:text-zinc-400">
              Available: ₹
              {availableUnallocated.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="inline-flex h-8 items-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAllocation}
              disabled={
                isPending ||
                totalDraftAllocated <= 0 ||
                isOverAllocated ||
                loadingInvoices
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Allocating...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>
                    Confirm Allocation (₹
                    {totalDraftAllocated.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                    )
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
