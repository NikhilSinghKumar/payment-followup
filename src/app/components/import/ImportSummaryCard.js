"use client";

import { FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";

export default function ImportSummaryCard({ summary }) {
  const cards = [
    {
      title: "Total Rows",
      value: summary.total,
      icon: FileSpreadsheet,
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      textColor: "text-blue-700",
    },
    {
      title: "Imported",
      value: summary.inserted,
      icon: CheckCircle2,
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-700",
    },
    {
      title: "Failed",
      value: summary.skipped,
      icon: XCircle,
      bg: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      textColor: "text-red-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className={`${card.bg} border rounded-xl p-5 flex items-center justify-between shadow-sm`}
          >
            <div>
              <p className="text-sm text-zinc-500">{card.title}</p>

              <p className={`mt-1 text-3xl font-bold ${card.textColor}`}>
                {card.value}
              </p>
            </div>

            <div className={`${card.iconBg} rounded-full p-3`}>
              <Icon className={`h-7 w-7 ${card.iconColor}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
