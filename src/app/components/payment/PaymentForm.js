"use client";

import { useMemo, useState } from "react";

import ClientCombobox from "@/app/components/ui/ClientCombobox";
import ClientSummaryCard from "@/app/components/followup/ClientSummaryCard";

import { createPayment, getInvoicesForPayment } from "@/app/actions/payment";

export default function PaymentForm({ clients = [] }) {
  const [selectedClient, setSelectedClient] = useState(null);

  const [clientSummary, setClientSummary] = useState(null);

  const [invoices, setInvoices] = useState([]);

  const [allocations, setAllocations] = useState({});

  const [values, setValues] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    method: "bank",
    receiptNumber: "",
    reference: "",
    notes: "",
  });

  // ======================================================
  // PAYMENT AMOUNT
  // ======================================================

  const paymentAmount = Number(values.amount || 0);

  // ======================================================
  // TOTAL ALLOCATED
  // ======================================================

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce(
      (sum, amount) => sum + Number(amount || 0),
      0,
    );
  }, [allocations]);

  // ======================================================
  // UNALLOCATED
  // ======================================================

  const unallocatedAmount = Math.max(paymentAmount - totalAllocated, 0);

  // ======================================================
  // FIELD CHANGE
  // ======================================================

  function handleChange(e) {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // ======================================================
  // CLIENT CHANGE
  // ======================================================

  async function handleClientChange(client) {
    setSelectedClient(client);

    setClientSummary(null);
    setInvoices([]);
    setAllocations({});

    // Reset payment amount when client changes
    setValues((prev) => ({
      ...prev,
      amount: "",
    }));

    if (!client) return;

    const result = await getInvoicesForPayment(client.id);

    setClientSummary(result.clientSummary);
    setInvoices(result.invoices);
  }

  // ======================================================
  // ALLOCATION CHANGE
  // ======================================================

  function handleAllocationChange(invoiceId, value) {
    if (value === "") {
      setAllocations((prev) => ({
        ...prev,
        [invoiceId]: "",
      }));

      return;
    }

    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
      return;
    }

    const invoice = invoices.find((item) => item.id === invoiceId);

    if (!invoice) return;

    const outstanding = Number(invoice.due || 0);

    // Do not allow allocation above invoice outstanding
    const safeAmount = Math.min(amount, outstanding);

    setAllocations((prev) => ({
      ...prev,
      [invoiceId]: safeAmount,
    }));
  }

  // ======================================================
  // AUTO ALLOCATE
  // ======================================================

  function handleAutoAllocate() {
    if (paymentAmount <= 0) return;

    let remaining = paymentAmount;

    const nextAllocations = {};

    // invoices already arrive overdue / oldest first
    for (const invoice of invoices) {
      if (remaining <= 0) break;

      const outstanding = Number(invoice.due || 0);

      if (outstanding <= 0) continue;

      const allocation = Math.min(outstanding, remaining);

      nextAllocations[invoice.id] = allocation;

      remaining -= allocation;
    }

    setAllocations(nextAllocations);
  }

  // ======================================================
  // CLEAR ALLOCATIONS
  // ======================================================

  function handleClearAllocations() {
    setAllocations({});
  }

  // ======================================================
  // SUBMIT VALIDATION
  // ======================================================

  const canSubmit =
    selectedClient && paymentAmount > 0 && totalAllocated <= paymentAmount;

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="mx-auto w-full max-w-5xl">
      <form
        action={createPayment}
        className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
      >
        {/* ========================================= */}
        {/* HIDDEN CLIENT */}
        {/* ========================================= */}

        <input type="hidden" name="clientId" value={selectedClient?.id ?? ""} />

        {/* ========================================= */}
        {/* FORM BODY */}
        {/* ========================================= */}

        <div className="space-y-6 p-8">
          {/* ========================================= */}
          {/* CLIENT */}
          {/* ========================================= */}

          <section>
            <div className="max-w-xl">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Client
                <span className="ml-1 text-red-500">*</span>
              </label>

              <ClientCombobox
                clients={clients}
                selectedClient={selectedClient}
                onSelect={handleClientChange}
              />
            </div>

            {clientSummary && (
              <div className="mt-4">
                <ClientSummaryCard summary={clientSummary} />
              </div>
            )}
          </section>

          {/* Divider */}

          <div className="border-t border-zinc-100" />

          {/* ========================================= */}
          {/* PAYMENT DETAILS */}
          {/* ========================================= */}

          <section>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Amount */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Payment Amount
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                    ₹
                  </span>

                  <input
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={values.amount}
                    onChange={handleChange}
                    disabled={!selectedClient}
                    required
                    placeholder="0.00"
                    className="h-10 w-full rounded-lg border border-zinc-300 bg-white pl-8 pr-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-zinc-100"
                  />
                </div>
              </div>

              {/* Payment Date */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Payment Date
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  type="date"
                  name="paymentDate"
                  value={values.paymentDate}
                  onChange={handleChange}
                  disabled={!selectedClient}
                  required
                  className="h-10 w-full rounded-lg
                    border border-zinc-300
                    bg-white px-3
                    text-sm text-zinc-800
                    outline-none transition
                    focus:border-blue-500
                    focus:ring-2 focus:ring-blue-500/10
                    disabled:cursor-not-allowed
                    disabled:bg-zinc-100
                  "
                />
              </div>

              {/* Method */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Payment Method
                </label>

                <select
                  name="method"
                  value={values.method}
                  onChange={handleChange}
                  disabled={!selectedClient}
                  className="h-10 w-full rounded-lg
                    border border-zinc-300
                    bg-white px-3
                    text-sm text-zinc-800
                    outline-none transition
                    focus:border-blue-500
                    focus:ring-2 focus:ring-blue-500/10
                    disabled:cursor-not-allowed
                    disabled:bg-zinc-100
                  "
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              {/* Reference */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Reference
                </label>

                <input
                  type="text"
                  name="reference"
                  value={values.reference}
                  onChange={handleChange}
                  disabled={!selectedClient}
                  placeholder="UTR / cheque / transaction number"
                  className="h-10 w-full rounded-lg
                    border border-zinc-300
                    bg-white px-3
                    text-sm text-zinc-800
                    outline-none transition
                    placeholder:text-zinc-400
                    focus:border-blue-500
                    focus:ring-2 focus:ring-blue-500/10
                    disabled:cursor-not-allowed
                    disabled:bg-zinc-100
                  "
                />
              </div>

              {/* Receipt Number */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700">
                  Receipt Number
                </label>

                <input
                  type="text"
                  name="receiptNumber"
                  value={values.receiptNumber}
                  onChange={handleChange}
                  disabled={!selectedClient}
                  placeholder="Receipt number"
                  className="h-10 w-full rounded-lg
                    border border-zinc-300
                    bg-white px-3
                    text-sm text-zinc-800
                    outline-none transition
                    placeholder:text-zinc-400
                    focus:border-blue-500
                    focus:ring-2 focus:ring-blue-500/10
                    disabled:cursor-not-allowed
                    disabled:bg-zinc-100
                  "
                />
              </div>
            </div>

            {/* Notes */}

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Notes
              </label>

              <textarea
                name="notes"
                rows={3}
                value={values.notes}
                onChange={handleChange}
                disabled={!selectedClient}
                placeholder="Enter payment remarks..."
                className="
                  w-full resize-none rounded-lg
                  border border-zinc-300
                  bg-white px-3 py-2.5
                  text-sm text-zinc-800
                  outline-none transition
                  placeholder:text-zinc-400
                  focus:border-blue-500
                  focus:ring-2 focus:ring-blue-500/10
                  disabled:cursor-not-allowed
                  disabled:bg-zinc-100
                "
              />
            </div>
          </section>

          {/* Divider */}

          <div className="border-t border-zinc-100" />

          {/* ========================================= */}
          {/* ALLOCATION */}
          {/* ========================================= */}

          <section>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-800">
                  Payment Allocation
                </h3>
              </div>

              {invoices.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAllocations}
                    className="
                      h-9 rounded-lg border border-zinc-200
                      bg-white px-3 text-sm font-medium
                      text-zinc-600 transition
                      hover:bg-zinc-50
                    "
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={handleAutoAllocate}
                    disabled={paymentAmount <= 0}
                    className="
                      h-9 rounded-lg
                      bg-blue-50 px-3
                      text-sm font-medium text-blue-700
                      transition hover:bg-blue-100
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    Auto Allocate
                  </button>
                </div>
              )}
            </div>

            {!selectedClient ? (
              <div className="rounded-xl border border-dashed border-zinc-200 px-6 py-10 text-center">
                <p className="text-sm text-zinc-400">
                  Select a client to view outstanding invoices.
                </p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 px-6 py-10 text-center">
                <p className="text-sm font-medium text-zinc-600">
                  No outstanding invoices
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  This client currently has no invoice balance to allocate.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-zinc-200 bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Invoice
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Due Date
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Outstanding
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                          Allocate
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-100">
                      {invoices.map((invoice) => {
                        const allocation = allocations[invoice.id] ?? "";

                        return (
                          <tr key={invoice.id} className="hover:bg-zinc-50/70">
                            {/* Invoice */}

                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-zinc-800">
                                {invoice.invoiceNumber}
                              </p>

                              {invoice.subClientName && (
                                <p className="mt-0.5 text-xs text-zinc-400">
                                  {invoice.subClientName}
                                </p>
                              )}
                            </td>

                            {/* Due Date */}

                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                              {formatDate(invoice.dueDate)}
                            </td>

                            {/* Outstanding */}

                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-zinc-700">
                              {formatCurrency(invoice.due)}
                            </td>

                            {/* Allocate */}

                            <td className="px-4 py-3">
                              <div className="ml-auto w-36">
                                <input
                                  type="number"
                                  min="0"
                                  max={Number(invoice.due || 0)}
                                  step="0.01"
                                  value={allocation}
                                  onChange={(e) =>
                                    handleAllocationChange(
                                      invoice.id,
                                      e.target.value,
                                    )
                                  }
                                  disabled={paymentAmount <= 0}
                                  placeholder="0.00"
                                  className="
                                    h-9 w-full rounded-lg
                                    border border-zinc-300
                                    px-3 text-right text-sm
                                    outline-none transition
                                    focus:border-blue-500
                                    focus:ring-2 focus:ring-blue-500/10
                                    disabled:cursor-not-allowed
                                    disabled:bg-zinc-100
                                  "
                                />

                                {/* Hidden allocation fields */}

                                {Number(allocation || 0) > 0 && (
                                  <>
                                    <input
                                      type="hidden"
                                      name="allocationInvoiceId"
                                      value={invoice.id}
                                    />

                                    <input
                                      type="hidden"
                                      name="allocationAmount"
                                      value={allocation}
                                    />
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* PAYMENT SUMMARY */}
            {/* ========================================= */}

            {selectedClient && paymentAmount > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <SummaryRow label="Payment Amount" value={paymentAmount} />

                  <SummaryRow label="Allocated" value={totalAllocated} />

                  <div className="my-3 border-t border-zinc-200" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-700">
                      Unallocated
                    </span>

                    <span
                      className={`text-sm font-semibold ${
                        unallocatedAmount > 0
                          ? "text-orange-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(unallocatedAmount)}
                    </span>
                  </div>

                  {totalAllocated > paymentAmount && (
                    <p className="mt-3 text-xs font-medium text-red-600">
                      Allocation exceeds the payment amount.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ========================================= */}
        {/* FOOTER */}
        {/* ========================================= */}

        <div className="flex items-center justify-end border-t border-zinc-200 bg-zinc-50/70 px-6 py-4">
          <button
            type="submit"
            disabled={!canSubmit}
            className="
              inline-flex h-10 items-center justify-center
              rounded-lg bg-blue-600 px-5
              text-sm font-medium text-white
              shadow-sm transition
              hover:bg-blue-700
              focus:outline-none
              focus:ring-2 focus:ring-blue-500
              focus:ring-offset-2
              disabled:cursor-not-allowed
              disabled:bg-zinc-300
              disabled:text-zinc-500
              disabled:shadow-none
            "
          >
            Save Payment
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * ======================================================
 * SUMMARY ROW
 * ======================================================
 */

function SummaryRow({ label, value }) {
  return (
    <div className="mb-2 flex items-center justify-between last:mb-0">
      <span className="text-sm text-zinc-500">{label}</span>

      <span className="text-sm font-medium text-zinc-800">
        {formatCurrency(value)}
      </span>
    </div>
  );
}

/**
 * ======================================================
 * FORMAT CURRENCY
 * ======================================================
 */

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * ======================================================
 * FORMAT DATE
 * ======================================================
 */

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
