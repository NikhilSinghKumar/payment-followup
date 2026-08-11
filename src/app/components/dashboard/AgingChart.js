"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const AGING_COLORS = {
  "Not Due": "#93C5FD",
  "1–30 Days": "#60A5FA",
  "31–60 Days": "#3B82F6",
  "61–90 Days": "#2563EB",
  "90+ Days": "#1D4ED8",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatCompactCurrency = (value) => {
  const amount = Number(value || 0);

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)} Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }

  return `₹${amount}`;
};

const AGING_ORDER = [
  "Not Due",
  "1–30 Days",
  "31–60 Days",
  "61–90 Days",
  "90+ Days",
];

export default function AgingChart({ data = [] }) {
  const chartData = AGING_ORDER.map((bucket) => {
    const existing = data.find((item) => item.bucket === bucket);

    return {
      bucket,
      amount: Number(existing?.amount || 0),
    };
  });

  const totalOutstanding = chartData.reduce(
    (total, item) => total + item.amount,
    0,
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* HEADER */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
            Receivable Aging
          </h2>

          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Outstanding amount by overdue age
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total Outstanding
          </p>

          <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
            {formatCurrency(totalOutstanding)}
          </p>
        </div>
      </div>

      {/* CHART */}
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />

            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{
                fontSize: 11,
              }}
              tickFormatter={formatCompactCurrency}
            />

            <YAxis
              type="category"
              dataKey="bucket"
              tickLine={false}
              axisLine={false}
              width={85}
              tick={{
                fontSize: 12,
              }}
            />

            <Tooltip
              cursor={{
                fill: "rgba(0, 0, 0, 0.04)",
              }}
              formatter={(value) => [formatCurrency(value), "Outstanding"]}
              labelFormatter={(label) => `${label}`}
            />

            <Bar
              dataKey="amount"
              name="Outstanding"
              radius={[0, 6, 6, 0]}
              barSize={28}
            >
              {chartData.map((entry) => (
                <Cell key={entry.bucket} fill={AGING_COLORS[entry.bucket]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SUMMARY */}
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800 sm:grid-cols-5">
        {chartData.map((item) => (
          <div key={item.bucket}>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {item.bucket}
            </p>

            <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {formatCompactCurrency(item.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
