import clsx from "clsx";

export default function Input({
  label,
  error,
  helperText,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  required = false,
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {/* ====================================== */}
      {/* LABEL */}
      {/* ====================================== */}

      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}

          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* ====================================== */}
      {/* INPUT */}
      {/* ====================================== */}

      <div className="relative">
        {LeftIcon && (
          <LeftIcon
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}

        <input
          className={clsx(
            "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm transition-all",
            "placeholder:text-slate-400",
            "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
            LeftIcon && "pl-10",
            RightIcon && "pr-10",
            error && "border-red-500 focus:border-red-500 focus:ring-red-100",
            className,
          )}
          {...props}
        />

        {RightIcon && (
          <RightIcon
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
      </div>

      {/* ====================================== */}
      {/* HELPER / ERROR */}
      {/* ====================================== */}

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        helperText && <p className="text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
