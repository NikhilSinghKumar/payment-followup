"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "high";

  function handleChange(e) {
    const params = new URLSearchParams(searchParams);

    params.set("sort", e.target.value);

    router.push(`/invoices?${params.toString()}`);
  }

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      className="h-[40px] rounded-lg border border-zinc-200 px-3 text-sm"
    >
      <option value="high">Highest</option>
      <option value="low">Lowest</option>
    </select>
  );
}
