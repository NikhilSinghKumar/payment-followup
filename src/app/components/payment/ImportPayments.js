"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail, Upload, FileSpreadsheet, X } from "lucide-react";
import ImportResultDialog from "@/app/components/import/ImportResultDialog";
import BulkPaymentNotificationModal from "./BulkPaymentNotificationModal";

const PAYMENT_ERROR_COLUMNS = [
  {
    key: "row",
    label: "Row",
  },
  {
    key: "clientCode",
    label: "Client",
  },
  {
    key: "subClientCode",
    label: "Subclient",
  },
  {
    key: "invoices",
    label: "Invoices",
  },
  {
    key: "reference",
    label: "Reference / Receipt",
  },
  {
    key: "reason",
    label: "Error Details",
  },
];

export default function ImportPayments() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [importedPaymentIds, setImportedPaymentIds] = useState([]);
  const fileInputRef = useRef(null);

  const router = useRouter();

  const handleClearFile = (e) => {
    if (e) e.preventDefault();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { error: "Failed to parse response from server." };
      }

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
              row: "-",
              clientCode: "",
              subClientCode: "",
              invoices: "",
              reference: "",
              reason:
                data?.error ||
                `Server error (${res.status}): Payment import failed. Please verify your file.`,
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
      if (data.insertedPaymentIds && data.insertedPaymentIds.length > 0) {
        setImportedPaymentIds(data.insertedPaymentIds);
      } else {
        setImportedPaymentIds([]);
      }
      setDialogOpen(true);

      // Refresh global payment list
      router.refresh();

      // Reset selected file
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
            row: "-",
            clientCode: "",
            subClientCode: "",
            invoices: "",
            reference: "",
            reason:
              err?.message ||
              "Unexpected network or client error during import.",
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
      <div className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-2 shadow-xs dark:border-zinc-700 dark:bg-zinc-900 transition shrink-0">
        {/* File Picker */}
        <label className="flex cursor-pointer items-center gap-1 text-xs text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">
          {file ? (
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          ) : (
            <Upload className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          )}
          <span
            className="w-[68px] truncate font-medium text-xs"
            title={file?.name || "Choose file"}
          >
            {file ? truncateFileName(file.name, 9) : "Choose file"}
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
            }}
            className="hidden"
          />
        </label>

        {file && (
          <button
            type="button"
            onClick={handleClearFile}
            className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Remove selected file"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Divider */}
        <div className="mx-1.5 h-3.5 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Import Button */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !file}
          className={`inline-flex items-center text-xs font-semibold transition ${
            file
              ? "text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
              : "text-zinc-400 cursor-not-allowed dark:text-zinc-500"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" />
              <span>Importing...</span>
            </span>
          ) : (
            <span>Import</span>
          )}
        </button>
      </div>

      {/* ===================================== */}
      {/* IMPORT RESULT DIALOG */}
      {/* ===================================== */}
      <ImportResultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Payment Import Result"
        result={result}
        errorFilename="Payment_Import_Errors.csv"
        errorColumns={PAYMENT_ERROR_COLUMNS}
        actionButton={
          result?.summary?.inserted > 0 ? (
            <button
              type="button"
              onClick={() => {
                setDialogOpen(false);
                setNotifyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
            >
              <Mail className="h-4 w-4" />
              <span>
                Send Payment Confirmation Emails ({result.summary.inserted})
              </span>
            </button>
          ) : null
        }
      />

      {/* ===================================== */}
      {/* BULK NOTIFICATION MODAL */}
      {/* ===================================== */}
      <BulkPaymentNotificationModal
        isOpen={notifyModalOpen}
        onClose={() => {
          setNotifyModalOpen(false);
          setImportedPaymentIds([]);
        }}
        initialPaymentIds={importedPaymentIds}
      />
    </>
  );
}
