"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value) {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)} Cr`;
  }

  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)} L`;
  }

  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}K`;
  }

  return `₹${value}`;
}

function formatDate(date, granularity) {
  const parsed = new Date(`${date}T00:00:00Z`);

  if (granularity === "month") {
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(parsed);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(parsed);
}

export default function CollectionTrendChart({
  data = [],
  periodLabel,
  granularity,
}) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatDate(item.date, granularity),
  }));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Collection Performance
          </h2>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Collection trend for {periodLabel}
          </p>
        </div>

        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {granularity === "month" ? "Monthly" : "Daily"}
        </div>
      </div>

      {/* CHART */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 12,
              }}
              minTickGap={30}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 12,
              }}
              tickFormatter={formatCompactCurrency}
              width={75}
            />

            <Tooltip
              formatter={(value) => [
                formatCurrency(Number(value)),
                "Collection",
              ]}
              labelFormatter={(label) => label}
            />

            <Line
              type="monotone"
              dataKey="collection"
              strokeWidth={2.5}
              dot={{
                r: 3,
              }}
              activeDot={{
                r: 5,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
