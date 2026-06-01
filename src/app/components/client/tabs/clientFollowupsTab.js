export default function ClientFollowupsTab({ followups = [] }) {
  return (
    <div className="space-y-4">
      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800">Followups</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Track communication, payment commitments, and client responses.
          </p>
        </div>

        <button className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md">
          + Add Followup
        </button>
      </div>

      {/* ===================================== */}
      {/* EMPTY STATE */}
      {/* ===================================== */}

      {followups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
            📝
          </div>

          <h3 className="mt-4 text-lg font-semibold text-zinc-800">
            No followups added
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Record client communication, reminders, payment promises, and
            collection notes.
          </p>

          <button className="mt-5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md">
            + Add First Followup
          </button>
        </div>
      ) : (
        /* ===================================== */
        /* TIMELINE */
        /* ===================================== */

        <div className="space-y-4">
          {followups.map((item, index) => {
            return (
              <div
                key={item.id}
                className="relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                {/* TIMELINE LINE */}
                {index !== followups.length - 1 && (
                  <div className="absolute left-[27px] top-[72px] h-[calc(100%-48px)] w-px bg-zinc-200"></div>
                )}

                <div className="flex gap-4">
                  {/* ICON */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white shadow-sm">
                    F
                  </div>

                  {/* CONTENT */}
                  <div className="min-w-0 flex-1">
                    {/* TOP */}
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-zinc-800">
                            {item.title || "Followup"}
                          </h3>

                          {item.type && (
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                              {item.type}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-zinc-500">
                          {item.createdBy || "System"}
                        </p>
                      </div>

                      {/* DATE */}
                      <div className="text-sm text-zinc-500">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString()
                          : "-"}
                      </div>
                    </div>

                    {/* NOTE */}
                    <div className="mt-4 rounded-xl bg-zinc-50 p-4">
                      <p className="whitespace-pre-line text-sm leading-6 text-zinc-700">
                        {item.note}
                      </p>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {/* NEXT FOLLOWUP */}
                      {item.followupDate && (
                        <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                          Next Followup:{" "}
                          {new Date(item.followupDate).toLocaleDateString()}
                        </div>
                      )}

                      {/* RESPONSE */}
                      {item.responseStatus && (
                        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                          {item.responseStatus}
                        </div>
                      )}

                      {/* PROMISE */}
                      {item.promisedDate && (
                        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                          Payment Promise:{" "}
                          {new Date(item.promisedDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-4 flex gap-2">
                      <button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
                        Edit
                      </button>

                      <button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
                        Add Reply
                      </button>

                      <button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100">
                        Mark Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
