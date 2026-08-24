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
  actionButton,
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
      <DialogContent className="max-w-5xl w-[calc(100%-1.5rem)] sm:w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-white text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            {title}
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Import completed. Review the summary below and fix any failed rows
            before importing again.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <ImportSummaryCard summary={summary} />

        {/* Actions bar (Error download & Custom actions like Notify Clients) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>{actionButton}</div>

          {errors.length > 0 && (
            <DownloadErrorReport
              errors={errors}
              filename={errorFilename}
              columns={errorColumns}
            />
          )}
        </div>

        {/* Error Table */}
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <ImportErrorTable errors={errors} columns={errorColumns} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
