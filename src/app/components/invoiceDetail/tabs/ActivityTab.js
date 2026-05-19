export default function ActivityTab({ activities }) {
  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="p-10 text-center text-sm text-zinc-500">
          No activities yet.
        </div>
      ) : (
        activities.map((item, index) => (
          <div
            key={index}
            className="flex gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4"
          >
            <div>
              {item.type === "payment"
                ? "💰"
                : item.type === "followup"
                  ? "📝"
                  : "📦"}
            </div>

            <div>
              <div className="text-sm text-zinc-800">{item.message}</div>

              <div className="mt-1 text-xs text-zinc-500">
                {new Date(item.createdAt).toLocaleDateString("en-IN")}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
