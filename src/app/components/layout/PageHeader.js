export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 border-b border-slate-200/80 pb-3.5 sm:pb-4 md:flex-row md:items-center md:justify-between">
      {/* ===================================== */}
      {/* LEFT */}
      {/* ===================================== */}

      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>

      {/* ===================================== */}
      {/* RIGHT */}
      {/* ===================================== */}

      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
