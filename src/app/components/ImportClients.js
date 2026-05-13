"use client";
import { useState } from "react";

export default function ImportClients() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

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

    alert(`
    Import Completed

    Inserted: ${data.summary.inserted}
    Skipped: ${data.summary.skipped}
    Total: ${data.summary.total}
    `);
  };

  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-zinc-200 rounded-lg px-2 py- shadow-sm">
      {/* File Picker */}
      <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600 hover:text-zinc-800 transition">
        <div className="h-8 w-8 flex items-center justify-center rounded-md bg-zinc-100">
          📄
        </div>

        <span className="max-w-[140px] truncate">
          {file ? file.name : "Choose file"}
        </span>

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
        className="h-[34px] px-4 flex items-center rounded-lg text-white text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.03] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Importing
          </span>
        ) : (
          "Import"
        )}
      </button>
    </div>
  );
}
