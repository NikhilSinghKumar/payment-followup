export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  valueColor = "text-zinc-900 dark:text-zinc-100",
  cardBg = "border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900",
  titleColor = "text-zinc-500 dark:text-zinc-400",
}) {
  return (
    <div
      className={`rounded-xl border p-2 sm:p-2.5 shadow-2xs min-w-0 flex flex-col justify-between ${cardBg}`}
    >
      <div className="flex items-center justify-between gap-1">
        <p
          className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate ${titleColor}`}
          title={title}
        >
          {title}
        </p>
        {Icon && (
          <Icon
            size={12}
            className={`shrink-0 ${iconBg || "text-zinc-400 dark:text-zinc-500"}`}
          />
        )}
      </div>

      <div className="mt-0.5">
        <p
          className={`text-xs sm:text-sm font-bold truncate ${valueColor}`}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate leading-tight">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
