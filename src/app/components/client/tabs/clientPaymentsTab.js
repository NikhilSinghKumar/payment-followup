"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AllocatePaymentModal from "@/app/components/payment/AllocatePaymentModal";

export default function ClientPaymentsTab({ clientId, payments = [] }) {
  const router = useRouter();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedAllocations, setSelectedAllocations] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Allocate modal state
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [allocatingPayment, setAllocatingPayment] = useState(null);

  function handleViewInvoices(payment, allocations) {
    setSelectedPayment(payment);
    setSelectedAllocations(allocations || []);
    setInvoiceDialogOpen(true);
  }

  function handleOpenAllocateModal(payment) {
    // Ensure clientId is present on payment object
    const target = {
      ...payment,
      clientId: payment.clientId || clientId,
    };
    setAllocatingPayment(target);
    setAllocateModalOpen(true);
  }

  if (payments.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-zinc-700">No payments found</p>

          <p className="mt-1 text-sm text-zinc-400">
            No payment has been recorded for this client yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[760px]">
            {/* Header */}
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
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
                  Allocated
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Unallocated
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Related Invoices
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Method
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Reference
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Action
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
                    {/* Date */}
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-700">
                      {formatDate(payment.paymentDate)}
                    </td>

                    {/* Receipt */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="text-sm font-medium text-zinc-800">
                        {payment.receiptNumber || "—"}
                      </span>
                      {payment.subClient?.companyName && (
                        <div className="mt-0.5">
                          <span
                            className="inline-block max-w-[150px] truncate rounded bg-purple-50 px-1.5 py-0.2 text-[10px] font-medium text-purple-700"
                            title={`Paid by subclient: ${payment.subClient.companyName}`}
                          >
                            {payment.subClient.companyName}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Payment Amount */}
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-emerald-600">
                      {formatCurrency(payment.amount)}
                    </td>

                    {/* Allocated */}
                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-zinc-700">
                      {formatCurrency(payment.allocatedAmount)}
                    </td>

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
                        onViewAll={() =>
                          handleViewInvoices(payment, allocations)
                        }
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

                    {/* Action */}
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      {Number(payment.unallocatedAmount || 0) > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAllocateModal(payment)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-2xs transition hover:border-blue-300 hover:bg-blue-100"
                          title="Allocate unallocated funds to client invoices"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>Allocate</span>
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-400">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================== */}
      {/* ALLOCATION DIALOG */}
      {/* ===================================== */}

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-lg bg-white text-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Payment Allocations</DialogTitle>
          </DialogHeader>

          <div className="mt-2">
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

            <p className="mb-3 text-sm text-zinc-500">
              This payment was allocated to {selectedAllocations.length}{" "}
              {selectedAllocations.length === 1 ? "invoice" : "invoices"}.
            </p>

            {selectedAllocations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 px-5 py-8 text-center">
                <p className="text-sm font-medium text-zinc-600">
                  No invoice allocation
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  This payment is recorded as an unallocated advance/credit.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <div className="divide-y divide-zinc-100 max-h-[250px] overflow-y-auto">
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

                      <span className="text-sm font-semibold text-blue-600">
                        {formatCurrency(allocation.allocatedAmount)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {selectedPayment &&
              Number(selectedPayment.unallocatedAmount || 0) > 0 && (
                <div className="mt-4 border-t border-zinc-100 pt-3">
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
                      Allocate Remaining{" "}
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
    </>
  );
}

/**
 * Compact invoice display
 */
function InvoiceAllocations({ allocations = [], onViewAll }) {
  if (allocations.length === 0) {
    return <span className="text-sm text-orange-600">Unallocated</span>;
  }

  const first = allocations[0];
  const remaining = allocations.length - 1;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/invoices/${first.invoice?.id}`}
        className="inline-flex rounded-md
          bg-blue-50 px-2 py-1
          text-xs font-medium text-blue-700
          transition hover:bg-blue-100
        "
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
