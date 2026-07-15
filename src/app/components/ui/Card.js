import clsx from "clsx";

export default function Card({
  children,
  title,
  subtitle,
  actions,
  className,
  padding = true,
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        padding && "p-6",
        className,
      )}
    >
      {(title || actions) && (
        <div className="mb-5 flex items-start justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            )}

            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {children}
    </div>
  );
}
