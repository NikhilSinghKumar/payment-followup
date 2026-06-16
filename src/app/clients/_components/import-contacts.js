"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportContacts({ clientId }) {
  const router = useRouter();
  const inputRef = useRef(null);

  const [isImporting, setIsImporting] = useState(false);

  const [result, setResult] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setIsImporting(true);

      const formData = new FormData();

      formData.append("clientId", clientId);

      formData.append("file", file);

      const response = await fetch("/api/import-client-contacts", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setResult(data);

      const message = [
        "Import completed.",
        "",
        `Inserted: ${data.imported || 0}`,
        `Failed: ${data.failed || 0}`,
        "",
      ];

      if (data.errors?.length) {
        message.push("Errors:");

        data.errors.forEach((err) => {
          message.push(`Row ${err.row}: ${err.error}`);
        });
      }

      alert(message.join("\n"));

      if (data.success) {
        router.refresh();
      }
    } catch (error) {
      console.error(error);

      alert("Failed to import contacts.");
    } finally {
      setIsImporting(false);

      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={isImporting}
        onClick={() => inputRef.current?.click()}
        className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
      >
        {isImporting ? "Importing..." : "Import Contacts"}
      </button>
    </div>
  );
}
