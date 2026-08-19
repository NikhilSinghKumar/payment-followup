"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Clock,
  ArrowLeft,
  FileText,
  Building2,
} from "lucide-react";

import ClientCombobox from "@/app/components/ui/ClientCombobox";
import { getInvoicesForFollowup, createFollowup } from "@/app/actions/followup";

export default function FollowupForm({ clients = [] }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSummary, setClientSummary] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [invoiceRemarks, setInvoiceRemarks] = useState({});
  const [generalNote, setGeneralNote] = useState("");

  const [followupDate, setFollowupDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [nextFollowupDate, setNextFollowupDate] = useState("");

  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleClientChange(client) {
    setSelectedClient(client);
    setSelectedInvoiceIds([]);
    setInvoiceRemarks({});
    setGeneralNote("");
    setClientSummary(null);
    setInvoices([]);

    if (!client) return;

    try {
      setLoadingInvoices(true);
      const result = await getInvoicesForFollowup(client.id);
      setClientSummary(result.clientSummary);
      setInvoices(result.invoices || []);

      // Auto-select all outstanding invoices by default for convenience
      if (result.invoices && result.invoices.length > 0) {
        setSelectedInvoiceIds(result.invoices.map((inv) => inv.id));
      }
    } finally {
      setLoadingInvoices(false);
    }
  }

  function toggleInvoice(invoiceId) {
    setSelectedInvoiceIds((current) => {
      if (current.includes(invoiceId)) {
        return current.filter((id) => id !== invoiceId);
      }
      return [...current, invoiceId];
    });
  }

  function selectAllInvoices() {
    setSelectedInvoiceIds(invoices.map((inv) => inv.id));
  }

  function clearInvoices() {
    setSelectedInvoiceIds([]);
  }

  function handleRemarkChange(invoiceId, text) {
    setInvoiceRemarks((prev) => ({
      ...prev,
      [invoiceId]: text,
    }));

    // Auto-select invoice if user types a remark
    if (text.trim() && !selectedInvoiceIds.includes(invoiceId)) {
      setSelectedInvoiceIds((prev) => [...prev, invoiceId]);
    }
  }

  function setNextDatePreset(daysAhead) {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    setNextFollowupDate(target.toISOString().split("T")[0]);
  }

  // Calculate selected total outstanding
  const selectedInvoicesList = invoices.filter((inv) =>
    selectedInvoiceIds.includes(inv.id),
  );
  const selectedOutstandingSum = selectedInvoicesList.reduce(
    (sum, inv) => sum + Number(inv.due || 0),
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-2.5">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              New Follow-up
            </h1>
          </div>
        </div>
      </div>

      <form
        action={(formData) => {
          startTransition(async () => {
            await createFollowup(formData);
          });
        }}
        className="space-y-2.5"
      >
        {/* Hidden Form Inputs */}
        <input type="hidden" name="clientId" value={selectedClient?.id ?? ""} />
        <input type="hidden" name="followupDate" value={followupDate} />
        <input type="hidden" name="nextFollowupDate" value={nextFollowupDate} />
        <input type="hidden" name="note" value={generalNote} />

        {selectedInvoiceIds.map((invoiceId) => (
          <input
            key={`inv-id-${invoiceId}`}
            type="hidden"
            name="invoiceIds"
            value={invoiceId}
          />
        ))}

        {/* Top Control Bar: Client Selection & Dates */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-center">
            {/* Client Selector */}
            <div className="sm:col-span-5">
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Select Client <span className="text-red-500">*</span>
              </label>
              <ClientCombobox
                clients={clients}
                selectedClient={selectedClient}
                onSelect={handleClientChange}
                placeholder="Search by company name or code..."
              />
            </div>

            {/* Follow-up Date */}
            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Follow-up Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CalendarDays
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  required
                  className="h-8.5 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-2.5 text-xs text-zinc-800 shadow-2xs outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Next Follow-up Date */}
            <div className="sm:col-span-4">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Next Follow-up
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNextDatePreset(3)}
                    className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    +3d
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextDatePreset(7)}
                    className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    +7d
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextDatePreset(15)}
                    className="rounded bg-zinc-100 px-1.5 py-0.2 text-[10px] font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    +15d
                  </button>
                  {nextFollowupDate && (
                    <button
                      type="button"
                      onClick={() => setNextFollowupDate("")}
                      className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      title="Clear next date"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="relative">
                <Clock
                  size={14}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="date"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                  className="h-8.5 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-2.5 text-xs text-zinc-800 shadow-2xs outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>

          {/* Client Financial Stats Strip */}
          {selectedClient && clientSummary && (
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800">
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Client Stats:
              </span>
              <div className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <span>Invoices:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {clientSummary.totalInvoices}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                <span>Total Due:</span>
                <span className="font-semibold">
                  ₹
                  {Number(clientSummary.outstandingAmount || 0).toLocaleString(
                    "en-IN",
                  )}
                </span>
              </div>
              {Number(clientSummary.overdueAmount || 0) > 0 && (
                <div className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  <span>Overdue:</span>
                  <span className="font-semibold">
                    ₹
                    {Number(clientSummary.overdueAmount || 0).toLocaleString(
                      "en-IN",
                    )}{" "}
                    ({clientSummary.overdueInvoices})
                  </span>
                </div>
              )}
              {selectedInvoiceIds.length > 0 && (
                <div className="ml-auto inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Check size={12} />
                  <span>
                    Selected: {selectedInvoiceIds.length} inv (₹
                    {selectedOutstandingSum.toLocaleString("en-IN")})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoices & Remarks Section */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50/80 px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                Outstanding Invoices & Remarks
              </h2>
              {invoices.length > 0 && (
                <span className="rounded-full bg-zinc-200 px-2 py-0.2 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  {invoices.length}
                </span>
              )}
            </div>

            {selectedClient && invoices.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllInvoices}
                  className="font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400"
                >
                  Select All
                </button>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={clearInvoices}
                  className="font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>

          {/* Body Content */}
          {!selectedClient ? (
            <div className="flex flex-col items-center justify-center p-8 text-center sm:p-10">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                No Client Selected
              </p>
            </div>
          ) : loadingInvoices ? (
            <div className="flex items-center justify-center p-8 text-center">
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>Loading outstanding invoices...</span>
              </div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="space-y-2.5 p-5 text-center">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Check size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  No Outstanding Invoices Found
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                  All invoices for this client are settled. You can record a
                  general follow-up note below.
                </p>
              </div>
              <div className="mx-auto max-w-md pt-1">
                <input
                  type="text"
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  placeholder="General follow-up note (e.g. general discussion, query)..."
                  className="h-8 w-full rounded-lg border border-zinc-300 bg-white px-2.5 text-xs text-zinc-800 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-330px)] min-h-[140px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
              {invoices.map((invoice) => {
                const isSelected = selectedInvoiceIds.includes(invoice.id);
                const currentRemark = invoiceRemarks[invoice.id] || "";

                return (
                  <div
                    key={invoice.id}
                    className={`flex items-center gap-3 px-3.5 py-2 transition ${
                      isSelected
                        ? "bg-blue-50/25 dark:bg-blue-950/15"
                        : "bg-white hover:bg-zinc-50/60 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    {/* Hidden inputs to pass along invoiceNumber & specific remark */}
                    <input
                      type="hidden"
                      name={`invoiceNumber_${invoice.id}`}
                      value={invoice.invoiceNumber || ""}
                    />
                    <input
                      type="hidden"
                      name={`remark_${invoice.id}`}
                      value={currentRemark}
                    />

                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleInvoice(invoice.id)}
                      className="text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200 shrink-0"
                      title={isSelected ? "Deselect invoice" : "Select invoice"}
                    >
                      {isSelected ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded bg-blue-600 text-white shadow-2xs">
                          <Check size={11} />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded border border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800" />
                      )}
                    </button>

                    {/* Invoice Number & Overdue Status */}
                    <div className="w-[190px] shrink-0 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {invoice.invoiceNumber}
                        </span>
                        {invoice.isOverdue && (
                          <span className="shrink-0 rounded bg-red-100 px-1 py-0.2 text-[9px] font-bold uppercase text-red-700 dark:bg-red-950/70 dark:text-red-300">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                        {invoice.subClientName && (
                          <span
                            className="truncate max-w-[90px]"
                            title={invoice.subClientName}
                          >
                            {invoice.subClientName} •
                          </span>
                        )}
                        <span>Due: {formatDate(invoice.dueDate)}</span>
                      </div>
                    </div>

                    {/* Due Amount */}
                    <div className="w-[110px] shrink-0 text-right">
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        ₹{Number(invoice.due || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Total: ₹
                        {Number(invoice.invoiceAmount || 0).toLocaleString(
                          "en-IN",
                        )}
                      </div>
                    </div>

                    {/* Remark Input */}
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={currentRemark}
                        onChange={(e) =>
                          handleRemarkChange(invoice.id, e.target.value)
                        }
                        className={`h-7.5 w-full rounded-md border px-2.5 text-xs outline-none transition ${
                          isSelected
                            ? "border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                            : "border-zinc-200 bg-zinc-50/70 text-zinc-500 placeholder-zinc-400 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Clean Bottom Action Bar */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50/90 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/60">
            <Link
              href="/followups"
              className="inline-flex h-8 items-center rounded-lg border border-zinc-300 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!selectedClient || isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Follow-up</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
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
