"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  Package,
  ArrowLeft,
  Building2,
  CalendarDays,
  CreditCard,
  Hash,
  FileText,
} from "lucide-react";

import ClientCombobox from "@/app/components/ui/ClientCombobox";
import AwbDetailsPopover from "@/app/components/payment/AwbDetailsPopover";
import { createPayment, getInvoicesForPayment } from "@/app/actions/payment";

export default function PaymentForm({ clients = [] }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSummary, setClientSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [subClients, setSubClients] = useState([]);
  const [selectedSubClientId, setSelectedSubClientId] = useState("");
  const [filterSubClientId, setFilterSubClientId] = useState("ALL");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    method: "bank",
    receiptNumber: "",
    reference: "",
    notes: "",
  });

  const paymentAmount = Number(values.amount || 0);

  // Filtered invoices according to selected tab/filter
  const displayedInvoices = useMemo(() => {
    if (!filterSubClientId || filterSubClientId === "ALL") {
      return invoices;
    }
    const targetSubId = Number(filterSubClientId);
    return invoices.filter((inv) => Number(inv.subClientId) === targetSubId);
  }, [invoices, filterSubClientId]);

  // Calculate selected total due
  const selectedInvoicesList = invoices.filter((inv) =>
    selectedInvoiceIds.includes(inv.id),
  );

  const selectedInvoicesDueSum = selectedInvoicesList.reduce(
    (sum, inv) => sum + Number(inv.due || 0),
    0,
  );

  // Compute allocations based on selected invoices and payment amount
  // If payment amount is specified, we allocate up to payment amount across selected invoices
  // If payment amount is empty or matches selected due, each checked invoice receives its due amount
  const allocations = useMemo(() => {
    const allocMap = {};
    if (selectedInvoiceIds.length === 0) return allocMap;

    let available = paymentAmount > 0 ? paymentAmount : selectedInvoicesDueSum;

    for (const inv of invoices) {
      if (!selectedInvoiceIds.includes(inv.id)) continue;
      const due = Number(inv.due || 0);
      if (due <= 0) continue;

      if (paymentAmount > 0) {
        const allocated = Math.min(due, available);
        if (allocated > 0) {
          allocMap[inv.id] = allocated;
          available -= allocated;
        }
      } else {
        allocMap[inv.id] = due;
      }
    }
    return allocMap;
  }, [selectedInvoiceIds, paymentAmount, invoices, selectedInvoicesDueSum]);

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce(
      (sum, amount) => sum + Number(amount || 0),
      0,
    );
  }, [allocations]);

  const unallocatedAmount = Math.max(paymentAmount - totalAllocated, 0);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubClientChange(e) {
    const val = e.target.value;
    setSelectedSubClientId(val);
    if (val) {
      setFilterSubClientId(val);
    } else {
      setFilterSubClientId("ALL");
    }
  }

  async function handleClientChange(client) {
    setSelectedClient(client);
    setClientSummary(null);
    setInvoices([]);
    setSelectedInvoiceIds([]);
    setSubClients([]);
    setSelectedSubClientId("");
    setFilterSubClientId("ALL");
    setValues((prev) => ({
      ...prev,
      amount: "",
    }));

    if (!client) return;

    try {
      setLoadingInvoices(true);
      const result = await getInvoicesForPayment(client.id);
      setClientSummary(result.clientSummary);
      setInvoices(result.invoices || []);
      setSubClients(result.subClients || []);
    } finally {
      setLoadingInvoices(false);
    }
  }

  function toggleInvoice(invoiceId) {
    setSelectedInvoiceIds((current) => {
      const isCurrentlySelected = current.includes(invoiceId);
      const next = isCurrentlySelected
        ? current.filter((id) => id !== invoiceId)
        : [...current, invoiceId];

      // If user hasn't explicitly entered a payment amount yet, auto-fill with the selected sum
      if (!values.amount || Number(values.amount) === selectedInvoicesDueSum) {
        const nextList = invoices.filter((inv) => next.includes(inv.id));
        const nextSum = nextList.reduce(
          (sum, inv) => sum + Number(inv.due || 0),
          0,
        );
        setValues((prev) => ({
          ...prev,
          amount: nextSum > 0 ? String(nextSum) : "",
        }));
      }

      return next;
    });
  }

  function selectAllInvoices() {
    const targetList =
      filterSubClientId !== "ALL" && displayedInvoices.length > 0
        ? displayedInvoices
        : invoices;
    const allIds = targetList.map((inv) => inv.id);
    setSelectedInvoiceIds(allIds);
    const sum = targetList.reduce((s, inv) => s + Number(inv.due || 0), 0);
    setValues((prev) => ({
      ...prev,
      amount: sum > 0 ? String(sum) : prev.amount,
    }));
  }

  function clearInvoices() {
    setSelectedInvoiceIds([]);
  }

  function handleAutoAllocateOldest() {
    if (paymentAmount <= 0) return;
    let remaining = paymentAmount;
    const selected = [];

    // Prioritize displayed/filtered invoices first if filtered
    const targetInvoices =
      displayedInvoices.length > 0 && filterSubClientId !== "ALL"
        ? [
            ...displayedInvoices,
            ...invoices.filter((inv) => !displayedInvoices.includes(inv)),
          ]
        : invoices;

    for (const inv of targetInvoices) {
      if (remaining <= 0) break;
      const due = Number(inv.due || 0);
      if (due <= 0) continue;
      selected.push(inv.id);
      remaining -= Math.min(due, remaining);
    }
    setSelectedInvoiceIds(selected);
  }

  const canSubmit = selectedClient && paymentAmount > 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-2.5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/payments"
            className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-2xs transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Back to Payments"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              New Payment
            </h1>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {errorMessage}
        </div>
      )}

      <form
        action={(formData) => {
          setErrorMessage("");
          startTransition(async () => {
            try {
              await createPayment(formData);
            } catch (err) {
              setErrorMessage(err.message || "Failed to create payment.");
            }
          });
        }}
        className="space-y-2.5"
      >
        {/* Hidden Form Inputs */}
        <input type="hidden" name="clientId" value={selectedClient?.id ?? ""} />
        <input
          type="hidden"
          name="subClientId"
          value={selectedSubClientId || ""}
        />

        {/* Hidden Allocation Form Inputs */}
        {Object.entries(allocations).map(([invId, allocAmt]) => (
          <div key={`alloc-group-${invId}`}>
            <input type="hidden" name="allocationInvoiceId" value={invId} />
            <input type="hidden" name="allocationAmount" value={allocAmt} />
          </div>
        ))}

        {/* Top Control Bar: Client & Payment Details */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-center">
            {/* Client Selector */}
            <div className="sm:col-span-4">
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Select Client <span className="text-red-500">*</span>
              </label>
              <ClientCombobox
                clients={clients}
                selectedClient={selectedClient}
                onSelect={handleClientChange}
                placeholder="Search client..."
              />
            </div>

            {/* Sub-Client Selector */}
            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Subclient{" "}
                <span className="text-[10px] font-normal text-zinc-400">
                  (Optional)
                </span>
              </label>
              <select
                value={selectedSubClientId}
                onChange={handleSubClientChange}
                disabled={!selectedClient || subClients.length === 0}
                className="h-8.5 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-800 shadow-2xs outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:disabled:bg-zinc-800/50"
              >
                {!selectedClient ? (
                  <option value="">Select client first</option>
                ) : subClients.length === 0 ? (
                  <option value="">Directly by Client (No subclients)</option>
                ) : (
                  <>
                    <option value="">Directly by Client (Default)</option>
                    {subClients.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.companyName}{" "}
                        {sc.companyCode ? `(${sc.companyCode})` : ""}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Payment Amount */}
            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Payment Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                  ₹
                </span>
                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  value={values.amount}
                  onChange={handleChange}
                  disabled={!selectedClient}
                  required
                  placeholder="0.00"
                  className="h-8.5 w-full rounded-lg border border-zinc-200 bg-white pl-7 pr-2.5 text-xs font-semibold text-zinc-900 shadow-2xs outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:disabled:bg-zinc-800/50"
                />
              </div>
            </div>

            {/* Payment Date */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="paymentDate"
                  value={values.paymentDate}
                  onChange={handleChange}
                  disabled={!selectedClient}
                  required
                  className="h-8.5 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 shadow-2xs outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:disabled:bg-zinc-800/50"
                />
              </div>
            </div>
          </div>

          {/* Method, Reference & Notes Row */}
          <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <select
                name="method"
                value={values.method}
                onChange={handleChange}
                disabled={!selectedClient}
                className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-800 shadow-2xs outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:disabled:bg-zinc-800/50"
              >
                <option value="bank">Bank Transfer / NEFT / RTGS</option>
                <option value="upi">UPI / QR Code</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="adjustment">Adjustment / Credit</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                name="reference"
                value={values.reference}
                onChange={handleChange}
                disabled={!selectedClient}
                placeholder="UTR / Cheque / Ref Number..."
                className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 shadow-2xs outline-none transition placeholder:text-zinc-400 focus:border-blue-500 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:disabled:bg-zinc-800/50"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                name="receiptNumber"
                value={values.receiptNumber}
                onChange={handleChange}
                disabled={!selectedClient}
                placeholder="Receipt / Voucher..."
                className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 shadow-2xs outline-none transition placeholder:text-zinc-400 focus:border-blue-500 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:disabled:bg-zinc-800/50"
              />
            </div>
            <div className="sm:col-span-4">
              <input
                type="text"
                name="notes"
                value={values.notes}
                onChange={handleChange}
                disabled={!selectedClient}
                placeholder="Payment notes / remarks..."
                className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-800 shadow-2xs outline-none transition placeholder:text-zinc-400 focus:border-blue-500 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:disabled:bg-zinc-800/50"
              />
            </div>
          </div>

          {/* Client Financial & Allocation Stats Strip */}
          {selectedClient && clientSummary && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800">
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

              {paymentAmount > 0 && (
                <div className="ml-auto flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Check size={12} />
                    <span>
                      Allocated: ₹{totalAllocated.toLocaleString("en-IN")} (
                      {Object.keys(allocations).length} inv)
                    </span>
                  </div>
                  {unallocatedAmount > 0 && (
                    <div className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">
                      <span>
                        Unallocated: ₹
                        {unallocatedAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoices List with Checkboxes & AWBs */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50/80 px-3.5 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
                Outstanding Invoices
              </h2>
            </div>

            {selectedClient && invoices.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                {paymentAmount > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleAutoAllocateOldest}
                      className="font-medium text-purple-600 transition hover:text-purple-700 dark:text-purple-400"
                    >
                      Auto-Settle Oldest
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  </>
                )}
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
            <div className="p-8 text-center">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Check size={16} />
              </div>
              <p className="mt-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                No Outstanding Invoices Found
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                All invoices for this client are settled. You can still record
                unallocated on-account payment.
              </p>
            </div>
          ) : displayedInvoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                No invoices found for the selected filter
              </p>
              <button
                type="button"
                onClick={() => setFilterSubClientId("ALL")}
                className="mt-2.5 inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
              >
                View All Client Invoices ({invoices.length})
              </button>
            </div>
          ) : (
            <div className="max-h-[calc(100vh-340px)] min-h-[140px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
              {displayedInvoices.map((invoice) => {
                const isSelected = selectedInvoiceIds.includes(invoice.id);
                const currentAllocation = allocations[invoice.id] || 0;

                return (
                  <div
                    key={invoice.id}
                    onClick={() => toggleInvoice(invoice.id)}
                    className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition select-none ${
                      isSelected
                        ? "bg-blue-50/30 dark:bg-blue-950/20"
                        : "bg-white hover:bg-zinc-50/70 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className="shrink-0"
                      title={isSelected ? "Deselect invoice" : "Select invoice"}
                    >
                      {isSelected ? (
                        <div className="flex h-4 w-4 items-center justify-center rounded bg-blue-600 text-white shadow-2xs">
                          <Check size={11} />
                        </div>
                      ) : (
                        <div className="h-4 w-4 rounded border border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800" />
                      )}
                    </div>

                    {/* Invoice Info & Sub-client */}
                    <div className="w-[180px] shrink-0 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {invoice.invoiceNumber}
                        </span>
                        {invoice.isOpeningBalance && (
                          <span className="shrink-0 rounded bg-purple-100 px-1 py-0.2 text-[9px] font-bold text-purple-700 dark:bg-purple-950/70 dark:text-purple-300">
                            Opening Bal
                          </span>
                        )}
                        {invoice.isOverdue && !invoice.isOpeningBalance && (
                          <span className="shrink-0 rounded bg-red-100 px-1 py-0.2 text-[9px] font-bold uppercase text-red-700 dark:bg-red-950/70 dark:text-red-300">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400">
                        {invoice.subClientName && (
                          <span
                            className="inline-block max-w-[95px] truncate rounded bg-purple-50 px-1 py-0.2 font-medium text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                            title={invoice.subClientName}
                          >
                            {invoice.subClientName}
                          </span>
                        )}
                        <span>Due: {formatDate(invoice.dueDate)}</span>
                      </div>
                    </div>

                    {/* AWB Information Section */}
                    <div className="flex-1 min-w-[150px]">
                      <AwbDetailsPopover
                        awbs={invoice.awbs}
                        invoiceNumber={invoice.invoiceNumber}
                      />
                    </div>

                    {/* Financial Values */}
                    <div className="w-[120px] shrink-0 text-right">
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
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-zinc-50/90 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/60">
            <Link
              href="/payments"
              className="inline-flex h-8 items-center rounded-lg border border-zinc-300 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit || isPending}
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
                  <span>Save Payment</span>
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
