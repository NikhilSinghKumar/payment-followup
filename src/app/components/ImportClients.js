"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportClients() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleUpload = async () => {
    if (!file) return alert("Select a file");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    const res = await fetch("/api/import-clients", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok && data.status === "success") {
      router.refresh();
    }

    alert(`
    Import Completed

    Inserted: ${data.summary.inserted}
    Skipped: ${data.summary.skipped}
    Total: ${data.summary.total}
    `);
  };

  const truncateFileName = (name, max = 20) => {
    if (name.length <= max) return name;
    return name.slice(0, max) + "...";
  };

  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-zinc-200 rounded-lg px-2 py- shadow-sm">
      {/* File Picker */}
      <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600 hover:text-zinc-800 transition">
        <span>{file ? truncateFileName(file.name, 10) : "Choose file"}</span>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
        />
      </label>

      {/* Divider */}
      <div className="h-6 w-px bg-zinc-200" />

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={loading}
        className="flex items-center py-2 text-gray-600 text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="py-2 animate-spin"></span>
            Importing
          </span>
        ) : (
          "Import Clients"
        )}
      </button>
    </div>
  );
}
