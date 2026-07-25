"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

export default function FollowupTable({ followups = [] }) {
  const [open, setOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState("");

  if (followups.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        No follow-ups found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              Client
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              Invoice No.
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              Note
            </th>

            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              Follow-up
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
              Next Follow-up
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {followups.map((followup) => (
            <tr key={followup.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">{followup.companyName}</td>

              <td className="px-6 py-4">{followup.invoiceNumber}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="max-w-[220px] truncate">{followup.note}</div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNote(followup.note);
                      setOpen(true);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </button>
                </div>
              </td>

              <td className="px-6 py-4">{formatDate(followup.followupDate)}</td>
              <td className="px-6 py-4">
                {formatDate(followup.nextFollowupDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Follow-up Note</DialogTitle>
          </DialogHeader>

          <div className="whitespace-pre-wrap text-sm leading-6">
            {selectedNote}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
