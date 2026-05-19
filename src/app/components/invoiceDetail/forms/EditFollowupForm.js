"use client";

import { useState } from "react";

export default function EditFollowupForm({ followup, onCancel, onSuccess }) {
  const [note, setNote] = useState(followup.note || "");

  const [followupDate, setFollowupDate] = useState(
    followup.followupDate
      ? new Date(followup.followupDate).toISOString().split("T")[0]
      : "",
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/followups", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: followup.id,
          note,
          followupDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
    mt-4 rounded-xl border border-orange-200
    bg-orange-50 p-4
  "
    >
      {/* Grid Row */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
        {/* Note */}
        <div>
          <label className="mb-1 block text-sm text-zinc-600">Note *</label>

          <textarea
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            required
            className="
          w-full rounded-lg border border-zinc-200
          bg-white px-3 py-2
          text-sm text-zinc-800
          outline-none
          focus:ring-2 focus:ring-orange-500/20
          focus:border-orange-400
          resize-none
        "
          />
        </div>

        {/* Right Side */}
        <div className="space-y-4">
          {/* Followup Date */}
          <div>
            <label className="mb-1 block text-sm text-zinc-600">
              Followup Date
            </label>

            <input
              type="date"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="input-primary w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="
            rounded-lg border border-zinc-300
            px-4 py-2 text-sm font-medium
            text-zinc-700 hover:bg-zinc-100 cursor-pointer
          "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="
            rounded-lg bg-orange-500
            px-4 py-2 text-sm font-medium
            text-white hover:bg-orange-600
            disabled:opacity-50 cursor-pointer
          "
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </form>
  );
}
