import { getDashboardData } from "@/app/actions/dashboard/getDashboardData";
import DashboardStats from "@/app/components/dashboard/DashboardStats";
import DashboardPerformance from "@/app/components/dashboard/DashboardPerformance";
import DashboardPeriodFilter from "@/app/components/dashboard/DashboardPeriodFilter";
import CollectionTrendChart from "@/app/components/dashboard/CollectionTrendChart";
import AgingChart from "@/app/components/dashboard/AgingChart";

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
    <div className="space-y-6">
      {/* HEADER */}

      {/* CURRENT SNAPSHOT KPIs */}
      <DashboardStats summary={dashboard.summary} />
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <DashboardPeriodFilter
            period={dashboard.period}
            startDate={dashboard.startDate}
            endDate={dashboard.endDate}
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
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
