"use client";

import { useRouter, useSearchParams } from "next/navigation";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthFilterDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMonth = searchParams.get("month") || "";

  function handleChange(e) {
    const params = new URLSearchParams(searchParams);

    if (e.target.value) {
      params.set("month", e.target.value);
    } else {
      params.delete("month");
    }

    router.push(`/invoices?${params.toString()}`);
  }

  return (
    <select
      value={currentMonth}
      onChange={handleChange}
      className="h-[40px] rounded-lg border border-zinc-200 px-3 text-sm"
    >
      <option value="">Month</option>

      {months.map((month, index) => (
        <option key={month} value={index + 1}>
          {month}
        </option>
      ))}
    </select>
  );
}
