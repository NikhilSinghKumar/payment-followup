"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "high";

  function toggleSort() {
    const params = new URLSearchParams(searchParams);

    const newSort = currentSort === "high" ? "low" : "high";

    params.set("sort", newSort);

    router.push(`/invoices?${params.toString()}`);
  }

  return (
    <button
      onClick={toggleSort}
      className="flex items-center gap-1 font-semibold transition"
    >
      <span>Amount</span>

      {currentSort === "high" ? (
        <ChevronDown size={16} />
      ) : (
        <ChevronUp size={16} />
      )}
    </button>
  );
}
