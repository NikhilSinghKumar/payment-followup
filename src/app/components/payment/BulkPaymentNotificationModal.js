"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getBulkPaymentNotificationsPreview,
  sendBulkPaymentConfirmationEmails,
} from "@/app/actions/bulkPaymentNotification";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  CheckSquare,
  Square,
  Building,
  CreditCard,
  X,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function BulkPaymentNotificationModal({
  isOpen,
  onClose,
  initialPaymentIds = [],
  initialDate = "",
  initialMonth = "",
}) {
  const [filterType, setFilterType] = useState(
    initialDate
      ? "date"
      : initialMonth
        ? "month"
        : initialPaymentIds.length
          ? "selected"
          : "all",
  );
  const [specificDate, setSpecificDate] = useState(
    initialDate || new Date().toISOString().slice(0, 10),
  );
  const [specificMonth, setSpecificMonth] = useState(
    initialMonth || new Date().toISOString().slice(0, 7),
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [data, setData] = useState({
    groups: [],
    totalPayments: 0,
    totalAmount: 0,
  });
  const [selectedClientIds, setSelectedClientIds] = useState(new Set());
  const [clientEmailsMap, setClientEmailsMap] = useState({});
  const [customNote, setCustomNote] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [ccAccounts, setCcAccounts] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [expandedClients, setExpandedClients] = useState(new Set());

  const loadPreviewData = async () => {
    setLoading(true);
    setFeedback(null);

    const payload = {};
    if (filterType === "selected" && initialPaymentIds.length > 0) {
      payload.paymentIds = initialPaymentIds;
    } else if (filterType === "date" && specificDate) {
      payload.filterDate = specificDate;
    } else if (filterType === "month" && specificMonth) {
      payload.filterMonth = specificMonth;
    }

    try {
      const res = await getBulkPaymentNotificationsPreview(payload);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setData(res);

        // Pre-select all clients and default emails
        const newSelected = new Set();
        const initialEmails = {};
        for (const group of res.groups || []) {
          newSelected.add(group.clientId);
          initialEmails[group.clientId] =
            group.selectedEmails || group.availableEmails.slice(0, 2);
        }
        setSelectedClientIds(newSelected);
        setClientEmailsMap(initialEmails);
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: "Failed to load payment notification preview.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load preview whenever modal opens or filters change
  useEffect(() => {
    if (!isOpen) return;

    loadPreviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filterType, specificDate, specificMonth]);

  function toggleClientSelect(clientId) {
    setSelectedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedClientIds.size === (data.groups || []).length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set((data.groups || []).map((g) => g.clientId)));
    }
  }

  function toggleExpanded(clientId) {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  function handleEmailToggle(clientId, email) {
    setClientEmailsMap((prev) => {
      const currentList = prev[clientId] || [];
      const updated = currentList.includes(email)
        ? currentList.filter((e) => e !== email)
        : [...currentList, email];
      return { ...prev, [clientId]: updated };
    });
  }

  function handleAddCustomEmail(clientId, emailToAdd) {
    const trimmed = emailToAdd.trim();
    if (!trimmed || !trimmed.includes("@")) return;

    setClientEmailsMap((prev) => {
      const currentList = prev[clientId] || [];
      if (currentList.includes(trimmed)) return prev;
      return { ...prev, [clientId]: [...currentList, trimmed] };
    });
  }

  async function handleDispatch() {
    if (selectedClientIds.size === 0) {
      alert(
        "Please select at least one client to send payment acknowledgment emails.",
      );
      return;
    }

    const batches = [];
    for (const group of data.groups || []) {
      if (!selectedClientIds.has(group.clientId)) continue;

      const recipientEmails = clientEmailsMap[group.clientId] || [];
      if (!recipientEmails.length) continue;

      batches.push({
        clientId: group.clientId,
        clientName: group.clientName,
        recipientEmails,
        paymentIds: group.payments.map((p) => p.id),
        customNote,
      });
    }

    if (batches.length === 0) {
      alert(
        "None of the selected clients have valid recipient email addresses specified.",
      );
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const res = await sendBulkPaymentConfirmationEmails({
        clientBatches: batches,
        subjectTemplate: customSubject,
        customMessage: customNote,
        ccAccounts,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message:
            res.message ||
            "Payment confirmation emails dispatched successfully.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to dispatch confirmation emails.",
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: "An unexpected error occurred while dispatching emails.",
      });
    } finally {
      setSending(false);
    }
  }

  const selectedCount = selectedClientIds.size;
  const selectedPaymentsTotal = (data.groups || [])
    .filter((g) => selectedClientIds.has(g.clientId))
    .reduce((sum, g) => sum + g.totalPaidAmount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="border-b border-zinc-100 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Send Bulk Payment Confirmation Emails
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Notify clients with itemized payment receipts & ledger credits
                  after bulk import or daily collection.
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filtering Controls Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200/60 pt-3 dark:border-zinc-700/60">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-zinc-400" />
              Target Scope:
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterType("date")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  filterType === "date"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                Specific Date
              </button>

              <button
                type="button"
                onClick={() => setFilterType("month")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  filterType === "month"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                Whole Month
              </button>

              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  filterType === "all"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                All Recent Payments
              </button>

              {initialPaymentIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterType("selected")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    filterType === "selected"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  Imported Batch ({initialPaymentIds.length})
                </button>
              )}
            </div>

            {/* Date / Month Picker Inputs */}
            {filterType === "date" && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">Date:</span>
                <input
                  type="date"
                  value={specificDate}
                  onChange={(e) => setSpecificDate(e.target.value)}
                  className="h-7 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>
            )}

            {filterType === "month" && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">Month:</span>
                <input
                  type="month"
                  value={specificMonth}
                  onChange={(e) => setSpecificMonth(e.target.value)}
                  className="h-7 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 [scrollbar-width:thin]">
          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`flex items-start gap-2.5 rounded-xl p-3 text-xs ${
                feedback.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <div className="flex-1 font-medium">{feedback.message}</div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
              <span className="text-[11px] font-medium text-zinc-500">
                Matching Clients
              </span>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {data.groups?.length || 0} Clients
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
              <span className="text-[11px] font-medium text-zinc-500">
                Payment Transactions
              </span>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {data.totalPayments || 0} Receipts
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
              <span className="text-[11px] font-medium text-zinc-500">
                Selected Value
              </span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ₹{selectedPaymentsTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          {/* Email Customization Options */}
          <div className="rounded-xl border border-zinc-200 bg-white p-3.5 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Email Template & Dispatch Customization
              </span>
              <label className="flex items-center gap-1.5 text-xs text-zinc-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ccAccounts}
                  onChange={(e) => setCcAccounts(e.target.checked)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>CC Company Accounts Email</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-semibold text-zinc-500">
                  Custom Subject Template (Optional)
                </label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. Payment Receipt & Ledger Credit: {amount} - {clientName}"
                  className="mt-1 h-8 w-full rounded-lg border border-zinc-300 bg-white px-2.5 text-xs text-zinc-800 outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-500">
                  Custom Note in Email Body (Optional)
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. We have credited your account ledger. Thank you for your business."
                  className="mt-1 h-8 w-full rounded-lg border border-zinc-300 bg-white px-2.5 text-xs text-zinc-800 outline-none transition focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>

          {/* Client Selection Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              {selectedClientIds.size === (data.groups || []).length &&
              (data.groups || []).length > 0 ? (
                <CheckSquare className="h-4 w-4 text-emerald-600" />
              ) : (
                <Square className="h-4 w-4 text-zinc-400" />
              )}
              <span>
                Select All Clients ({selectedCount} of{" "}
                {data.groups?.length || 0} selected)
              </span>
            </button>
          </div>

          {/* Client Cards List */}
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600 mb-2" />
              <p>Gathering payment records & recipient contacts...</p>
            </div>
          ) : (data.groups || []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-zinc-700">
              <CreditCard className="mx-auto h-8 w-8 text-zinc-300 mb-2" />
              No payment transactions found matching the selected criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {data.groups.map((group) => {
                const isSelected = selectedClientIds.has(group.clientId);
                const isExpanded = expandedClients.has(group.clientId);
                const selectedEmails = clientEmailsMap[group.clientId] || [];

                return (
                  <div
                    key={group.clientId}
                    className={`rounded-xl border transition ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50/20 dark:border-emerald-800 dark:bg-emerald-950/10"
                        : "border-zinc-200 bg-white opacity-70 dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleClientSelect(group.clientId)}
                          className="text-emerald-600 focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5 text-zinc-400" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {group.clientName}
                            </span>
                            {group.clientCode && (
                              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                {group.clientCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500">
                            {group.payments.length} payment receipt(s) totalling{" "}
                            <span className="font-bold text-emerald-600">
                              ₹{group.totalPaidAmount.toLocaleString("en-IN")}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(group.clientId)}
                          className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          <span>{group.payments.length} Payment(s)</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Recipient Emails Selector */}
                    <div className="border-t border-zinc-100 bg-zinc-50/50 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-850/50">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1 mr-1">
                          <Mail className="h-3 w-3" />
                          Send To:
                        </span>

                        {group.availableEmails.map((email) => {
                          const active = selectedEmails.includes(email);
                          return (
                            <button
                              key={email}
                              type="button"
                              onClick={() =>
                                handleEmailToggle(group.clientId, email)
                              }
                              className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                                active
                                  ? "bg-emerald-600 text-white"
                                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {email}
                            </button>
                          );
                        })}

                        {/* Direct email manual entry */}
                        <input
                          type="email"
                          placeholder="+ Add email"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomEmail(
                                group.clientId,
                                e.currentTarget.value,
                              );
                              e.currentTarget.value = "";
                            }
                          }}
                          className="h-6 w-28 rounded border border-zinc-300 bg-white px-1.5 text-[11px] text-zinc-800 outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        />
                      </div>
                    </div>

                    {/* Expanded Transactions Breakdown */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100 p-3 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                        <table className="w-full text-left text-xs">
                          <thead className="text-[10px] uppercase text-zinc-400 border-b border-zinc-100 pb-1">
                            <tr>
                              <th className="py-1">Receipt / Ref</th>
                              <th className="py-1">Date</th>
                              <th className="py-1">Mode</th>
                              <th className="py-1">Invoices Applied</th>
                              <th className="py-1 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                            {group.payments.map((p) => (
                              <tr key={p.id}>
                                <td className="py-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                                  {p.receiptNumber || `PAY-${p.id}`}
                                  {p.reference && (
                                    <span className="text-[10px] text-zinc-400 block">
                                      {p.reference}
                                    </span>
                                  )}
                                </td>
                                <td className="py-1.5 text-zinc-600">
                                  {p.paymentDate
                                    ? new Date(
                                        p.paymentDate,
                                      ).toLocaleDateString("en-IN")
                                    : "—"}
                                </td>
                                <td className="py-1.5 uppercase text-zinc-500 font-mono text-[10px]">
                                  {p.method}
                                </td>
                                <td className="py-1.5 text-zinc-600">
                                  {p.allocations.length > 0 ? (
                                    p.allocations.map((a) => (
                                      <span
                                        key={a.id}
                                        className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-700 mr-1 dark:bg-zinc-800 dark:text-zinc-300"
                                      >
                                        #{a.invoiceNumber}: ₹
                                        {a.allocatedAmount.toLocaleString(
                                          "en-IN",
                                        )}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-orange-500">
                                      Unallocated Credit
                                    </span>
                                  )}
                                </td>
                                <td className="py-1.5 text-right font-bold text-emerald-600">
                                  ₹{p.amount.toLocaleString("en-IN")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-850">
          <div className="text-xs text-zinc-500">
            Sending to{" "}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {selectedCount}
            </span>{" "}
            client(s) with a total of{" "}
            <span className="font-bold text-emerald-600">
              ₹{selectedPaymentsTotal.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDispatch}
              disabled={sending || selectedCount === 0 || loading}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Dispatching Receipts...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Dispatch Payment Acknowledgment Emails</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
