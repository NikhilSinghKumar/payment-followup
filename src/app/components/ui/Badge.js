import clsx from "clsx";

export default function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-slate-100 text-slate-700",

    primary: "bg-blue-100 text-blue-700",

    success: "bg-emerald-100 text-emerald-700",

    warning: "bg-amber-100 text-amber-700",

    danger: "bg-red-100 text-red-700",

    purple: "bg-violet-100 text-violet-700",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
      )}
    >
      {children}
    </span>
  );
}
