"use client";
import { useState } from "react";

export default function ImportInvoices() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    // ✅ basic file validation
    if (!file.name.endsWith(".csv")) {
      alert("Only CSV files are allowed");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await fetch("/api/import-invoices", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Import failed");
      }

      const data = await res.json();

      // ✅ correct mapping from API
      alert(`
Import Completed

Inserted: ${data.inserted}
Skipped: ${data.skipped}
Total: ${data.total}
`);

      // ✅ reset file after upload
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Something went wrong during import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-zinc-200 rounded-xl px-2 py-[1.5px] shadow-sm">
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
          accept=".csv"
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
        className="
          h-[34px] px-4 flex items-center rounded-lg 
          text-white text-sm font-medium
          bg-gradient-to-r from-blue-500 to-purple-500
          shadow-sm hover:shadow-md
          transition-all duration-200
          hover:scale-[1.03] cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
        "
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
