import SendInvoiceReminderModal from "@/app/components/reminder/SendInvoiceReminderModal";
import Link from "next/link";
import { Edit3, ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import { formatDateDisplay } from "@/lib/date-parser";
import TdsVerifyButton from "./TdsVerifyButton";

export default function InvoiceSummary({ data }) {
  const invoiceAmount = Number(data.invoiceAmount || 0);
  const netPayable = Number(data.netPayableAmount || 0);
  const paid = Number(data.paid || 0);
  const due = Number(data.due || 0);
  const isOverdue = Boolean(data.isOverdue || data.status === "overdue");

  const formatMoney = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* TOP BAR: BREADCRUMB / BACK LINK */}
      <div className="mb-3">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft size={13} />
          <span>Back to Invoices</span>
        </Link>
      </div>

      {/* HEADER SECTION: COMPANY INFO & ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Company Avatar & Info */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-lg font-bold text-white shadow-xs">
            {data.companyName?.charAt(0)?.toUpperCase() || "I"}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {data.companyName || "Client"}
              </h1>
              {data.companyCode && (
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {data.companyCode}
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                Invoice #{data.invoiceNumber}
              </span>
              {data.financialYear && (
                <>
                  <span>•</span>
                  <span>FY {data.financialYear}</span>
                </>
              )}
              {data.invoiceDate && (
                <>
                  <span>•</span>
                  <span>Date: {formatDateDisplay(data.invoiceDate)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <TdsVerifyButton invoice={data} />
          {due > 0 && <SendInvoiceReminderModal invoiceId={data.id} />}
          <Link
            href={`/invoices/${data.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Edit3 size={13} className="text-zinc-500" />
            <span>Edit Invoice</span>
          </Link>
        </div>
      </div>

      {/* STATS METRIC CARDS: FULL WIDTH, CLEANLY SEPARATED */}
      <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800/80">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {/* 1. Invoice Amount */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 sm:p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Invoice Amount
            </div>
            <div className="mt-1.5 text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {formatMoney(invoiceAmount)}
            </div>
          </div>

          {/* 2. Net Payable */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 sm:p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Net Payable
            </div>
            <div className="mt-1.5 text-base sm:text-lg font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {formatMoney(netPayable)}
            </div>
          </div>

          {/* 3. Paid */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 sm:p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Paid Amount
            </div>
            <div
              className={`mt-1.5 text-base sm:text-lg font-bold tracking-tight ${
                paid > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {formatMoney(paid)}
            </div>
          </div>

          {/* 4. TDS Deducted */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 sm:p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                TDS Deducted
              </span>
              <span
                className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                  data.isTdsVerified
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {data.isTdsVerified ? "Verified" : "Pending"}
              </span>
            </div>
            <div className="mt-1.5 text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {formatMoney(
                data.tdsDeducted ||
                  data.tdsDeductedAmount ||
                  data.tdsAmount ||
                  0,
              )}
            </div>
          </div>

          {/* 5. Balance Due */}
          <div
            className={`rounded-xl border p-3 sm:p-3.5 ${
              due > 0
                ? "border-rose-200/80 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20"
                : "border-zinc-200/80 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40"
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Balance Due
            </div>
            <div
              className={`mt-1.5 text-base sm:text-lg font-bold tracking-tight ${
                due > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {formatMoney(due)}
            </div>
          </div>

          {/* 6. Status */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 sm:p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40 flex flex-col justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Status
            </div>
            <div className="mt-1.5 flex items-center">
              <StatusBadge status={isOverdue ? "overdue" : data.status} />
            </div>
          </div>

          {/* 7. Due Date */}
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 sm:p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Due Date
            </div>
            <div className="mt-1.5 text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {data.dueDate ? formatDateDisplay(data.dueDate) : "-"}
            </div>
            {data.dueDate && due > 0 && data.dueDaysText && (
              <div
                className={`mt-0.5 text-[11px] font-medium ${
                  isOverdue
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {data.dueDaysText}
              </div>
            )}
          </div>
        </div>

        {/* Reconciliation Equation Bar */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-2 text-xs text-blue-900 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Accounting Reconciliation:</span>
            <span>
              Actual Payment Received: <b>{formatMoney(paid)}</b> + TDS (
              {data.isTdsVerified ? "Verified" : "Pending"}):{" "}
              <b>
                {formatMoney(
                  data.tdsDeducted ||
                    data.tdsDeductedAmount ||
                    data.tdsAmount ||
                    0,
                )}
              </b>{" "}
              ={" "}
              <b>
                {formatMoney(
                  paid +
                    Number(
                      data.tdsDeducted ||
                        data.tdsDeductedAmount ||
                        data.tdsAmount ||
                        0,
                    ),
                )}
              </b>{" "}
              of Total Invoice {formatMoney(invoiceAmount)}
            </span>
          </div>

          {Math.abs(
            paid +
              Number(
                data.tdsDeducted ||
                  data.tdsDeductedAmount ||
                  data.tdsAmount ||
                  0,
              ) -
              invoiceAmount,
          ) < 1 ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ Actual Payment + TDS Totals to Invoice Amount
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Outstanding Balance: {formatMoney(due)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normStatus = (status || "pending").toLowerCase();

  const config = {
    paid: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
      dot: "bg-emerald-500",
      label: "Paid",
    },
    partial: {
      bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
      dot: "bg-amber-500",
      label: "Partial",
    },
    overdue: {
      bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800",
      dot: "bg-rose-500",
      label: "Overdue",
    },
    disputed: {
      bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800",
      dot: "bg-purple-500",
      label: "Disputed",
    },
    cancelled: {
      bg: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
      dot: "bg-zinc-500",
      label: "Cancelled",
    },
    pending: {
      bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
      dot: "bg-blue-500",
      label: "Pending",
    },
  };

  const style = config[normStatus] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span>{style.label}</span>
    </span>
  );
}
