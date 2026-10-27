import {
  FileText,
  Wallet,
  TriangleAlert,
  HandCoins,
  IndianRupee,
  CalendarDays,
  ShieldCheck,
  Clock,
  BadgePercent,
  Link2,
  WalletCards,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import KPICard from "./KPICard";

export default function DashboardStats({ summary }) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none]">
      <div className="grid grid-cols-11 min-w-[1480px] gap-1.5 sm:gap-2">
        {/* GROSS INVOICED */}
        <KPICard
          title="Gross Invoiced"
          value={formatCurrency(summary.grossInvoiced ?? 0)}
          icon={FileText}
          iconBg="text-zinc-400 dark:text-zinc-500"
          valueColor="text-zinc-900 dark:text-zinc-100"
        />

        {/* OUTSTANDING */}
        <KPICard
          title="Total Outstanding"
          value={formatCurrency(summary.outstanding)}
          icon={Wallet}
          iconBg="text-blue-500 dark:text-blue-400"
          valueColor={
            summary.outstanding > 0
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          }
        />

        {/* NET RECEIVABLE AFTER VALID CREDIT NOTES */}
        <KPICard
          title="Net Receivable"
          value={formatCurrency(summary.netReceivable ?? summary.outstanding ?? 0)}
          icon={WalletCards}
          iconBg="text-violet-600 dark:text-violet-400"
          cardBg="border-violet-200/80 bg-violet-50/40 dark:border-violet-950 dark:bg-violet-950/20"
          titleColor="text-violet-800 dark:text-violet-300"
          valueColor={(summary.netReceivable ?? summary.outstanding ?? 0) > 0
            ? "text-violet-700 dark:text-violet-300"
            : "text-emerald-600 dark:text-emerald-400"}
          tooltip={`Current Outstanding: ${formatCurrency(summary.outstanding)} - Issued Credit Notes: ${formatCurrency(summary.totalCreditNotes)} = Net Receivable: ${formatCurrency(summary.netReceivable)}`}
        />

        {/* INVOICE-LINKED CREDIT NOTES */}
        <KPICard
          title="Invoice-Linked Credits"
          value={formatCurrency(summary.invoiceLinkedCredits ?? 0)}
          icon={Link2}
          iconBg="text-cyan-600 dark:text-cyan-400"
          valueColor="text-cyan-700 dark:text-cyan-300"
          tooltip="Issued credit-note amounts allocated to invoices. These are included in total credit notes and are not cash collection."
        />

        {/* UNALLOCATED CLIENT CREDITS */}
        <KPICard
          title="Unallocated Credits"
          value={formatCurrency(summary.unallocatedClientCredits ?? 0)}
          icon={BadgePercent}
          iconBg="text-amber-600 dark:text-amber-400"
          valueColor="text-amber-700 dark:text-amber-300"
          tooltip="Remaining balance of issued credit notes not allocated to invoices, including partially unapplied notes."
        />

        {/* 90+ DAYS */}
        <KPICard
          title="90+ Days Due"
          value={formatCurrency(summary.outstanding90Days)}
          icon={TriangleAlert}
          iconBg="text-rose-500 dark:text-rose-400"
          valueColor={
            summary.outstanding90Days > 0
              ? "text-rose-600 dark:text-rose-400"
              : "text-zinc-900 dark:text-zinc-100"
          }
        />

        {/* TODAY */}
        <KPICard
          title="Today's Collection"
          value={formatCurrency(summary.todayCollection)}
          icon={IndianRupee}
          iconBg="text-emerald-500 dark:text-emerald-400"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />

        {/* MONTH */}
        <KPICard
          title="Month Collection"
          value={formatCurrency(summary.monthCollection)}
          icon={CalendarDays}
          iconBg="text-violet-500 dark:text-violet-400"
          valueColor="text-violet-600 dark:text-violet-400"
        />

        {/* TOTAL RECONCILED (EXACT MATCH TO TDS MANAGEMENT) */}
        <KPICard
          title="Total Reconciled"
          value={formatCurrency(
            summary.totalReconciled ?? summary.paymentReceived,
          )}
          icon={HandCoins}
          iconBg="text-blue-600 dark:text-blue-400"
          cardBg="border-blue-200/80 bg-blue-50/40 dark:border-blue-950 dark:bg-blue-950/20"
          titleColor="text-blue-800 dark:text-blue-300"
          valueColor="text-blue-700 dark:text-blue-300"
          tooltip={`Total Reconciled: ${formatCurrency(summary.totalReconciled)} (Payments: ${formatCurrency(summary.paymentReceived)} + Verified TDS: ${formatCurrency(summary.verifiedTds)}) | Total Bank Collection: ${formatCurrency(summary.totalCollection)} (includes ${formatCurrency(summary.unallocatedPayments)} unallocated advance)`}
        />

        {/* VERIFIED TDS */}
        <KPICard
          title="Verified TDS"
          value={formatCurrency(summary.verifiedTds)}
          icon={ShieldCheck}
          iconBg="text-emerald-600 dark:text-emerald-400"
          cardBg="border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-950 dark:bg-emerald-950/20"
          titleColor="text-emerald-800 dark:text-emerald-300"
          valueColor="text-emerald-700 dark:text-emerald-300"
        />

        {/* PENDING TDS */}
        <KPICard
          title="Pending TDS"
          value={formatCurrency(summary.pendingTds)}
          icon={Clock}
          iconBg="text-amber-600 dark:text-amber-400"
          cardBg="border-amber-200/80 bg-amber-50/40 dark:border-amber-950 dark:bg-amber-950/20"
          titleColor="text-amber-800 dark:text-amber-300"
          valueColor="text-amber-700 dark:text-amber-300"
        />
      </div>
    </div>
  );
}
