"use client";

import { useState, useTransition } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Mail,
  Send,
  CheckSquare,
  Square,
  Users,
  Building,
  RefreshCw,
  Clock,
  Sliders,
  Check,
  AlertCircle,
  FileText,
  Eye,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import {
  sendSuspensionNoticeToSelected,
  sendInternalDefaultersSummaryEmail,
  getInternalSuspensionSummaryPreviewHtml,
} from "@/app/actions/suspension";
import { updateNotificationSettings } from "@/app/actions/notificationSettings";

export default function SuspensionControlCenter({
  initialDefaulters = [],
  initialSettings = {},
  company = {},
}) {
  const [defaulters, setDefaulters] = useState(initialDefaulters);
  const [selectedClientIds, setSelectedClientIds] = useState(
    initialDefaulters.map((d) => d.clientId),
  );
  const [autoSendNotice, setAutoSendNotice] = useState(
    initialSettings.autoSendSuspensionNotice ?? false,
  );
  const [sendInternalAlert, setSendInternalAlert] = useState(
    initialSettings.sendInternalSuspensionAlert ?? true,
  );
  const [internalCustomEmails, setInternalCustomEmails] = useState(
    initialSettings.ccAccountsEmail || company.email || "",
  );
  const [customNote, setCustomNote] = useState("");

  const [feedback, setFeedback] = useState(null);
  const [isSendingNotices, startSendingTransition] = useTransition();
  const [isSendingSummary, startSummaryTransition] = useTransition();
  const [isSavingToggle, startToggleTransition] = useTransition();

  // Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Selection helpers
  const allSelected =
    defaulters.length > 0 && selectedClientIds.length === defaulters.length;
  const isIndeterminate =
    selectedClientIds.length > 0 &&
    selectedClientIds.length < defaulters.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(defaulters.map((d) => d.clientId));
    }
  }

  function toggleSelectClient(clientId) {
    setSelectedClientIds((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId],
    );
  }

  // Handle Auto-send toggle switch change
  function handleAutoSendToggle() {
    const nextVal = !autoSendNotice;
    setAutoSendNotice(nextVal);
    setFeedback(null);

    startToggleTransition(async () => {
      const res = await updateNotificationSettings({
        ...initialSettings,
        autoSendSuspensionNotice: nextVal,
        sendInternalSuspensionAlert: sendInternalAlert,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: nextVal
            ? "Automated suspension emails to clients ENABLED."
            : "Automated suspension emails to clients DISABLED (internal manual control only).",
        });
      } else {
        setAutoSendNotice(!nextVal); // Revert on failure
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  // Handle Internal alert toggle
  function handleInternalAlertToggle() {
    const nextVal = !sendInternalAlert;
    setSendInternalAlert(nextVal);
    setFeedback(null);

    startToggleTransition(async () => {
      const res = await updateNotificationSettings({
        ...initialSettings,
        autoSendSuspensionNotice: autoSendNotice,
        sendInternalSuspensionAlert: nextVal,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: nextVal
            ? "Automated internal suspension alerts to team ENABLED."
            : "Automated internal suspension alerts DISABLED.",
        });
      } else {
        setSendInternalAlert(!nextVal);
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  // Dispatch suspension notifications to selected clients
  function handleSendSuspensionToSelected() {
    if (selectedClientIds.length === 0) {
      setFeedback({
        type: "error",
        message:
          "Please select at least one client to send suspension notices.",
      });
      return;
    }

    setFeedback(null);
    startSendingTransition(async () => {
      const res = await sendSuspensionNoticeToSelected(
        selectedClientIds,
        customNote,
      );

      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message,
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to send suspension notices.",
        });
      }
    });
  }

  // Dispatch internal summary report email
  function handleSendInternalSummary() {
    setFeedback(null);
    const emails = internalCustomEmails
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));

    if (emails.length === 0) {
      setFeedback({
        type: "error",
        message:
          "Please specify at least one valid internal team email address.",
      });
      return;
    }

    startSummaryTransition(async () => {
      const res = await sendInternalDefaultersSummaryEmail({
        recipientEmails: emails,
        clientIds: selectedClientIds.length > 0 ? selectedClientIds : null,
        customNote,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message,
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to dispatch internal summary report.",
        });
      }
    });
  }

  // Open internal summary preview
  async function handleOpenSummaryPreview() {
    setIsPreviewLoading(true);
    setPreviewOpen(true);
    const res = await getInternalSuspensionSummaryPreviewHtml({
      clientIds: selectedClientIds.length > 0 ? selectedClientIds : null,
      customNote,
    });
    setIsPreviewLoading(false);

    if (res.success) {
      setPreviewHtml(res.html);
      setPreviewSubject(res.subject);
    } else {
      setFeedback({ type: "error", message: res.error });
      setPreviewOpen(false);
    }
  }

  // Aggregated totals
  const totalSelectedOverdue = defaulters
    .filter((d) => selectedClientIds.includes(d.clientId))
    .reduce((sum, d) => sum + Number(d.totalOverdue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-2 rounded-xl p-4 text-xs font-medium transition ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
              : "border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check size={16} className="shrink-0" />
            ) : (
              <AlertCircle size={16} className="shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* AUTOMATION & POLICY CONTROLS BANNER */}
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/50 via-white to-amber-50/30 p-5 shadow-xs dark:border-red-900/60 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Service Suspension Automation & Policy Controls
                </h3>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-red-800 dark:bg-red-950 dark:text-red-300">
                  Credit Rule: 10+ Days Past Due
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl">
                Control whether automated suspension emails are dispatched
                directly to defaulter clients during background scheduler runs,
                or keep manual review before dispatching.
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-red-100 bg-white/80 p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-800/80">
            {/* Toggle 1: Auto-send to Clients */}
            <div className="flex items-center gap-3 pr-2">
              <div>
                <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Auto-Send to Clients
                </span>
                <span className="text-[10px] text-zinc-500">
                  {autoSendNotice
                    ? "Enabled (Automated)"
                    : "Disabled (Manual Only)"}
                </span>
              </div>

              <button
                type="button"
                disabled={isSavingToggle}
                onClick={handleAutoSendToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                  autoSendNotice ? "bg-red-600" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
                title="Toggle automated suspension email dispatch to clients"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    autoSendNotice ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />

            {/* Toggle 2: Internal alert */}
            <div className="flex items-center gap-3">
              <div>
                <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Internal Team Alerts
                </span>
                <span className="text-[10px] text-zinc-500">
                  {sendInternalAlert ? "Active (CC/Alerts)" : "Muted"}
                </span>
              </div>

              <button
                type="button"
                disabled={isSavingToggle}
                onClick={handleInternalAlertToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                  sendInternalAlert
                    ? "bg-blue-600"
                    : "bg-zinc-300 dark:bg-zinc-700"
                }`}
                title="Toggle internal suspension alert emails"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    sendInternalAlert ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">
              Total Defaulter Clients
            </span>
            <Users size={16} className="text-zinc-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {defaulters.length}
            </span>
            <span className="text-xs text-red-600 font-medium">
              (Overdue &ge; 10 Days)
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">
              Selected Defaulters Exposure
            </span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600">
              ₹
              {totalSelectedOverdue.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              ({selectedClientIds.length} Selected)
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">
              Automation Mode
            </span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                autoSendNotice
                  ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              }`}
            >
              {autoSendNotice
                ? "Automated Dispatch Active"
                : "Controlled Manual Review"}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN DEFAULTERS TABLE SECTION */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        {/* Table Header Controls */}
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {allSelected ? (
                <>
                  <CheckSquare size={15} className="text-blue-600" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square size={15} className="text-zinc-400" />
                  <span>Select All ({defaulters.length})</span>
                </>
              )}
            </button>

            <span className="text-xs text-zinc-500 font-medium">
              {selectedClientIds.length} of {defaulters.length} client(s)
              selected
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isPreviewLoading}
              onClick={handleOpenSummaryPreview}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              title="Preview the internal list email"
            >
              <Eye size={14} />
              <span>Preview Internal List</span>
            </button>

            <button
              type="button"
              disabled={isSendingSummary}
              onClick={handleSendInternalSummary}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600 transition"
              title="Send internal team list of clients for suspension notice"
            >
              {isSendingSummary ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Dispatching Email...</span>
                </>
              ) : (
                <>
                  <Mail size={14} />
                  <span>Email Internal Team List</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSendingNotices || selectedClientIds.length === 0}
              onClick={handleSendSuspensionToSelected}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 disabled:opacity-50 transition"
              title="Send official suspension notice to selected clients"
            >
              {isSendingNotices ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Sending Notices...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>
                    Send Suspension Notice ({selectedClientIds.length})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Optional Custom Note / Internal Recipient Configuration */}
        <div className="grid grid-cols-1 gap-4 border-b border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Internal Recipient Email(s) for Defaulters Report:
            </label>
            <input
              type="text"
              value={internalCustomEmails}
              onChange={(e) => setInternalCustomEmails(e.target.value)}
              placeholder="accounts@pafex.in, manager@pafex.in"
              className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Separate multiple emails with commas. This internal report will
              contain full client breakdown.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Custom Message / Internal Note:
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Please put logistics bookings on hold until UTR is verified."
              className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Optional note included in both client notices and internal report.
            </p>
          </div>
        </div>

        {/* Defaulters Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 uppercase text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="w-12 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Client Name / Code</th>
                <th className="px-4 py-3 font-semibold">Primary Email</th>
                <th className="px-4 py-3 font-semibold text-center">
                  Max Aging
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Oldest Due Date
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Overdue Invoices
                </th>
                <th className="px-4 py-3 font-semibold text-right">
                  Total Overdue
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Last Notified
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {defaulters.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="py-12 text-center text-xs text-zinc-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert size={28} className="text-zinc-400" />
                      <span className="font-semibold">
                        No clients currently meet the service suspension
                        criteria (&ge; 10 days overdue).
                      </span>
                      <span className="text-zinc-400">
                        All client credit accounts are within allowable limits.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                defaulters.map((client) => {
                  const isSelected = selectedClientIds.includes(
                    client.clientId,
                  );
                  const formattedOverdue = Number(
                    client.totalOverdue || 0,
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 });

                  const oldestDate = client.oldestDueDate
                    ? new Date(client.oldestDueDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )
                    : "—";

                  const lastSent = client.lastNotifiedAt
                    ? new Date(client.lastNotifiedAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )
                    : "Never";

                  return (
                    <tr
                      key={client.clientId}
                      className={`transition hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 ${
                        isSelected ? "bg-red-50/30 dark:bg-red-950/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectClient(client.clientId)}
                          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {client.clientName}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Code:{" "}
                          <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                            {client.companyCode || "—"}
                          </span>{" "}
                          | Contact: {client.contactName}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {client.email ? (
                          <span className="font-mono text-[11px]">
                            {client.email}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Missing Email
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
                          {client.maxOverdueDays} days past due
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">
                        {oldestDate}
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-zinc-900 dark:text-zinc-100">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                          {client.overdueInvoiceCount} bill(s)
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">
                        ₹{formattedOverdue}
                      </td>

                      <td className="px-4 py-3 text-center text-[11px] text-zinc-500">
                        {lastSent}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-red-600" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Live Email Preview: Internal Defaulters Report
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Subject:{" "}
                    {previewSubject || "Service Suspension Defaulters Report"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / IFrame Preview */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-4 dark:bg-zinc-950">
              {isPreviewLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                </div>
              ) : (
                <iframe
                  srcDoc={previewHtml}
                  title="Email Preview"
                  className="h-full w-full rounded-xl border border-zinc-300 bg-white shadow-xs dark:border-zinc-700"
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-xs text-zinc-500">
                Report includes breakdown of {selectedClientIds.length} selected
                client(s).
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={isSendingSummary}
                  onClick={() => {
                    setPreviewOpen(false);
                    handleSendInternalSummary();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <Mail size={14} />
                  <span>Send Email to Team Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
