"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PaymentTable({ payments = [] }) {
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  function handleViewInvoices(payment) {
    setSelectedPayment(payment);
    setSelectedAllocations(payment.allocations || []);
    setInvoiceDialogOpen(true);
  }

  // =====================================
  // EMPTY STATE
  // =====================================

  if (payments.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-zinc-700">No payments found</p>

          <p className="mt-1 text-sm text-zinc-400">
            No client payments have been recorded yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ===================================== */}
      {/* PAYMENT TABLE */}
      {/* ===================================== */}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}

            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Client
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Date
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Receipt
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Payment
                </th>

                {/* <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Allocated
                </th> */}

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Credit
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Invoices
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Method
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Reference
                </th>
              </tr>
            </thead>

            {/* Body */}

            <tbody className="divide-y divide-zinc-100 bg-white">
              {payments.map((payment) => {
                const allocations = payment.allocations || [];

                return (
                  <tr
                    key={payment.id}
                    className="transition hover:bg-zinc-50/70"
                  >
                    {/* Client */}

                    <td className="px-5 py-4">
                      {payment.client?.id ? (
                        <Link
                          href={`/clients/${payment.client.id}`}
                          className="group"
                        >
                          <p className="whitespace-nowrap text-sm font-medium truncate text-zinc-800 transition group-hover:text-blue-600">
                            {payment.client.companyName || "—"}
                          </p>

                          {payment.client.companyCode && (
                            <p className="mt-0.5 text-xs text-zinc-400">
                              {payment.client.companyCode}
                            </p>
                          )}
                        </Link>
                      ) : (
                        <span className="text-sm text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Payment Date */}

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-700">
                      {formatDate(payment.paymentDate)}
                    </td>

                    {/* Receipt */}

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm font-medium text-zinc-800">
                        {payment.receiptNumber || "—"}
                      </span>
                    </td>

                    {/* Payment Amount */}

                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-emerald-600">
                      {formatCurrency(payment.amount)}
                    </td>

                    {/* Allocated */}

                    {/* <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-zinc-700">
                      {formatCurrency(payment.allocatedAmount)}
                    </td> */}

                    {/* Unallocated */}

                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          Number(payment.unallocatedAmount || 0) > 0
                            ? "text-orange-600"
                            : "text-zinc-500"
                        }`}
                      >
                        {formatCurrency(payment.unallocatedAmount)}
                      </span>
                    </td>

                    {/* Related Invoices */}

                    <td className="px-5 py-4">
                      <InvoiceAllocations
                        allocations={allocations}
                        onViewAll={() => handleViewInvoices(payment)}
                      />
                    </td>

                    {/* Method */}

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm capitalize text-zinc-700">
                        {formatMethod(payment.method)}
                      </span>
                    </td>

                    {/* Reference */}

                    <td className="px-5 py-4">
                      <p
                        className="max-w-[180px] truncate text-sm text-zinc-600"
                        title={payment.reference || ""}
                      >
                        {payment.reference || "—"}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================== */}
      {/* PAYMENT ALLOCATION DIALOG */}
      {/* ===================================== */}

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-lg bg-white text-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Payment Allocations</DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            {/* Payment summary */}

            {selectedPayment && (
              <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-zinc-50 p-3">
                <div>
                  <p className="text-xs text-zinc-400">Payment</p>

                  <p className="mt-1 text-sm font-semibold text-zinc-800">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">Allocated</p>

                  <p className="mt-1 text-sm font-semibold text-blue-600">
                    {formatCurrency(selectedPayment.allocatedAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">Unallocated</p>

                  <p
                    className={`mt-1 text-sm font-semibold ${
                      Number(selectedPayment.unallocatedAmount || 0) > 0
                        ? "text-orange-600"
                        : "text-zinc-700"
                    }`}
                  >
                    {formatCurrency(selectedPayment.unallocatedAmount)}
                  </p>
                </div>
              </div>
            )}

            {/* Allocations */}

            {selectedAllocations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 px-5 py-8 text-center">
                <p className="text-sm font-medium text-zinc-600">
                  No invoice allocation
                </p>

                <p className="mt-1 text-sm text-zinc-400">
                  This payment has not been allocated to an invoice yet.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-3 text-sm text-zinc-500">
                  This payment was allocated to {selectedAllocations.length}{" "}
                  {selectedAllocations.length === 1 ? "invoice" : "invoices"}.
                </p>

                <div className="overflow-hidden rounded-xl border border-zinc-200">
                  <div className="divide-y divide-zinc-100">
                    {selectedAllocations.map((allocation) => (
                      <Link
                        key={allocation.id}
                        href={`/invoices/${allocation.invoice?.id}`}
                        className="
                          flex items-center justify-between
                          gap-4 px-4 py-3
                          transition hover:bg-zinc-50
                        "
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-800">
                            {allocation.invoice?.invoiceNumber || "Invoice"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600">
                            {formatCurrency(allocation.allocatedAmount)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * =====================================
 * COMPACT RELATED INVOICES
 * =====================================
 */

function InvoiceAllocations({ allocations = [], onViewAll }) {
  if (allocations.length === 0) {
    return (
      <span className="whitespace-nowrap text-sm text-orange-600">
        Unallocated
      </span>
    );
  }

  const first = allocations[0];
  const remaining = allocations.length - 1;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/invoices/${first.invoice?.id}`}
        className="inline-flex whitespace-nowrap rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
      >
        {first.invoice?.invoiceNumber || "Invoice"}
      </Link>

      {remaining > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="whitespace-nowrap text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          +{remaining} more
        </button>
      )}
    </div>
  );
}

/**
 * =====================================
 * HELPERS
 * =====================================
 */

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMethod(method) {
  if (!method) return "—";

  if (method === "upi") return "UPI";

  return method.replaceAll("_", " ");
}
