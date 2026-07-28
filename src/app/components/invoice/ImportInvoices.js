"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportInvoices({ clientId }) {
  const fileRef = useRef(null);

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleImport(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();

    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch(`/api/invoices/import?clientId=${clientId}`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      let message =
        `Imported : ${result.imported}\n` + `Failed : ${result.failed}`;

      if (result.errors.length) {
        message += "\n\n";

        result.errors.forEach((err) => {
          message += `Row ${err.row}: ${err.error}\n`;
        });
      }

      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);

      fileRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImport}
      />

      <button
        type="button"
        disabled={loading}
        onClick={() => fileRef.current.click()}
        className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
      >
        {loading ? "Importing..." : "Import"}
      </button>
    </>
  );
}
