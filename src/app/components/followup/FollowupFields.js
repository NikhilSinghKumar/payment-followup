"use client";

import { CalendarDays, MessageSquareText } from "lucide-react";

export default function FollowupFields({ values, onChange, disabled = false }) {
  const inputClass = `
    w-full h-10 rounded-lg border border-zinc-200 bg-white
    px-3 text-sm text-zinc-900
    shadow-sm outline-none transition
    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10
    disabled:cursor-not-allowed disabled:bg-zinc-50
    disabled:text-zinc-400 disabled:shadow-none
  `;

  return (
    <div className="space-y-5">
      {/* Dates */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Follow-up Date */}
        <div>
          <label
            htmlFor="followupDate"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Follow-up Date
            <span className="ml-1 text-red-500">*</span>
          </label>

          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              id="followupDate"
              type="date"
              name="followupDate"
              value={values.followupDate}
              onChange={onChange}
              disabled={disabled}
              required
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        {/* Next Follow-up Date */}
        <div>
          <label
            htmlFor="nextFollowupDate"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Next Follow-up Date
            <span className="ml-1 text-xs font-normal text-zinc-400">
              Optional
            </span>
          </label>

          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              id="nextFollowupDate"
              type="date"
              name="nextFollowupDate"
              value={values.nextFollowupDate}
              onChange={onChange}
              disabled={disabled}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="note"
            className="block text-sm font-medium text-zinc-700"
          >
            Remarks (Optional)
          </label>
        </div>

        <div className="relative">
          <MessageSquareText
            size={16}
            className="pointer-events-none absolute left-3 top-3 text-zinc-400"
          />

          <textarea
            id="note"
            name="note"
            rows={4}
            value={values.note}
            onChange={onChange}
            disabled={disabled}
            placeholder="Add notes about the payment discussion, commitment, or response..."
            className="w-full resize-none rounded-lg border border-zinc-200
              bg-white py-2.5 pl-9 pr-3
              text-sm text-zinc-900 shadow-sm
              outline-none transition
              placeholder:text-zinc-400
              focus:border-blue-500
              focus:ring-2 focus:ring-blue-500/10
              disabled:cursor-not-allowed
              disabled:bg-zinc-50
              disabled:text-zinc-400
              disabled:shadow-none
            "
          />
        </div>
      </div>
    </div>
  );
}
