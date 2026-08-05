"use client";

import { useState } from "react";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FollowupTable({ followups = [] }) {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState("");

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  // =========================================
  // VIEW INVOICES
  // =========================================

  function handleViewInvoices(invoices) {
    setSelectedInvoices(invoices);
    setInvoiceDialogOpen(true);
  }

  // =========================================
  // VIEW NOTE
  // =========================================

  function handleViewNote(note) {
    setSelectedNote(note || "");
    setNoteDialogOpen(true);
  }

  // =========================================
  // EMPTY STATE
  // =========================================

  if (followups.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="text-sm font-medium text-zinc-700">No follow-ups found</p>

        <p className="mt-1 text-sm text-zinc-400">
          No payment follow-ups have been recorded yet.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ========================================= */}
      {/* TABLE */}
      {/* ========================================= */}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Client
              </th>

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

          <tbody className="divide-y divide-zinc-100 bg-white">
            {followups.map((followup) => {
              const relatedInvoices =
                followup.followupInvoices?.map((item) => item.invoice) ?? [];

              return (
                <tr
                  key={followup.id}
                  className="transition hover:bg-zinc-50/70"
                >
                  {/* Client */}
                  <td className="whitespace-nowrap px-5 py-4">
                    <Link
                      href={`/clients/${followup.client?.id}`}
                      className="text-sm font-medium text-zinc-800 hover:text-blue-600"
                    >
                      {followup.client?.companyName || "—"}
                    </Link>

                    {followup.client?.companyCode && (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {followup.client.companyCode}
                      </p>
                    )}
                  </td>

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
                      <p className="max-w-[260px] truncate text-sm text-zinc-600">
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
        <DialogContent className="max-w-lg bg-white text-zinc-900 shadow-2xl">
          <DialogHeader>
            <DialogTitle>Follow-up Remarks</DialogTitle>
          </DialogHeader>

          <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">
            {selectedNote || "No remarks recorded."}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * ======================================================
 * RELATED INVOICES
 * ======================================================
 */

function InvoiceLinks({ invoices = [], onViewAll }) {
  // General client-level follow-up
  if (invoices.length === 0) {
    return <span className="text-sm text-zinc-400">General follow-up</span>;
  }

  // Show only first invoice
  const firstInvoice = invoices[0];

  const remainingCount = invoices.length - 1;

  return (
    <div className="flex items-center gap-1.5">
      {/* First Invoice */}
      <Link
        href={`/invoices/${firstInvoice.id}`}
        title={firstInvoice.invoiceNumber}
        className="inline-block max-w-[140px]
          truncate rounded-md
          bg-blue-50 px-2 py-1
          text-xs font-medium text-blue-700
          transition hover:bg-blue-100
        "
      >
        {firstInvoice.invoiceNumber}
      </Link>

      {/* Remaining Invoices */}
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

/**
 * ======================================================
 * DATE FORMAT
 * ======================================================
 */

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
