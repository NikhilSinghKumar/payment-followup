"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function FilterDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentStatus = searchParams.get("status") || "";
  const currentQuery = searchParams.get("q") || "";

  const handleChange = (e) => {
    const value = e.target.value;

    const params = new URLSearchParams();

    if (currentQuery) params.set("q", currentQuery);
    if (value) params.set("status", value);

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      className="h-[40px] px-3 rounded-lg border border-zinc-300 text-sm bg-white dark:text-zinc-500"
    >
      <option value="">Status</option>
      <option value="pending">Pending</option>
      <option value="partial">Partial</option>
      <option value="paid">Paid</option>
      <option value="overdue">Overdue</option>
    </select>
  );
}
