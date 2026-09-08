"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { editPayment, getClientSubClients } from "@/app/actions/payment";
import {
  Pencil,
  AlertCircle,
  Calendar,
  Building2,
  Receipt,
  CreditCard,
  FileText,
  Layers,
  CheckCircle2,
  Hash,
} from "lucide-react";

export default function EditPaymentModal({
  isOpen,
  onClose,
  payment,
  onSuccess,
}) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");
  const [subClients, setSubClients] = useState([]);
  const [loadingSubClients, setLoadingSubClients] = useState(false);

  // Form states
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [method, setMethod] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [reference, setReference] = useState("");
  const [subClientId, setSubClientId] = useState("");
  const [notes, setNotes] = useState("");

  const clientId = payment?.client?.id || payment?.clientId;
  const allocations = payment?.allocations || [];
  const totalAllocated = allocations.reduce(
    (sum, a) => sum + Number(a.allocatedAmount || 0),
    0,
  );

  // Reset / initialize state whenever modal opens or payment changes
  useEffect(() => {
    if (!isOpen || !payment) return;

    setErrorMessage("");
    setAmount(payment.amount ? String(payment.amount) : "");

    // Format payment date to YYYY-MM-DD
    if (payment.paymentDate) {
      try {
        const d = new Date(payment.paymentDate);
        setPaymentDate(d.toISOString().split("T")[0]);
      } catch {
        setPaymentDate("");
      }
    } else {
      setPaymentDate(new Date().toISOString().split("T")[0]);
    }

    setMethod(payment.method || "bank");
    setReceiptNumber(payment.receiptNumber || "");
    setReference(payment.reference || "");
    setSubClientId(
      payment.subClientId || payment.subClient?.id
        ? String(payment.subClientId || payment.subClient?.id)
        : "",
    );
    setNotes(payment.notes || "");

    // Fetch subclients for client
    if (clientId) {
      setLoadingSubClients(true);
      getClientSubClients(clientId)
        .then((data) => {
          setSubClients(data || []);
        })
        .catch(() => {
          setSubClients([]);
        })
        .finally(() => {
          setLoadingSubClients(false);
        });
    } else {
      setSubClients([]);
    }
  }, [isOpen, payment, clientId]);

  const numericAmount = Number(amount || 0);
  const unallocatedAmount = Math.max(numericAmount - totalAllocated, 0);
  const isAmountTooLow =
    numericAmount > 0 && numericAmount < totalAllocated - 0.01;

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (isAmountTooLow) {
      setErrorMessage(
        `Payment amount cannot be less than the already allocated amount of ${formatCurrency(
          totalAllocated,
        )} across invoices.`,
      );
      return;
    }

    if (!paymentDate) {
      setErrorMessage("Please select a payment date.");
      return;
    }

    startTransition(async () => {
      const payload = {
        amount: numericAmount,
        paymentDate,
        method: method || null,
        receiptNumber: receiptNumber.trim() || null,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        subClientId: subClientId ? Number(subClientId) : null,
      };

      const result = await editPayment(payment.id, payload);

      if (result?.error) {
        setErrorMessage(result.error);
      } else if (result?.success) {
        if (onSuccess) {
          onSuccess(result);
        }
        onClose();
      }
    });
  }

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-white p-6 text-zinc-900 shadow-2xl [scrollbar-width:thin] dark:bg-zinc-900 dark:text-zinc-100">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Edit Payment
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                {payment.client?.companyName ? (
                  <span>
                    Client:{" "}
                    <strong className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {payment.client.companyName}
                    </strong>
                    {payment.receiptNumber &&
                      ` • Receipt: ${payment.receiptNumber}`}
                  </span>
                ) : (
                  "Update payment details, reference, method, and amount."
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Allocations & Credit Info Banner */}
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/60">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-400">
              Allocated
            </p>
            <p className="mt-0.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalAllocated)}
            </p>
            <p className="text-[10px] text-zinc-400">
              {allocations.length}{" "}
              {allocations.length === 1 ? "invoice" : "invoices"}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-400">
              New Credit / Balance
            </p>
            <p
              className={`mt-0.5 text-sm font-semibold ${
                unallocatedAmount > 0
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {formatCurrency(unallocatedAmount)}
            </p>
            <p className="text-[10px] text-zinc-400">Unallocated funds</p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-400">
              Original Total
            </p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {formatCurrency(payment.amount)}
            </p>
            <p className="text-[10px] text-zinc-400">Recorded amount</p>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Amount */}
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Payment Amount (₹) *</span>
                {totalAllocated > 0 && (
                  <span className="text-[10px] font-normal text-zinc-400">
                    Min: {formatCurrency(totalAllocated)}
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-zinc-400">
                  ₹
                </div>
                <input
                  type="number"
                  step="0.01"
                  min={totalAllocated > 0 ? totalAllocated : "0.01"}
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full rounded-xl border pl-8 pr-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 dark:text-zinc-100 ${
                    isAmountTooLow
                      ? "border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 dark:border-red-800 dark:bg-red-950/20"
                      : "border-zinc-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-800"
                  }`}
                />
              </div>
              {isAmountTooLow && (
                <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                  Cannot be less than {formatCurrency(totalAllocated)} (already
                  allocated).
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                <span>Payment Date *</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Method */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                <span>Payment Method</span>
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="bank">Bank Transfer / NEFT / RTGS</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="adjustment">Adjustment / Credit Note</option>
                <option value="">Unspecified</option>
              </select>
            </div>

            {/* Receipt Number */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Receipt className="h-3.5 w-3.5 text-zinc-400" />
                <span>Receipt Number</span>
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g. RCPT/2026-27/0042"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Hash className="h-3.5 w-3.5 text-zinc-400" />
                <span>Transaction Ref / UTR / Cheque No</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UTR89347294827 or CHQ-00129"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* Sub-Client */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                <span>Sub-Client (Branch / Division)</span>
              </label>
              <select
                value={subClientId}
                disabled={loadingSubClients}
                onChange={(e) => setSubClientId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:disabled:bg-zinc-850"
              >
                <option value="">None (Main Client)</option>
                {subClients.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.companyName}{" "}
                    {sub.companyCode ? `(${sub.companyCode})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <FileText className="h-3.5 w-3.5 text-zinc-400" />
              <span>Notes / Remarks</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal remarks or settlement details..."
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Connected Allocations List (if any) */}
          {allocations.length > 0 && (
            <div className="rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  <Layers className="h-3.5 w-3.5 text-blue-600" />
                  Allocated Invoices ({allocations.length})
                </span>
                <span className="text-[11px] text-zinc-400">
                  Total: {formatCurrency(totalAllocated)}
                </span>
              </div>

              <div className="mt-2.5 max-h-[140px] space-y-1.5 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {allocations.map((alloc) => (
                  <div
                    key={alloc.id}
                    className="flex items-center justify-between pt-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {alloc.invoice?.invoiceNumber || "Invoice"}
                      </span>
                    </div>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(alloc.allocatedAmount)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-zinc-400">
                Tip: To allocate remaining funds to invoices or adjust invoice
                splits, use the &quot;Allocate&quot; button in the table.
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending || isAmountTooLow}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatCurrency(val) {
  return Number(val || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
