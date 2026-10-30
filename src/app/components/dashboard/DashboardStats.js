import {
  FileText,
  Wallet,
  TriangleAlert,
  HandCoins,
  IndianRupee,
  CalendarDays,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatCurrency";
import KPICard from "./KPICard";

export default function DashboardStats({ summary }) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none]">
      <div className="grid grid-cols-8 min-w-[1060px] gap-1.5 sm:gap-2">
        {/* GROSS INVOICED */}
        <KPICard
          title="Gross Invoiced"
          value={formatCurrency(summary.grossInvoiced ?? 0)}
          icon={FileText}
          iconBg="text-zinc-400"
          valueColor="text-zinc-900"
        />

        {/* OUTSTANDING */}
        <KPICard
          title="Total Outstanding"
          value={formatCurrency(summary.outstanding)}
          icon={Wallet}
          iconBg="text-blue-500"
          valueColor={
            summary.outstanding > 0 ? "text-rose-600" : "text-emerald-600"
          }
        />

        {/* 90+ DAYS */}
        <KPICard
          title="90+ Days Due"
          value={formatCurrency(summary.outstanding90Days)}
          icon={TriangleAlert}
          iconBg="text-rose-500"
          valueColor={
            summary.outstanding90Days > 0 ? "text-rose-600" : "text-zinc-900"
          }
        />

        {/* TODAY */}
        <KPICard
          title="Today's Collection"
          value={formatCurrency(summary.todayCollection)}
          icon={IndianRupee}
          iconBg="text-emerald-500"
          valueColor="text-emerald-600"
        />

        {/* MONTH */}
        <KPICard
          title="Month Collection"
          value={formatCurrency(summary.monthCollection)}
          icon={CalendarDays}
          iconBg="text-violet-500"
          valueColor="text-violet-600"
        />

        {/* TOTAL RECONCILED (EXACT MATCH TO TDS MANAGEMENT) */}
        <KPICard
          title="Total Reconciled"
          value={formatCurrency(
            summary.totalReconciled ?? summary.paymentReceived,
          )}
          icon={HandCoins}
          iconBg="text-blue-600"
          cardBg="border-blue-200/80 bg-blue-50/40"
          titleColor="text-blue-800"
          valueColor="text-blue-700"
          tooltip={`Total Reconciled: ${formatCurrency(summary.totalReconciled)} (Payments: ${formatCurrency(summary.paymentReceived)} + Verified TDS: ${formatCurrency(summary.verifiedTds)}) | Total Bank Collection: ${formatCurrency(summary.totalCollection)} (includes ${formatCurrency(summary.unallocatedPayments)} unallocated advance)`}
        />

        {/* VERIFIED TDS */}
        <KPICard
          title="Verified TDS"
          value={formatCurrency(summary.verifiedTds)}
          icon={ShieldCheck}
          iconBg="text-emerald-600"
          cardBg="border-emerald-200/80 bg-emerald-50/40"
          titleColor="text-emerald-800"
          valueColor="text-emerald-700"
        />

        {/* PENDING TDS */}
        <KPICard
          title="Pending TDS"
          value={formatCurrency(summary.pendingTds)}
          icon={Clock}
          iconBg="text-amber-600"
          cardBg="border-amber-200/80 bg-amber-50/40"
          titleColor="text-amber-800"
          valueColor="text-amber-700"
        />
      </div>
    </div>
  );
}
