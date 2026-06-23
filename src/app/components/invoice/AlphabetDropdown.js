"use client";

import { useRouter, useSearchParams } from "next/navigation";

const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function AlphabetDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentLetter = searchParams.get("alphabet") || "";

  function handleChange(e) {
    const params = new URLSearchParams(searchParams);

    if (e.target.value) {
      params.set("alphabet", e.target.value);
    } else {
      params.delete("alphabet");
    }

    router.push(`/invoices?${params.toString()}`);
  }

  return (
    <select
      value={currentLetter}
      onChange={handleChange}
      className="h-[40px] px-3 rounded-lg border border-zinc-300 text-sm bg-white dark:text-zinc-500"
    >
      <option value="">A-Z</option>

      {ALPHABETS.map((letter) => (
        <option key={letter} value={letter}>
          {letter}
        </option>
      ))}
    </select>
  );
}
