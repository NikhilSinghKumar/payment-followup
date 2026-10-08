"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Layers, Pencil } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BulkPaymentNotificationModal from "./BulkPaymentNotificationModal";
import AllocatePaymentModal from "./AllocatePaymentModal";
import EditPaymentModal from "./EditPaymentModal";
import { formatDateDisplay } from "@/lib/date-parser";

export default function PaymentTable({ payments = [], hasFilter = false }) {
  const router = useRouter();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Single payment notify state
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [targetPaymentId, setTargetPaymentId] = useState(null);

  // Allocation modal state
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [allocatingPayment, setAllocatingPayment] = useState(null);

  // Edit payment modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  function handleOpenEditModal(payment) {
    setEditingPayment(payment);
    setEditModalOpen(true);
  }

  function handleViewInvoices(payment) {
    setSelectedPayment(payment);
    setSelectedAllocations(payment.allocations || []);
    setInvoiceDialogOpen(true);
  }

  function handleNotifyPayment(paymentId) {
    setTargetPaymentId(paymentId);
    setNotifyModalOpen(true);
  }

  function handleOpenAllocateModal(payment) {
    setAllocatingPayment(payment);
    setAllocateModalOpen(true);
  }

  // =====================================
  // EMPTY STATE
  // =====================================

  if (payments.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[850px]">
            {/* Header */}

            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Client
                </th>

                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Date
                </th>

                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Payment
                </th>

                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Advance / Credit
                </th>

                <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Invoices
                </th>

                <th className="px-4 py-2.5 text-right text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Body */}

            <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800/60 dark:bg-zinc-900">
              {payments.map((payment) => {
                const allocations = payment.allocations || [];

                return (
                  <tr
                    key={payment.id}
                    className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                  >
                    {/* Client */}

                    <td className="px-4 py-1.5 text-xs">
                      {payment.client?.id ? (
                        <Link
                          href={`/clients/${payment.client.id}`}
                          className="group inline-flex items-center gap-1.5 max-w-[220px] truncate"
                          title={payment.client.companyName || ""}
                        >
                          <span className="font-medium text-zinc-800 truncate transition group-hover:text-blue-600 dark:text-zinc-200 dark:group-hover:text-blue-400">
                            {payment.client.companyName || "—"}
                          </span>

                          {payment.client.companyCode && (
                            <span className="text-[10px] text-zinc-400 shrink-0">
                              ({payment.client.companyCode})
                            </span>
                          )}

                          {payment.subClient?.companyName && (
                            <span
                              className="rounded bg-purple-50 px-1 py-0.2 text-[9px] font-medium text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 shrink-0"
                              title={`Paid by subclient: ${payment.subClient.companyName}`}
                            >
                              {payment.subClient.companyName}
                            </span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Payment Date */}

                    <td className="whitespace-nowrap px-4 py-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                      {formatDate(payment.paymentDate)}
                    </td>

                    {/* Payment Amount */}

                    <td className="whitespace-nowrap px-4 py-1.5 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(payment.amount)}
                    </td>

                    {/* On Account / Credit */}

                    <td className="whitespace-nowrap px-4 py-1.5 text-right text-xs">
                      {(() => {
                        const unallocatedNum = Number(
                          payment.unallocatedAmount || 0,
                        );
                        const isCredit =
                          Boolean(payment.isOpeningBalance) ||
                          (typeof payment.notes === "string" &&
                            /credit|advance|surplus/i.test(payment.notes));

                        if (unallocatedNum > 0.001) {
                          return (
                            <span
                              className={`font-semibold ${
                                isCredit
                                  ? "text-violet-600 dark:text-violet-400"
                                  : "text-orange-600 dark:text-orange-400"
                              }`}
                              title={
                                isCredit
                                  ? `₹${unallocatedNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })} credit / advance surplus (payment exceeded outstanding)`
                                  : `₹${unallocatedNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })} on account`
                              }
                            >
                              {formatCurrency(unallocatedNum)}
                            </span>
                          );
                        }

                        return (
                          <span className="font-medium text-zinc-400 dark:text-zinc-500">
                            {formatCurrency(0)}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Related Invoices */}

                    <td className="px-4 py-1.5 text-xs">
                      <InvoiceAllocations
                        allocations={allocations}
                        onViewAll={() => handleViewInvoices(payment)}
                      />
                    </td>

                    {/* Action */}
                    <td className="whitespace-nowrap px-4 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(payment)}
                          className="h-7 px-2.5 inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white text-[11px] font-medium text-zinc-700 shadow-2xs transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
                          title="Edit payment details"
                        >
                          <Pencil className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          <span>Edit</span>
                        </button>
                        {Number(payment.unallocatedAmount || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenAllocateModal(payment)}
                            className="h-7 px-2.5 inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 text-[11px] font-semibold text-blue-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900"
                            title="Allocate on-account funds to client invoices"
                          >
                            <Layers className="h-3 w-3" />
                            <span>Allocate</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleNotifyPayment(payment.id)}
                          className="h-7 px-2.5 inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white text-[11px] font-medium text-zinc-700 shadow-2xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750"
                          title="Send payment receipt email to client"
                        >
                          <Mail className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Send Email</span>
                        </button>
                      </div>
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
                  <p className="text-xs text-zinc-400">On Account</p>

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
              <div className="rounded-xl border border-dashed border-zinc-200 px-2 py-8 text-center dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  No invoice allocation
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  This payment is recorded on account (pending invoice
                  allocation).
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

            {selectedPayment &&
              Number(selectedPayment.unallocatedAmount || 0) > 0 && (
                <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setInvoiceDialogOpen(false);
                      handleOpenAllocateModal(selectedPayment);
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-98"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>
                      Allocate On Account{" "}
                      {formatCurrency(selectedPayment.unallocatedAmount)}
                    </span>
                  </button>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===================================== */}
      {/* ALLOCATE PAYMENT MODAL */}
      {/* ===================================== */}
      <AllocatePaymentModal
        isOpen={allocateModalOpen}
        onClose={() => {
          setAllocateModalOpen(false);
          setAllocatingPayment(null);
        }}
        payment={allocatingPayment}
        onSuccess={() => {
          router.refresh();
        }}
      />

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

      {/* ===================================== */}
      {/* EDIT PAYMENT MODAL */}
      {/* ===================================== */}
      <EditPaymentModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingPayment(null);
        }}
        payment={editingPayment}
        onSuccess={() => {
          router.refresh();
        }}
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
      <span className="whitespace-nowrap text-xs text-orange-500/80 dark:text-orange-400">
        N/A
      </span>
    );
  }

  const first = allocations[0];
  const remaining = allocations.length - 1;

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href={`/invoices/${first.invoice?.id}`}
        className="inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition dark:bg-blue-950/50 dark:text-blue-300"
      >
        {first.invoice?.invoiceNumber || "Invoice"}
      </Link>

      {remaining > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          className="whitespace-nowrap text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
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
  return formatDateDisplay(date);
}

function formatMethod(method) {
  if (!method) return "—";

  if (method === "upi") return "UPI";

  return method.replaceAll("_", " ");
}
