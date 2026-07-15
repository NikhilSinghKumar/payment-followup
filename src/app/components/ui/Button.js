import clsx from "clsx";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  disabled = false,
  loading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",

    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",

    outline:
      "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",

    danger: "bg-red-600 text-white hover:bg-red-700",

    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",

    md: "h-10 px-4 text-sm",

    lg: "h-11 px-6 text-base",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {LeftIcon && <LeftIcon size={18} className="mr-2" />}

      {loading ? "Loading..." : children}

      {RightIcon && <RightIcon size={18} className="ml-2" />}
    </button>
  );
}
