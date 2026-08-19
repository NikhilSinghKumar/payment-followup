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
  "Not Due": "#38BDF8", // Sky 400
  "1–30 Days": "#60A5FA", // Blue 400
  "31–60 Days": "#3B82F6", // Blue 500
  "61–90 Days": "#2563EB", // Blue 600
  "90+ Days": "#EF4444", // Rose/Red 500 for critical aging
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
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}k`;
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
    <div className="flex flex-col rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 sm:p-4">
      {/* HEADER */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Receivable Aging
          </h2>
        </div>

        <div className="flex items-center gap-1.5 rounded-md bg-zinc-50 px-2 py-0.5 dark:bg-zinc-800">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Outstanding:
          </span>
          <span className="text-xs font-bold text-zinc-900 dark:text-white">
            {formatCurrency(totalOutstanding)}
          </span>
        </div>
      </div>

      {/* CHART */}
      <div className="h-[210px] w-full sm:h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 4,
              right: 18,
              left: 4,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#e4e4e7"
              strokeOpacity={0.6}
            />

            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickFormatter={formatCompactCurrency}
            />

            <YAxis
              type="category"
              dataKey="bucket"
              tickLine={false}
              axisLine={false}
              width={65}
              tick={{ fontSize: 10, fill: "#71717a" }}
            />

            <Tooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
              contentStyle={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
                padding: "6px 10px",
              }}
              formatter={(value) => [formatCurrency(value), "Amount"]}
              labelFormatter={(label) => `Bucket: ${label}`}
            />

            <Bar
              dataKey="amount"
              name="Amount"
              radius={[0, 4, 4, 0]}
              barSize={18}
            >
              {chartData.map((entry) => (
                <Cell key={entry.bucket} fill={AGING_COLORS[entry.bucket]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
