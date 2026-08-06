"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import ImportSummaryCard from "./ImportSummaryCard";
import DownloadErrorReport from "./DownloadErrorReport";
import ImportErrorTable from "./ImportErrorTable";

export default function ImportResultDialog({
  open,
  onOpenChange,
  title = "Import Result",
  result,

  // Configurable per import type
  errorFilename = "Import_Errors.csv",
  errorColumns,
}) {
  if (!result) return null;

  const summary = result.summary || {
    total: 0,
    inserted: 0,
    skipped: 0,
  };

  const errors = result.errors || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl bg-white text-zinc-900 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>

          <DialogDescription className="text-sm text-zinc-500">
            Import completed. Review the summary below and fix any failed rows
            before importing again.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <ImportSummaryCard summary={summary} />

        {/* Download Error Report */}
        {errors.length > 0 && (
          <div className="flex justify-end">
            <DownloadErrorReport
              errors={errors}
              filename={errorFilename}
              columns={errorColumns}
            />
          </div>
        )}

        {/* Error Table */}
        <ImportErrorTable errors={errors} columns={errorColumns} />
      </DialogContent>
    </Dialog>
  );
}
