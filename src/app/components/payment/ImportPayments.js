"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import ImportResultDialog from "@/app/components/import/ImportResultDialog";

const PAYMENT_ERROR_COLUMNS = [
  {
    key: "row",
    label: "Row",
  },
  {
    key: "clientCode",
    label: "Client Code",
  },
  {
    key: "reference",
    label: "Reference",
  },
  {
    key: "reason",
    label: "Reason",
  },
];

export default function ImportPayments() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const router = useRouter();

  // =====================================
  // IMPORT
  // =====================================

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    // Basic file validation
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Only CSV files are allowed");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await fetch("/api/import-payments", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      // =====================================
      // API ERROR
      // =====================================

      if (!res.ok) {
        setResult({
          summary: {
            inserted: 0,
            skipped: 0,
            total: 0,
          },

          errors: [
            {
              row: "—",
              clientCode: "",
              reference: "",
              reason: data.error || "Payment import failed",
            },
          ],
        });

        setDialogOpen(true);

        return;
      }

      // =====================================
      // SUCCESS
      // =====================================

      setResult(data);
      setDialogOpen(true);

      // Refresh global payment list
      router.refresh();

      // Reset selected file
      setFile(null);
    } catch (err) {
      console.error("Payment import error:", err);

      setResult({
        summary: {
          inserted: 0,
          skipped: 0,
          total: 0,
        },

        errors: [
          {
            row: "—",
            clientCode: "",
            reference: "",
            reason: "Unexpected server error",
          },
        ],
      });

      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // FILE NAME
  // =====================================

  const truncateFileName = (name, max = 20) => {
    if (name.length <= max) return name;

    return name.slice(0, max) + "...";
  };

  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white/80 px-2 shadow-sm backdrop-blur-md">
        {/* File Picker */}

        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 transition hover:text-zinc-800">
          <span>{file ? truncateFileName(file.name, 14) : "Choose file"}</span>

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
            }}
            className="hidden"
          />
        </label>

        {/* Divider */}

        <div className="h-4 w-px bg-zinc-200" />

        {/* Import Button */}

        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !file}
          className="
            flex items-center rounded-lg
            px-4 py-2
            text-sm font-medium text-zinc-600
            transition
            hover:text-zinc-900
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" />
              Importing...
            </span>
          ) : (
            "Import Payments"
          )}
        </button>
      </div>

      {/* ===================================== */}
      {/* IMPORT RESULT */}
      {/* ===================================== */}

      <ImportResultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Payment Import Result"
        result={result}
        errorFilename="Payment_Import_Errors.csv"
        errorColumns={PAYMENT_ERROR_COLUMNS}
      />
    </>
  );
}
