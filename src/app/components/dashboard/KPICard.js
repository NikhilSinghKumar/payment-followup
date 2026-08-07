import { ArrowUpRight } from "lucide-react";

export default function KPICard({
  title,
  value,
  icon: Icon,
  iconBg = "bg-blue-100 dark:bg-blue-900/30",
  iconColor = "text-blue-600 dark:text-blue-400",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-600">
            {value}
          </h2>
        </div>

        <div
          className={`flex h-7 w-7 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
