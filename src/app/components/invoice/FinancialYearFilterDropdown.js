"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function FinancialYearFilterDropdown({ years }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentYear = searchParams.get("financialYear") || "";

  function handleChange(e) {
    const params = new URLSearchParams(searchParams);

    if (e.target.value) {
      params.set("financialYear", e.target.value);
    } else {
      params.delete("financialYear");
    }

    router.push(`/invoices?${params.toString()}`);
  }

  return (
    <select
      value={currentYear}
      onChange={handleChange}
      className="h-[40px] rounded-lg border border-zinc-200 px-3 text-sm"
    >
      <option value="">Year</option>

      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
}
