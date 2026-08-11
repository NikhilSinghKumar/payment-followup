import { TrendingUp } from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function DashboardPerformance({ summary, periodLabel }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                Performance Collection
              </h2>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {periodLabel}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-50 p-5 dark:bg-zinc-800/50">
        <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {formatCurrency(summary.periodCollection)}
        </p>
      </div>
    </div>
  );
}
