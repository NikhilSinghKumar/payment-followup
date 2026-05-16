export default function InvoiceQuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <button className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white">
        + Add AWB
      </button>

      <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white">
        + Add Payment
      </button>

      <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white">
        + Add Followup
      </button>
    </div>
  );
}
