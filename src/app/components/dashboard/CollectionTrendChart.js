"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  const amount = Number(value || 0);
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}k`;
  }
  return `₹${amount}`;
}

function formatDate(date, granularity) {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00Z`);

  if (granularity === "month") {
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
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

  const totalCollected = chartData.reduce(
    (sum, item) => sum + (Number(item.collection) || 0),
    0,
  );

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
      {/* HEADER */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Collection Trend
          </h2>
          {periodLabel && (
            <span className="hidden sm:inline-block text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              ({periodLabel})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 dark:bg-emerald-950/40">
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
            Period Total:
          </span>
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {formatCurrency(totalCollected)}
          </span>
        </div>
      </div>

      {/* CHART */}
      <div className="h-[210px] w-full sm:h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 8,
              right: 12,
              left: -10,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="collectionGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e4e4e7"
              strokeOpacity={0.6}
            />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#71717a" }}
              minTickGap={24}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickFormatter={formatCompactCurrency}
              width={45}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
                padding: "6px 10px",
              }}
              formatter={(value) => [
                formatCurrency(Number(value)),
                "Collection",
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />

            <Area
              type="monotone"
              dataKey="collection"
              stroke="#2563EB"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#collectionGradient)"
              activeDot={{
                r: 4,
                fill: "#2563EB",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
