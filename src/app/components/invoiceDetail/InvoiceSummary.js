import SendInvoiceReminderModal from "@/app/components/reminder/SendInvoiceReminderModal";
import Link from "next/link";
import { Edit3, ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import { formatDateDisplay } from "@/lib/date-parser";
import TdsVerifyButton from "./TdsVerifyButton";

export default function InvoiceSummary({ data }) {
  const isOpening =
    Boolean(data.isOpeningBalance) ||
    String(data.invoiceNumber || "")
      .toUpperCase()
      .startsWith("OPENING");
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
    <div className="rounded-xl border border-zinc-200 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* TOP HEADER: NAVIGATION, COMPANY INFO & ACTIONS IN ONE COMPACT BAR */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Back Arrow + Company & Invoice Meta */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/invoices"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 shadow-2xs"
            title="Back to Invoices"
          >
            <ArrowLeft size={13} />
          </Link>

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-xs font-bold text-white shadow-xs">
            {data.companyName?.charAt(0)?.toUpperCase() || "I"}
          </div>

          <div className="min-w-0 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-xs">
              {data.companyName || "Client"}
            </h1>
            {data.companyCode && (
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {data.companyCode}
              </span>
            )}
            <span className="text-zinc-400 dark:text-zinc-500">•</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              #{data.invoiceNumber}
            </span>
            {data.financialYear && (
              <>
                <span className="text-zinc-400 dark:text-zinc-500">•</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  FY {data.financialYear}
                </span>
              </>
            )}
            {data.invoiceDate && (
              <>
                <span className="text-zinc-400 dark:text-zinc-500 hidden sm:inline">
                  •
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                  {formatDateDisplay(data.invoiceDate)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <TdsVerifyButton invoice={data} />
          {due > 0 && <SendInvoiceReminderModal invoiceId={data.id} />}
          <Link
            href={`/invoices/${data.id}/edit`}
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <Edit3 size={11} className="text-zinc-500" />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {/* COMPACT METRICS STRIP: SLEEK, UNCLUTTERED SINGLE ROW */}
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
        {/* 1. Invoice Amount */}
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 px-2.5 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-800/40 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
            Amount
          </div>
          <div
            className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate mt-0.5"
            title={formatMoney(invoiceAmount)}
          >
            {formatMoney(invoiceAmount)}
          </div>
        </div>

        {/* 2. Net Payable */}
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 px-2.5 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-800/40 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
            Net Payable
          </div>
          <div
            className="text-xs sm:text-sm font-bold tracking-tight text-blue-600 dark:text-blue-400 truncate mt-0.5"
            title={formatMoney(netPayable)}
          >
            {formatMoney(netPayable)}
          </div>
        </div>

        {/* 3. Paid */}
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 px-2.5 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-800/40 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
            Paid
          </div>
          <div
            className={`text-xs sm:text-sm font-bold tracking-tight truncate mt-0.5 ${
              paid > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
            title={formatMoney(paid)}
          >
            {formatMoney(paid)}
          </div>
        </div>

        {/* 4. TDS */}
        {!isOpening ? (
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 px-2.5 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-800/40 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
                TDS
              </span>
              <span
                className={`rounded px-1 text-[8px] font-bold shrink-0 ${
                  data.isTdsVerified
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {data.isTdsVerified ? "Verified" : "Pending"}
              </span>
            </div>
            <div
              className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate mt-0.5"
              title={formatMoney(
                data.tdsDeducted ||
                  data.tdsDeductedAmount ||
                  data.tdsAmount ||
                  0,
              )}
            >
              {formatMoney(
                data.tdsDeducted ||
                  data.tdsDeductedAmount ||
                  data.tdsAmount ||
                  0,
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-purple-200/80 bg-purple-50/50 px-2.5 py-1.5 dark:border-purple-900/40 dark:bg-purple-950/20 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 truncate">
              Opening Bal
            </div>
            <div className="mt-0.5 text-xs text-purple-600 dark:text-purple-400 font-bold truncate">
              TDS N/A
            </div>
          </div>
        )}

        {/* 5. Balance Due */}
        <div
          className={`rounded-lg border px-2.5 py-1.5 min-w-0 ${
            due > 0
              ? "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20"
              : "border-zinc-100 bg-zinc-50/70 dark:border-zinc-800/80 dark:bg-zinc-800/40"
          }`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
            Due
          </div>
          <div
            className={`text-xs sm:text-sm font-bold tracking-tight truncate mt-0.5 ${
              due > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
            title={formatMoney(due)}
          >
            {formatMoney(due)}
          </div>
        </div>

        {/* 6. Status */}
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 px-2.5 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-800/40 min-w-0 flex flex-col justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
            Status
          </div>
          <div className="mt-0.5">
            <StatusBadge status={isOverdue ? "overdue" : data.status} />
          </div>
        </div>

        {/* 7. Due Date */}
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/70 px-2.5 py-1.5 dark:border-zinc-800/80 dark:bg-zinc-800/40 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
            Due Date
          </div>
          <div className="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
            {data.dueDate ? formatDateDisplay(data.dueDate) : "-"}
          </div>
        </div>
      </div>

      {/* RECONCILIATION ONE-LINER: COMPACT & INLINE */}
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 rounded-md border border-blue-100/80 bg-blue-50/40 px-2.5 py-1 text-[10px] sm:text-[11px] text-blue-900 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-blue-700 dark:text-blue-300">
            Reconciliation:
          </span>
          <span>
            Paid: <b>{formatMoney(paid)}</b> + TDS:{" "}
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
            of {formatMoney(invoiceAmount)}
          </span>
        </div>

        {Math.abs(
          paid +
            (isOpening
              ? 0
              : Number(
                  data.tdsDeducted ||
                    data.tdsDeductedAmount ||
                    data.tdsAmount ||
                    0,
                )) -
            invoiceAmount,
        ) < 1 ? (
          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            ✓ Fully Settled
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Due: {formatMoney(due)}
          </span>
        )}
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
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.2 text-[10px] font-semibold ${style.bg}`}
    >
      <span className={`h-1 w-1 rounded-full ${style.dot}`} />
      <span>{style.label}</span>
    </span>
  );
}
