import {
  Wallet,
  TriangleAlert,
  HandCoins,
  IndianRupee,
  CalendarDays,
} from "lucide-react";

import KPICard from "./KPICard";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function DashboardStats({ summary }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
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
    </div>
  );
}
