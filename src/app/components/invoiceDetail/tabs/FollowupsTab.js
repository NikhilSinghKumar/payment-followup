"use client";

import { useState } from "react";

import AddFollowupForm from "../forms/AddFollowupForm";

export default function FollowupsTab({ invoiceId, followups }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Followups</h2>

        <button
          onClick={() => setShowForm(!showForm)}
          className="
            rounded-lg bg-orange-500
            px-4 py-2 text-sm font-medium
            text-white cursor-pointer
          "
        >
          {showForm ? "Close" : "+ Add Followup"}
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <AddFollowupForm
          invoiceId={invoiceId}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {/* LIST */}
      <div className="space-y-4">
        {followups.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
            No followups added yet.
          </div>
        ) : (
          followups.map((followup) => (
            <div
              key={followup.id}
              className="
                rounded-xl border border-zinc-200
                bg-zinc-50 p-4
              "
            >
              {/* TOP */}
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm text-zinc-800">{followup.note}</div>

                <div className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                  Followup
                </div>
              </div>

              {/* FOOTER */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
                <div>
                  Created:{" "}
                  {new Date(followup.createdAt).toLocaleDateString("en-IN")}
                </div>

                {followup.followupDate && (
                  <div>
                    Followup:{" "}
                    {new Date(followup.followupDate).toLocaleDateString(
                      "en-IN",
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
