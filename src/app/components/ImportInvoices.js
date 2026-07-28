"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ImportResultDialog from "@/app/components/import/ImportResultDialog";

export default function ImportInvoices() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const router = useRouter();

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

      setResult(data);

      setDialogOpen(true);

      router.refresh();

      // ✅ reset file after upload
      setFile(null);
    } catch (err) {
      console.error(err);
      console.error(err);

      setResult({
        summary: {
          inserted: 0,
          skipped: 0,
          total: 0,
        },
        errors: [
          {
            row: "-",
            companyCode: "",
            invoiceNumber: "",
            reason: "Unexpected server error",
          },
        ],
      });

      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const truncateFileName = (name, max = 20) => {
    if (name.length <= max) return name;
    return name.slice(0, max) + "...";
  };

  return (
    <>
      <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-zinc-200 px-2 rounded-xl shadow-sm">
        {/* File Picker */}
        <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600 hover:text-zinc-800 transition">
          <span>{file ? truncateFileName(file.name, 10) : "Choose file"}</span>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />
        </label>

        {/* Divider */}
        <div className="h-4 w-px bg-zinc-200" />

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={loading}
          className="py-2 px-4 flex items-center rounded-lg text-gray-500 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="py-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Importing
            </span>
          ) : (
            "Import Invoices"
          )}
        </button>
      </div>
      <ImportResultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Invoice Import Result"
        result={result}
      />
    </>
  );
}
