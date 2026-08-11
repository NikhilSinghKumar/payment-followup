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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {/* OUTSTANDING */}
      <KPICard
        title="Total Outstanding"
        value={formatCurrency(summary.outstanding)}
        icon={Wallet}
        iconBg="bg-blue-100 dark:bg-blue-900/30"
        iconColor="text-blue-600 dark:text-blue-400"
      />

      {/* 90+ DAYS */}
      <KPICard
        title="90+ Days Due"
        value={formatCurrency(summary.outstanding90Days)}
        icon={TriangleAlert}
        iconBg="bg-red-100 dark:bg-red-900/30"
        iconColor="text-red-600 dark:text-red-400"
      />
      {/* TODAY */}
      <KPICard
        title="Today's Collection"
        value={formatCurrency(summary.todayCollection)}
        icon={IndianRupee}
        iconBg="bg-green-100 dark:bg-green-900/30"
        iconColor="text-green-600 dark:text-green-400"
      />

      {/* MONTH */}
      <KPICard
        title="Month Collection"
        value={formatCurrency(summary.monthCollection)}
        icon={CalendarDays}
        iconBg="bg-purple-100 dark:bg-purple-900/30"
        iconColor="text-purple-600 dark:text-purple-400"
      />

      <KPICard
        title="Total Collection"
        value={formatCurrency(summary.totalCollection)}
        icon={HandCoins}
        iconBg="bg-emerald-100 dark:bg-emerald-900/30"
        iconColor="text-emerald-600 dark:text-emerald-400"
      />

      {/* UNALLOCATED */}
      {/* <KPICard
        title="Unallocated Payments"
        value={formatCurrency(summary.unallocatedPayments)}
        icon={HandCoins}
        iconBg="bg-amber-100 dark:bg-amber-900/30"
        iconColor="text-amber-600 dark:text-amber-400"
      /> */}
    </div>
  );
}
