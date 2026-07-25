"use client";

export default function FollowupFields({ values, onChange, disabled = false }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h3 className="mb-4 text-lg font-semibold">Follow-up Details</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Follow-up Date */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Follow-up Date
            <span className="text-red-500"> *</span>
          </label>

          <input
            type="date"
            name="followupDate"
            value={values.followupDate}
            onChange={onChange}
            disabled={disabled}
            required
            className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Next Follow-up Date */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Next Follow-up Date
          </label>

          <input
            type="date"
            name="nextFollowupDate"
            value={values.nextFollowupDate}
            onChange={onChange}
            disabled={disabled}
            className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Remarks */}
      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium">Remarks</label>

        <textarea
          name="note"
          rows={4}
          value={values.note}
          onChange={onChange}
          disabled={disabled}
          placeholder="Enter follow-up discussion..."
          className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
