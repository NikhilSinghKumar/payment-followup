"use client";

import { useState, useTransition } from "react";
import {
  Mail,
  Send,
  X,
  Check,
  AlertCircle,
  FileText,
  AlertTriangle,
  Flame,
  MessageSquare,
  Copy,
  ExternalLink,
  Eye,
  Settings,
  Plus,
  Building2,
} from "lucide-react";
import {
  getClientReminderData,
  sendClientReminder,
} from "@/app/actions/reminder";
import { renderManualClientStatementReminderEmail } from "@/lib/notifications/email-renderer";
import LiveEmailModalPreview from "./LiveEmailModalPreview";

export default function SendClientReminderModal({
  clientId,
  clientName,
  buttonClassName,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("compose"); // compose | preview | whatsapp

  const [reminderType, setReminderType] = useState("OVERDUE_NOTICE");
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [customEmail, setCustomEmail] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState(null);

  async function handleOpen() {
    setIsOpen(true);
    setFeedback(null);
    setLoadingData(true);

    try {
      const res = await getClientReminderData(clientId);
      if (res && !res.error) {
        setData(res);

        // Auto-select type
        if (res.clientSummary?.overdueInvoices > 0) {
          setReminderType("OVERDUE_NOTICE");
        } else {
          setReminderType("STATEMENT");
        }

        // Auto-select primary contact emails or client email
        const defaultEmails = [];
        if (res.contacts && res.contacts.length > 0) {
          for (const c of res.contacts) {
            for (const em of c.emails || []) {
              if (
                em.email &&
                (c.receivesInvoice || c.isPrimary || em.isPrimary)
              ) {
                defaultEmails.push(em.email);
              }
            }
          }
        }
        if (defaultEmails.length === 0 && res.client?.email) {
          defaultEmails.push(res.client.email);
        }
        setSelectedEmails([...new Set(defaultEmails)]);
      } else {
        setFeedback({
          type: "error",
          message: res?.error || "Failed to load client data.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to load client data.",
      });
    } finally {
      setLoadingData(false);
    }
  }

  function toggleEmail(email) {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  }

  function handleAddCustomEmail(e) {
    e.preventDefault();
    if (
      customEmail &&
      customEmail.includes("@") &&
      !selectedEmails.includes(customEmail)
    ) {
      setSelectedEmails((prev) => [...prev, customEmail.trim()]);
      setCustomEmail("");
    }
  }

  function handleSend() {
    if (!selectedEmails.length) {
      setFeedback({
        type: "error",
        message: "Please select or enter at least one recipient email.",
      });
      return;
    }

    startTransition(async () => {
      const res = await sendClientReminder({
        clientId,
        recipientEmails: selectedEmails,
        reminderType,
        customNote,
        channel: "EMAIL",
      });

      if (res.success) {
        setFeedback({ type: "success", message: res.message });
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to send reminder",
        });
      }
    });
  }

  const client = data?.client;
  const clientSummary = data?.clientSummary;
  const invoices = data?.invoices || [];
  const company = data?.company;

  const totalOutstandingFormatted = clientSummary
    ? Number(clientSummary.outstandingAmount || 0).toLocaleString("en-IN")
    : "0";

  // Build WhatsApp text
  const whatsappText = client
    ? `*Statement of Outstanding Invoices - ${company?.companyName || "PAFEX"}*\n\n` +
      `Dear ${client?.companyName},\n` +
      `Please find your outstanding invoices summary:\n` +
      `• *Pending Invoices:* ${invoices.length}\n` +
      `• *Overdue Invoices:* ${clientSummary?.overdueInvoices || 0}\n` +
      `• *Total Outstanding:* ₹${totalOutstandingFormatted}\n\n` +
      `*Invoices Breakdown:*\n` +
      invoices
        .slice(0, 8)
        .map(
          (inv) =>
            `- #${inv.invoiceNumber}: ₹${Number(inv.due || 0).toLocaleString("en-IN")} (Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "—"}${inv.isOverdue ? " - OVERDUE" : ""})`,
        )
        .join("\n") +
      (invoices.length > 8
        ? `\n...and ${invoices.length - 8} more invoices`
        : "") +
      (customNote ? `\n\n*Note:* ${customNote}` : "") +
      (company?.bankAccountNumber
        ? `\n\n*Bank A/C:* ${company.bankAccountNumber} (${company.bankIfsc || ""})`
        : "") +
      `\n\nKindly process settlement at the earliest.`
    : "";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          buttonClassName ||
          "inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs transition hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900"
        }
      >
        <Mail size={13} />
        <span>Send Statement / Reminder</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 sm:px-5 sm:py-3.5 dark:border-zinc-800 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <Building2 size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-zinc-900 truncate dark:text-zinc-100">
                    Send Client Statement / Reminder
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate dark:text-zinc-400">
                    {clientName || client?.companyName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex overflow-x-auto [scrollbar-width:none] border-b border-zinc-200 bg-white px-4 sm:px-5 dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setActiveTab("compose")}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                  activeTab === "compose"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                <Settings size={13} />
                <span>Configure & Recipients</span>
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
                <Eye size={13} />
                <span>Statement Preview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("whatsapp")}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                  activeTab === "whatsapp"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                <MessageSquare size={13} />
                <span>WhatsApp Statement</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {loadingData ? (
                <div className="flex h-48 items-center justify-center text-xs text-zinc-500">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
                  <span>Loading client statements and contacts...</span>
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

                  {/* TAB 1: COMPOSE */}
                  {activeTab === "compose" && (
                    <div className="space-y-4">
                      {/* Financial Strip */}
                      {clientSummary && (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            Client Ledger Summary:
                          </span>
                          <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            {invoices.length} Invoices Pending
                          </span>
                          <span className="rounded bg-zinc-200 px-2 py-0.5 font-bold text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
                            Total Due: ₹{totalOutstandingFormatted}
                          </span>
                          {clientSummary.overdueInvoices > 0 && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              {clientSummary.overdueInvoices} Overdue (₹
                              {Number(
                                clientSummary.overdueAmount || 0,
                              ).toLocaleString("en-IN")}
                              )
                            </span>
                          )}
                        </div>
                      )}

                      {/* Reminder Type Selection */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Statement Type
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
                              Standard pending invoice ledger
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
                              Urgent follow-up for aging bills
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setReminderType("SUSPENSION_WARNING")
                            }
                            className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                              reminderType === "SUSPENSION_WARNING"
                                ? "border-red-500 bg-red-50/70 dark:border-red-500 dark:bg-red-950/50"
                                : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold text-xs">
                              <Flame size={13} />
                              <span>Suspension Notice</span>
                            </div>
                            <span className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                              Final demand before service hold
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Recipient Checkboxes */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Recipient Emails ({selectedEmails.length} selected){" "}
                          <span className="text-red-500">*</span>
                        </label>

                        {data?.contacts?.length > 0 ? (
                          <div className="space-y-1.5 rounded-xl border border-zinc-200 p-2.5 dark:border-zinc-800">
                            {data.contacts.map((contact) =>
                              (contact.emails || []).map((em) => (
                                <label
                                  key={`${contact.id}-${em.id || em.email}`}
                                  className="flex cursor-pointer items-center justify-between rounded-lg p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedEmails.includes(
                                        em.email,
                                      )}
                                      onChange={() => toggleEmail(em.email)}
                                      className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                        {em.email}
                                      </span>
                                      <span className="ml-2 text-[10px] text-zinc-400">
                                        ({contact.name}{" "}
                                        {contact.designation
                                          ? `• ${contact.designation}`
                                          : ""}
                                        )
                                      </span>
                                    </div>
                                  </div>
                                  {contact.receivesInvoice && (
                                    <span className="rounded bg-blue-50 px-1.5 py-0.2 text-[9px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                      Billing Contact
                                    </span>
                                  )}
                                </label>
                              )),
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400 italic mb-2">
                            No contact emails found on profile.
                          </p>
                        )}

                        <div className="mt-2 flex gap-2">
                          <input
                            type="email"
                            placeholder="Add another recipient email..."
                            value={customEmail}
                            onChange={(e) => setCustomEmail(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddCustomEmail(e);
                              }
                            }}
                            className="h-8 flex-1 rounded-lg border border-zinc-200 px-2.5 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomEmail}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            <Plus size={13} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>

                      {/* Custom Note */}
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Custom Note / Remarks (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          placeholder="e.g. Please note that several invoices are past due. Requesting batch payment release by Monday..."
                          className="w-full rounded-xl border border-zinc-200 p-2.5 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: UNIFIED LIVE STATEMENT PREVIEW */}
                  {activeTab === "preview" && client && (
                    <LiveEmailModalPreview
                      html={renderManualClientStatementReminderEmail({
                        client,
                        clientSummary,
                        invoices,
                        company,
                        reminderType,
                        customNote,
                      })}
                      subject={
                        reminderType === "SUSPENSION_WARNING"
                          ? `URGENT: Outstanding Dues & Service Suspension Warning | ${client.companyName}`
                          : reminderType === "OVERDUE_NOTICE"
                            ? `Overdue Statement of Account: ${clientSummary?.overdueInvoices || 0} Overdue Invoices | ${client.companyName}`
                            : `Statement of Outstanding Invoices (${invoices.length} Invoices) | ${client.companyName}`
                      }
                      recipientEmails={selectedEmails}
                      senderCompany={company?.companyName || "PAFEX Logistics"}
                      senderEmail={company?.email || ""}
                      reminderType={reminderType}
                    />
                  )}

                  {/* TAB 3: WHATSAPP */}
                  {activeTab === "whatsapp" && client && (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            WhatsApp Statement Template
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(whatsappText);
                              setCopiedWhatsApp(true);
                              setTimeout(() => setCopiedWhatsApp(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-emerald-700 shadow-2xs hover:bg-emerald-50 dark:bg-emerald-900 dark:text-emerald-200"
                          >
                            {copiedWhatsApp ? (
                              <Check size={12} />
                            ) : (
                              <Copy size={12} />
                            )}
                            <span>
                              {copiedWhatsApp ? "Copied" : "Copy Text"}
                            </span>
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed bg-white p-3 rounded-lg border border-emerald-100 dark:bg-zinc-800 dark:border-emerald-900">
                          {whatsappText}
                        </pre>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {data?.contacts?.map((c) =>
                          (c.numbers || []).map((n) => (
                            <a
                              key={n.id || n.number}
                              href={`https://wa.me/${n.countryCode ? n.countryCode.replace("+", "") : "91"}${n.number.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappText)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-700"
                            >
                              <MessageSquare size={13} />
                              <span>
                                WhatsApp {c.name} ({n.number})
                              </span>
                              <ExternalLink size={11} />
                            </a>
                          )),
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 border-t border-zinc-200 bg-zinc-50/80 px-4 py-2.5 sm:px-5 sm:py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
              <span className="text-[11px] text-zinc-400 text-center sm:text-left">
                {selectedEmails.length} recipient(s) configured
              </span>

              <div className="flex w-full sm:w-auto items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 sm:flex-none justify-center rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending || loadingData || !selectedEmails.length}
                  onClick={handleSend}
                  className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Statement Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
