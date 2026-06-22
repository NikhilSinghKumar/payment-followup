"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function AmountRangeFilterDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentRange = searchParams.get("amountRange") || "";

  function handleChange(e) {
    const params = new URLSearchParams(searchParams);

    if (e.target.value) {
      params.set("amountRange", e.target.value);
    } else {
      params.delete("amountRange");
    }

    router.push(`/invoices?${params.toString()}`);
  }

  return (
    <select
      value={currentRange}
      onChange={handleChange}
      className="h-[40px] rounded-lg border border-zinc-200 px-3 text-sm"
    >
      <option value="">Amount</option>
      <option value="0-10K">0 - 10K</option>
      <option value="10K-50K">10K - 50K</option>
      <option value="50K-1L">50K - 1 Lakh</option>
      <option value="1L-5L">1 Lakh - 5 Lakh</option>
      <option value="5L+">5 Lakh+</option>
    </select>
  );
}
