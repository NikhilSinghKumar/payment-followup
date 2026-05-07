"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddFollowup({ invoiceId, onSuccess }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async () => {
    if (!note.trim()) return alert("Enter note");

    setLoading(true);

    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed");
        return;
      }

      setNote("");

      router.refresh();
      onSuccess?.();
    } catch (err) {
      console.error(err);
      alert("Error adding followup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border border-zinc-200 rounded-2xl shadow-md p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-800">Add Follow-up</h3>
        <p className="text-sm text-zinc-500">
          Keep track of client communication
        </p>
      </div>

      <textarea
        placeholder="Write follow-up note..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        className="
          w-full px-3 py-2 rounded-lg border border-zinc-300 
          text-sm resize-none outline-none dark:text-zinc-800
          focus:ring-2 focus:ring-purple-400 focus:border-transparent
        "
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400">{note.length} characters</span>

        <button
          onClick={handleSubmit}
          disabled={loading || !note.trim()}
          className="
            h-[38px] px-4 rounded-lg text-white text-sm font-medium
            bg-gradient-to-r from-blue-500 to-purple-500 cursor-pointer
            shadow-sm hover:shadow-md
            transition-all duration-200
            hover:scale-[1.03]
          "
        >
          {loading ? "Saving..." : "Save Note"}
        </button>
      </div>
    </div>
  );
}
