"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Mail,
  Send,
  X,
  Check,
  AlertCircle,
  Users,
  FileText,
  AlertTriangle,
  Flame,
  Building2,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import {
  getBulkInvoicesReminderPreview,
  sendBulkGroupedReminders,
} from "@/app/actions/reminder";
import { renderManualBulkInvoicesReminderEmail } from "@/lib/notifications/email-renderer";
import LiveEmailModalPreview from "./LiveEmailModalPreview";

export default function BulkReminderModal({
  selectedInvoiceIds = [],
  isOpen,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);
  const [clientGroups, setClientGroups] = useState([]);
  const [reminderType, setReminderType] = useState("STATEMENT");
  const [customNote, setCustomNote] = useState("");
  const [activeTab, setActiveTab] = useState("groups"); // groups | preview
  const [previewClientIndex, setPreviewClientIndex] = useState(0);
  const [expandedClient, setExpandedClient] = useState(null);
  const [customEmailInputs, setCustomEmailInputs] = useState({});

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!isOpen || !selectedInvoiceIds.length) return;

    let isMounted = true;
    setLoading(true);
    setFeedback(null);

    getBulkInvoicesReminderPreview(selectedInvoiceIds).then((res) => {
      if (!isMounted) return;
      setLoading(false);
      if (res && !res.error) {
        setPreviewData(res);
        setClientGroups(res.clientGroups || []);
        if (res.clientGroups?.length > 0) {
          setExpandedClient(res.clientGroups[0].clientId);
          const hasOverdue = res.clientGroups.some((g) => g.overdueCount > 0);
          setReminderType(hasOverdue ? "OVERDUE_NOTICE" : "STATEMENT");
        }
      } else {
        setFeedback({
          type: "error",
          message: res?.error || "Failed to load preview data",
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedInvoiceIds]);

  function toggleClientEnabled(clientId) {
    setClientGroups((prev) =>
      prev.map((g) =>
        g.clientId === clientId ? { ...g, enabled: !g.enabled } : g,
      ),
    );
  }

  function toggleContactEmail(clientId, email) {
    setClientGroups((prev) =>
      prev.map((g) => {
        if (g.clientId !== clientId) return g;
        const current = g.selectedEmails || [];
        const updated = current.includes(email)
          ? current.filter((e) => e !== email)
          : [...current, email];
        return { ...g, selectedEmails: updated };
      }),
    );
  }

  function handleAddCustomEmail(clientId) {
    const email = customEmailInputs[clientId]?.trim();
    if (!email || !email.includes("@")) return;

    setClientGroups((prev) =>
      prev.map((g) => {
        if (g.clientId !== clientId) return g;
        const current = g.selectedEmails || [];
        if (current.includes(email)) return g;
        return { ...g, selectedEmails: [...current, email] };
      }),
    );

    setCustomEmailInputs((prev) => ({ ...prev, [clientId]: "" }));
  }

  function handleSendBulk() {
    const active = clientGroups.filter(
      (g) =>
        g.enabled !== false && g.selectedEmails && g.selectedEmails.length > 0,
    );

    if (!active.length) {
      setFeedback({
        type: "error",
        message:
          "Please ensure at least one client is selected with recipient email addresses.",
      });
      return;
    }

    startTransition(async () => {
      const res = await sendBulkGroupedReminders({
        clientGroups,
        reminderType,
        customNote,
        channel: "EMAIL",
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message,
        });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2200);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to dispatch batch reminders",
        });
      }
    });
  }

  if (!isOpen) return null;

  const enabledClients = clientGroups.filter((g) => g.enabled !== false);
  const totalInvoicesToSend = enabledClients.reduce(
    (sum, g) => sum + (g.invoices?.length || 0),
    0,
  );
  const totalDueToSend = enabledClients.reduce((sum, g) => sum + g.totalDue, 0);

  const previewGroup = clientGroups[previewClientIndex] || clientGroups[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Mail size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate dark:text-zinc-100">
                Send Bulk Grouped Reminders
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 truncate dark:text-zinc-400">
                Smart Grouping: 1 Consolidated Statement per Client
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Strip */}
        {previewData && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-blue-50/50 px-4 py-2 sm:px-6 sm:py-2.5 text-xs dark:border-zinc-800 dark:bg-blue-950/20">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-[11px] sm:text-xs">
                Batch Summary:
              </span>
              <span className="rounded-md bg-blue-100 px-2 py-0.5 font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-[11px]">
                {enabledClients.length} Clients
              </span>
              <span className="rounded-md bg-zinc-200 px-2 py-0.5 font-bold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200 text-[11px]">
                {totalInvoicesToSend} Invoices
              </span>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[11px]">
                Total Due: ₹{totalDueToSend.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span>(Clients receive 1 email each)</span>
            </div>
          </div>
        )}

        {/* Modal Tabs */}
        <div className="flex overflow-x-auto [scrollbar-width:none] border-b border-zinc-200 bg-white px-4 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setActiveTab("groups")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
              activeTab === "groups"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Users size={14} />
            <span>Client Groups & Recipients ({clientGroups.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
              activeTab === "preview"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Eye size={14} />
            <span>Email Statement Preview</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex h-56 items-center justify-center text-xs text-zinc-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
              <span>Grouping invoices and resolving client recipients...</span>
            </div>
          ) : (
            <>
              {feedback && (
                <div
                  className={`mb-4 flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                    feedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-200"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <Check size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {activeTab === "groups" && (
                <div className="space-y-5">
                  {/* Tone / Type Selector */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Statement Tone & Subject
                    </label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => setReminderType("STATEMENT")}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                          reminderType === "STATEMENT"
                            ? "border-blue-500 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/50"
                            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-xs">
                          <FileText size={13} />
                          <span>Statement of Account</span>
                        </div>
                        <span className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                          Standard consolidated ledger
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReminderType("OVERDUE_NOTICE")}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                          reminderType === "OVERDUE_NOTICE"
                            ? "border-orange-500 bg-orange-50/70 dark:border-orange-500 dark:bg-orange-950/50"
                            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-semibold text-xs">
                          <AlertTriangle size={13} />
                          <span>Overdue Reminder</span>
                        </div>
                        <span className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                          Highlights overdue invoices
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReminderType("SUSPENSION_WARNING")}
                        className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                          reminderType === "SUSPENSION_WARNING"
                            ? "border-red-500 bg-red-50/70 dark:border-red-500 dark:bg-red-950/50"
                            : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold text-xs">
                          <Flame size={13} />
                          <span>Credit / Hold Warning</span>
                        </div>
                        <span className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                          Strict final demand notice
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Batch Note */}
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Batch Note (Appended to all client statement emails)
                    </label>
                    <input
                      type="text"
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="e.g. Kindly process payments before month-end closure..."
                      className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  {/* Client Groups List */}
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Review Clients & Recipient Emails
                    </label>

                    <div className="space-y-3">
                      {clientGroups.map((group) => {
                        const isExpanded = expandedClient === group.clientId;
                        const isEnabled = group.enabled !== false;

                        return (
                          <div
                            key={group.clientId}
                            className={`rounded-xl border transition ${
                              isEnabled
                                ? "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/80"
                                : "border-zinc-200 bg-zinc-50/50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
                            }`}
                          >
                            {/* Client Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5">
                              <div className="flex items-start sm:items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={() =>
                                    toggleClientEnabled(group.clientId)
                                  }
                                  className="mt-0.5 sm:mt-0 h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                      {group.companyName}
                                    </h4>
                                    <span className="text-[10px] text-zinc-400 font-medium">
                                      ({group.companyCode})
                                    </span>
                                  </div>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-zinc-500">
                                    <span>
                                      {group.invoices.length} Invoices
                                    </span>
                                    <span>•</span>
                                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                                      ₹
                                      {Number(
                                        group.totalDue || 0,
                                      ).toLocaleString("en-IN")}
                                    </span>
                                    {group.overdueCount > 0 && (
                                      <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                                        {group.overdueCount} Overdue
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2 pl-7 sm:pl-0">
                                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                                  {group.selectedEmails?.length || 0}{" "}
                                  recipient(s)
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedClient(
                                      isExpanded ? null : group.clientId,
                                    )
                                  }
                                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-700"
                                >
                                  {isExpanded ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="border-t border-zinc-100 p-3.5 bg-zinc-50/50 space-y-3 dark:border-zinc-700/50 dark:bg-zinc-850">
                                {/* Recipients Selection */}
                                <div>
                                  <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                                    Select Recipients for this Client:
                                  </div>
                                  <div className="space-y-1">
                                    {group.contacts?.length > 0 ? (
                                      group.contacts.map((c) =>
                                        (c.emails || []).map((em) => (
                                          <label
                                            key={`${c.id}-${em.id || em.email}`}
                                            className="flex cursor-pointer items-center justify-between rounded p-1 hover:bg-white dark:hover:bg-zinc-800"
                                          >
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                checked={group.selectedEmails?.includes(
                                                  em.email,
                                                )}
                                                onChange={() =>
                                                  toggleContactEmail(
                                                    group.clientId,
                                                    em.email,
                                                  )
                                                }
                                                className="h-3 w-3 rounded text-blue-600"
                                              />
                                              <span className="text-xs text-zinc-800 dark:text-zinc-200">
                                                {em.email}
                                              </span>
                                              <span className="text-[10px] text-zinc-400">
                                                ({c.name}{" "}
                                                {c.designation
                                                  ? `• ${c.designation}`
                                                  : ""}
                                                )
                                              </span>
                                            </div>
                                            {c.receivesInvoice && (
                                              <span className="text-[9px] font-semibold text-blue-600">
                                                Billing
                                              </span>
                                            )}
                                          </label>
                                        )),
                                      )
                                    ) : (
                                      <p className="text-[11px] text-zinc-400 italic">
                                        No contacts saved for this client.
                                      </p>
                                    )}
                                  </div>

                                  {/* Add Custom Email */}
                                  <div className="mt-2 flex gap-2">
                                    <input
                                      type="email"
                                      placeholder="Add custom recipient email..."
                                      value={
                                        customEmailInputs[group.clientId] || ""
                                      }
                                      onChange={(e) =>
                                        setCustomEmailInputs((prev) => ({
                                          ...prev,
                                          [group.clientId]: e.target.value,
                                        }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddCustomEmail(group.clientId);
                                        }
                                      }}
                                      className="h-7 flex-1 rounded border border-zinc-200 px-2 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAddCustomEmail(group.clientId)
                                      }
                                      className="inline-flex h-7 items-center gap-1 rounded border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                    >
                                      <Plus size={11} />
                                      <span>Add</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Invoices included */}
                                <div>
                                  <div className="mb-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                                    Included Invoices ({group.invoices.length}):
                                  </div>
                                  <div className="max-h-36 overflow-y-auto rounded border border-zinc-200 bg-white text-xs dark:border-zinc-700 dark:bg-zinc-900">
                                    <table className="w-full text-left">
                                      <thead className="bg-zinc-50 text-[10px] uppercase text-zinc-500 border-b dark:bg-zinc-800">
                                        <tr>
                                          <th className="p-1.5">Invoice</th>
                                          <th className="p-1.5">Due Date</th>
                                          <th className="p-1.5">AWBs</th>
                                          <th className="p-1.5 text-right">
                                            Balance
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {group.invoices.map((inv) => (
                                          <tr key={inv.id}>
                                            <td className="p-1.5 font-semibold">
                                              #{inv.invoiceNumber}
                                            </td>
                                            <td
                                              className={`p-1.5 ${inv.isOverdue ? "text-red-600 font-medium" : ""}`}
                                            >
                                              {inv.dueDate
                                                ? new Date(
                                                    inv.dueDate,
                                                  ).toLocaleDateString("en-IN")
                                                : "—"}
                                            </td>
                                            <td className="p-1.5 font-mono text-[10px] text-zinc-500">
                                              {inv.awbs?.length
                                                ? inv.awbs
                                                    .slice(0, 2)
                                                    .join(", ")
                                                : "—"}
                                            </td>
                                            <td className="p-1.5 text-right font-semibold">
                                              ₹
                                              {Number(
                                                inv.due || 0,
                                              ).toLocaleString("en-IN")}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: UNIFIED LIVE STATEMENT PREVIEW */}
              {activeTab === "preview" && previewGroup && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                      Preview Statement for:
                    </label>
                    <select
                      value={previewClientIndex}
                      onChange={(e) =>
                        setPreviewClientIndex(Number(e.target.value))
                      }
                      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      {clientGroups.map((g, idx) => (
                        <option key={g.clientId} value={idx}>
                          {g.companyName} ({g.invoices.length} invoices)
                        </option>
                      ))}
                    </select>
                  </div>

                  <LiveEmailModalPreview
                    html={renderManualBulkInvoicesReminderEmail({
                      client: { companyName: previewGroup.companyName },
                      groupInvoices: previewGroup.invoices || [],
                      company: previewData?.company || {},
                      reminderType,
                      customNote,
                      totalDue: previewGroup.totalDue || 0,
                      overdueCount: previewGroup.overdueCount || 0,
                    })}
                    subject={
                      reminderType === "SUSPENSION_WARNING"
                        ? `URGENT: Outstanding Dues & Service Suspension Warning | ${previewGroup.companyName}`
                        : reminderType === "OVERDUE_NOTICE"
                          ? `Overdue Statement of Account: ${previewGroup.overdueCount} Overdue Invoices | ${previewGroup.companyName}`
                          : `Statement of Outstanding Invoices (${previewGroup.invoices.length} Invoices) | ${previewGroup.companyName}`
                    }
                    recipientEmails={previewGroup.selectedEmails || []}
                    senderCompany={
                      previewData?.company?.companyName || "PAFEX Logistics"
                    }
                    senderEmail={previewData?.company?.email || ""}
                    reminderType={reminderType}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 border-t border-zinc-200 bg-zinc-50/80 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-800/50">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 text-center sm:text-left">
            {enabledClients.length} of {clientGroups.length} clients selected
          </span>

          <div className="flex w-full sm:w-auto items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || loading || !enabledClients.length}
              onClick={handleSendBulk}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 sm:px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  <span>Send {enabledClients.length} Statement(s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
