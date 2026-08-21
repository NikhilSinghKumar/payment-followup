"use client";

import { useRouter, useSearchParams } from "next/navigation";

const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function ClientAlphabetDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentLetter =
    searchParams.get("letter") || searchParams.get("alphabet") || "";

  function handleChange(e) {
    const params = new URLSearchParams(searchParams);

    if (e.target.value) {
      params.set("letter", e.target.value);
    } else {
      params.delete("letter");
      params.delete("alphabet");
    }

    router.push(`/clients?${params.toString()}`);
  }

  return (
    <select
      value={currentLetter}
      onChange={handleChange}
      className="h-9 px-3 rounded-lg border border-zinc-200 bg-white text-xs font-medium text-zinc-700 shadow-2xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
    >
      <option value="">A-Z (All)</option>
      {ALPHABETS.map((char) => (
        <option key={char} value={char}>
          {char}
        </option>
      ))}
    </select>
  );
}
