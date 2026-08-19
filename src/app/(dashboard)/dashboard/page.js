import { getDashboardData } from "@/app/actions/dashboard/getDashboardData";
import DashboardStats from "@/app/components/dashboard/DashboardStats";
import DashboardPeriodFilter from "@/app/components/dashboard/DashboardPeriodFilter";
import CollectionTrendChart from "@/app/components/dashboard/CollectionTrendChart";
import AgingChart from "@/app/components/dashboard/AgingChart";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const period = params?.period || "YTD";
  const startDate = params?.startDate || "";
  const endDate = params?.endDate || "";

  const dashboard = await getDashboardData({
    period,
    startDate,
    endDate,
  });

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* HEADER & FILTERS BAR */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white sm:text-lg">
            Dashboard
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Receivables & collections overview
          </p>
        </div>

        {/* PERIOD SELECTOR */}
        <div className="flex items-center justify-end">
          <DashboardPeriodFilter
            period={dashboard.period}
            startDate={dashboard.startDate}
            endDate={dashboard.endDate}
          />
        </div>
      </div>

      {/* 5 COMPACT KPI STATS */}
      <DashboardStats summary={dashboard.summary} />

      {/* 2 CHARTS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <AgingChart data={dashboard.agingData} />
        <CollectionTrendChart
          data={dashboard.collectionTrend}
          periodLabel={dashboard.periodLabel}
          granularity={dashboard.trendGranularity}
        />
      </div>
    </div>
  );
}
