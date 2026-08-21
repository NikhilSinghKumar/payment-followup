"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ClientFollowupsTab({ clientId, followups = [] }) {
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState("");

  function handleViewInvoices(invoices) {
    setSelectedInvoices(invoices);
    setInvoiceDialogOpen(true);
  }

  function handleViewNote(note) {
    setSelectedNote(note || "");
    setNoteDialogOpen(true);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Empty State */}
      {followups.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-medium text-zinc-700">
            No follow-ups found
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            No payment follow-up has been recorded for this client yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Related Invoices
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Follow-up Date
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Next Follow-up
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100">
              {followups.map((followup) => {
                const relatedInvoices =
                  followup.followupInvoices?.map((item) => item.invoice) ?? [];

                return (
                  <tr
                    key={followup.id}
                    className="transition hover:bg-zinc-50/70"
                  >
                    {/* Related Invoices */}
                    <td className="px-5 py-4">
                      <InvoiceLinks
                        invoices={relatedInvoices}
                        onViewAll={handleViewInvoices}
                      />
                    </td>

                    {/* Follow-up Date */}
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-700">
                      {formatDate(followup.followupDate)}
                    </td>

                    {/* Next Follow-up */}
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-700">
                      {formatDate(followup.nextFollowupDate)}
                    </td>

                    {/* Remarks */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p className="max-w-[350px] truncate text-sm text-zinc-600">
                          {followup.note || "—"}
                        </p>

                        {followup.note && (
                          <button
                            type="button"
                            onClick={() => handleViewNote(followup.note)}
                            className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================= */}
      {/* RELATED INVOICES DIALOG */}
      {/* ========================================= */}

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="max-w-lg bg-white text-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Related Invoices</DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            <p className="mb-3 text-sm text-zinc-500">
              {selectedInvoices.length}{" "}
              {selectedInvoices.length === 1 ? "invoice was" : "invoices were"}{" "}
              included in this follow-up.
            </p>

            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <div className="divide-y divide-zinc-100">
                {selectedInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="
                      flex items-center justify-between
                      px-4 py-3
                      transition hover:bg-zinc-50
                    "
                  >
                    <span className="text-sm font-medium text-zinc-700">
                      {invoice.invoiceNumber}
                    </span>

                    <span className="text-xs font-medium text-blue-600">
                      View invoice
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================= */}
      {/* REMARKS DIALOG */}
      {/* ========================================= */}

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-lg bg-white text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>Follow-up Remarks</DialogTitle>
          </DialogHeader>

          <div className="mt-2 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {selectedNote ? (
              selectedNote.split("\n").map((line, idx) => {
                const colonIdx = line.indexOf(":");
                if (colonIdx > 0 && colonIdx < 30) {
                  const prefix = line.slice(0, colonIdx).trim();
                  const rest = line.slice(colonIdx + 1).trim();
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/50"
                    >
                      <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        {prefix}
                      </span>
                      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-200">
                        {rest}
                      </p>
                    </div>
                  );
                }
                return (
                  <p
                    key={idx}
                    className="text-sm text-zinc-700 dark:text-zinc-200"
                  >
                    {line}
                  </p>
                );
              })
            ) : (
              <p className="text-sm text-zinc-400">No remarks recorded.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * ======================================================
 * RELATED INVOICES
 * ======================================================
 */

function InvoiceLinks({ invoices = [], onViewAll }) {
  // Client-level follow-up with no specific invoice
  if (invoices.length === 0) {
    return <span className="text-sm text-zinc-400">General follow-up</span>;
  }

  const firstInvoice = invoices[0];
  const remainingCount = invoices.length - 1;

  return (
    <div className="flex items-center gap-1.5">
      {/* First Invoice */}
      <Link
        href={`/invoices/${firstInvoice.id}`}
        title={firstInvoice.invoiceNumber}
        className="inline-block max-w-[160px]
          truncate rounded-md
          bg-blue-50 px-2 py-1
          text-xs font-medium text-blue-700
          transition hover:bg-blue-100
        "
      >
        {firstInvoice.invoiceNumber}
      </Link>

      {/* Remaining Invoice Count */}
      {remainingCount > 0 && (
        <button
          type="button"
          onClick={() => onViewAll(invoices)}
          className="
            shrink-0 whitespace-nowrap
            rounded-md bg-zinc-100
            px-2 py-1
            text-xs font-medium text-zinc-600
            transition
            hover:bg-zinc-200
            hover:text-zinc-800
          "
        >
          +{remainingCount} more
        </button>
      )}
    </div>
  );
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
