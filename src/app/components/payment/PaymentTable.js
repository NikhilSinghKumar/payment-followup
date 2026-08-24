"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BulkPaymentNotificationModal from "./BulkPaymentNotificationModal";

export default function PaymentTable({ payments = [], hasFilter = false }) {
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Single payment notify state
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [targetPaymentId, setTargetPaymentId] = useState(null);

  function handleViewInvoices(payment) {
    setSelectedPayment(payment);
    setSelectedAllocations(payment.allocations || []);
    setInvoiceDialogOpen(true);
  }

  function handleNotifyPayment(paymentId) {
    setTargetPaymentId(paymentId);
    setNotifyModalOpen(true);
  }

  // =====================================
  // EMPTY STATE
  // =====================================

  if (payments.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {hasFilter ? "No matching payments found" : "No payments found"}
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            {hasFilter
              ? "Try adjusting or resetting your search keywords or date filter."
              : "No client payments have been recorded yet."}
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

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[850px]">
            {/* Header */}

            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
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

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Body */}

            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
              {payments.map((payment) => {
                const allocations = payment.allocations || [];

                return (
                  <tr
                    key={payment.id}
                    className="transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50"
                  >
                    {/* Client */}

                    <td className="px-5 py-4">
                      {payment.client?.id ? (
                        <Link
                          href={`/clients/${payment.client.id}`}
                          className="group"
                        >
                          <p className="whitespace-nowrap text-sm font-medium truncate text-zinc-800 transition group-hover:text-blue-600 dark:text-zinc-200 dark:group-hover:text-blue-400">
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

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {formatDate(payment.paymentDate)}
                    </td>

                    {/* Receipt */}

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {payment.receiptNumber || "—"}
                      </span>
                    </td>

                    {/* Payment Amount */}

                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(payment.amount)}
                    </td>

                    {/* Unallocated */}

                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <span
                        className={`text-sm font-medium ${
                          Number(payment.unallocatedAmount || 0) > 0
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-zinc-500 dark:text-zinc-400"
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
                      <span className="text-sm capitalize text-zinc-700 dark:text-zinc-300">
                        {formatMethod(payment.method)}
                      </span>
                    </td>

                    {/* Reference */}

                    <td className="px-5 py-4">
                      <p
                        className="max-w-[180px] truncate text-sm text-zinc-600 dark:text-zinc-400"
                        title={payment.reference || ""}
                      >
                        {payment.reference || "—"}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleNotifyPayment(payment.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-2xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
                        title="Send payment receipt email to client"
                      >
                        <Mail className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Send Email</span>
                      </button>
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
        <DialogContent className="max-w-lg bg-white text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>Payment Allocations</DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            {/* Payment summary */}

            {selectedPayment && (
              <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                <div>
                  <p className="text-xs text-zinc-400">Payment</p>

                  <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">Allocated</p>

                  <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(selectedPayment.allocatedAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-400">Unallocated</p>

                  <p
                    className={`mt-1 text-sm font-semibold ${
                      Number(selectedPayment.unallocatedAmount || 0) > 0
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {formatCurrency(selectedPayment.unallocatedAmount)}
                  </p>
                </div>
              </div>
            )}

            {/* Allocations */}

            {selectedAllocations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 px-5 py-8 text-center dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  No invoice allocation
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  This payment is recorded as an unallocated advance/credit.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto [scrollbar-width:thin]">
                {selectedAllocations.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-800/40"
                  >
                    <div>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        #{a.invoice?.invoiceNumber || a.invoiceId}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(a.allocatedAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================== */}
      {/* SINGLE PAYMENT NOTIFICATION MODAL */}
      {/* ===================================== */}
      <BulkPaymentNotificationModal
        isOpen={notifyModalOpen}
        onClose={() => {
          setNotifyModalOpen(false);
          setTargetPaymentId(null);
        }}
        initialPaymentIds={targetPaymentId ? [targetPaymentId] : []}
      />
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
      <span className="whitespace-nowrap text-sm text-orange-600 dark:text-orange-400">
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
        className="inline-flex whitespace-nowrap rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300"
      >
        {first.invoice?.invoiceNumber || "Invoice"}
      </Link>

      {remaining > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="whitespace-nowrap text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
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
