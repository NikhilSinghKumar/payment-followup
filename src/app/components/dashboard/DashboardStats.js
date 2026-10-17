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

import KPICard from "./KPICard";

const formatCurrency = (amount, decimals = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

export default function DashboardStats({ summary }) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none]">
      <div className="grid grid-cols-8 min-w-[960px] gap-1.5 sm:gap-2">
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

        {/* TOTAL COLLECTION */}
        <KPICard
          title="Total Collection"
          value={formatCurrency(summary.totalCollection)}
          icon={HandCoins}
          iconBg="text-indigo-500 dark:text-indigo-400"
          valueColor="text-indigo-600 dark:text-indigo-400"
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
