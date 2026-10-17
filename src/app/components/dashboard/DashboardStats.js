import {
  Wallet,
  TriangleAlert,
  HandCoins,
  IndianRupee,
  CalendarDays,
  CheckCircle2,
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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-7">
      {/* OUTSTANDING */}
      <KPICard
        title="Total Outstanding"
        value={formatCurrency(summary.outstanding)}
        icon={Wallet}
        iconBg="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
      />

      {/* 90+ DAYS */}
      <KPICard
        title="90+ Days Due"
        value={formatCurrency(summary.outstanding90Days)}
        icon={TriangleAlert}
        iconBg="bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
      />

      {/* TODAY */}
      <KPICard
        title="Today's Collection"
        value={formatCurrency(summary.todayCollection)}
        icon={IndianRupee}
        iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
      />

      {/* MONTH */}
      <KPICard
        title="Month Collection"
        value={formatCurrency(summary.monthCollection)}
        icon={CalendarDays}
        iconBg="bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
      />

      {/* TOTAL COLLECTION */}
      <KPICard
        title="Total Collection"
        value={formatCurrency(summary.totalCollection)}
        icon={HandCoins}
        iconBg="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
      />

      {/* VERIFIED TDS */}
      <KPICard
        title="Verified TDS"
        value={formatCurrency(summary.verifiedTds)}
        icon={CheckCircle2}
        iconBg="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
      />

      {/* PENDING TDS */}
      <KPICard
        title="Pending TDS"
        value={formatCurrency(summary.pendingTds)}
        icon={Clock}
        iconBg="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
      />
    </div>
  );
}
