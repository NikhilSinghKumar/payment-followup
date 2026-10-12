export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
}) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xs transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-3.5">
      <div className="flex items-start justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <p
            className="text-[11px] font-medium leading-tight text-zinc-500 dark:text-zinc-400 truncate"
            title={title}
          >
            {title}
          </p>

          <h2
            className="mt-1 break-words text-[13px] font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums sm:text-sm lg:text-[13px] xl:text-sm"
            title={typeof value === "string" ? value : undefined}
          >
            {value}
          </h2>

          {subtitle && (
            <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
