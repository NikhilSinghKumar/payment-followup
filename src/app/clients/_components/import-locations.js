"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportLocations() {
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Select a file");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("file", file);

      setLoading(true);

      const res = await fetch("/api/import-client-locations", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setLoading(false);

      if (!res.ok) {
        alert(data.message || "Import failed");
        return;
      }

      alert(`
Import Completed

Inserted: ${data.summary.inserted}
Skipped: ${data.summary.skipped}
Total: ${data.summary.total}

${data.errors?.length ? `\nErrors:\n${data.errors.join("\n")}` : ""}
`);

      router.refresh();

      setFile(null);
    } catch (err) {
      console.error(err);

      setLoading(false);

      alert("Import failed");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white/80 px-2 py-1 shadow-sm backdrop-blur-md">
      {/* FILE PICKER */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-800">
        <div className="h-8 w-8 flex items-center justify-center rounded-md bg-zinc-100">
          📄
        </div>

        <span className="max-w-[160px] truncate">
          {file ? file.name : "Choose file"}
        </span>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>

      {/* DIVIDER */}
      <div className="h-6 w-px bg-zinc-200" />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="flex h-[34px] items-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Importing
          </span>
        ) : (
          "Import"
        )}
      </button>

      {/* DIVIDER */}
      <div className="h-6 w-px bg-zinc-200" />

      {/* IMPORT BUTTON */}

      <a
        href="/api/client-locations-sample"
        className="text-xs text-blue-600 hover:underline"
      >
        Sample CSV
      </a>
    </div>
  );
}
