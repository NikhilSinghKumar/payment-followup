"use client";

import { saveAs } from "file-saver";

import { exportContacts } from "@/app/api/exportContacts";

export default function ExportContacts({ clientId }) {
  async function handleExport() {
    try {
      const contacts = await exportContacts(clientId);

      if (!contacts.length) {
        alert("No contacts found.");
        return;
      }

      const headers = Object.keys(contacts[0]);

      const rows = contacts.map((row) =>
        headers.map((header) => `"${row[header] ?? ""}"`).join(","),
      );

      const csv = [headers.join(","), ...rows].join("\n");

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

      saveAs(blob, "contacts.csv");
    } catch (error) {
      console.error(error);

      alert("Failed to export contacts.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 cursor-pointer"
    >
      Export Contacts
    </button>
  );
}
