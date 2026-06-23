"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function AgingFilterDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentAging = searchParams.get("aging") || "";

  function handleChange(e) {
    const params = new URLSearchParams(searchParams);

    if (e.target.value) {
      params.set("aging", e.target.value);
    } else {
      params.delete("aging");
    }

    router.push(`/invoices?${params.toString()}`);
  }

  return (
    <select
      value={currentAging}
      onChange={handleChange}
      className="h-[40px] px-3 rounded-lg border border-zinc-300 text-sm bg-white dark:text-zinc-500"
    >
      <option value="">Days</option>
      <option value="0-30">0-30 Days</option>
      <option value="31-60">31-60 Days</option>
      <option value="61-90">61-90 Days</option>
      <option value="91-180">91-180 Days</option>
      <option value="180+">180+ Days</option>
    </select>
  );
}
