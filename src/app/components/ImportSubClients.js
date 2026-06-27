"use client";

import { useRef, useState } from "react";

export default function ImportSubClients({ clientId }) {
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/sub-clients/import?clientId=${clientId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Import failed.");
      } else {
        setMessage(`${data.imported} sub client(s) imported successfully.`);

        window.location.reload();
      }
    } catch {
      setMessage("Import failed.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Importing..." : "Import"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={handleFile}
      />

      {message && <p className="mt-2 text-sm text-zinc-600">{message}</p>}
    </>
  );
}
