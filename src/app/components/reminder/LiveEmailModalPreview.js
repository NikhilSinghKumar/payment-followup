"use client";

import { useState } from "react";
import {
  Monitor,
  Smartphone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Clock,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export default function LiveEmailModalPreview({
  html = "",
  subject = "",
  recipientEmails = [],
  senderCompany = "PAFEX Logistics",
  senderEmail = "",
  reminderType = "OVERDUE",
}) {
  const [deviceMode, setDeviceMode] = useState("desktop"); // desktop | mobile
  const [copiedHtml, setCopiedHtml] = useState(false);

  function handleCopyHtml() {
    if (!html) return;
    navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  }

  // Determine badge style based on reminder type
  let badgeColor =
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
  let badgeLabel = "Payment Reminder";
  let badgeIcon = Clock;

  if (
    reminderType === "FINAL_NOTICE" ||
    reminderType === "SUSPENSION_WARNING"
  ) {
    badgeColor =
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800";
    badgeLabel =
      reminderType === "SUSPENSION_WARNING"
        ? "Suspension Warning"
        : "Final Demand";
    badgeIcon = AlertTriangle;
  } else if (reminderType === "OVERDUE" || reminderType === "OVERDUE_NOTICE") {
    badgeColor =
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800";
    badgeLabel = "Overdue Notice";
    badgeIcon = ShieldAlert;
  } else if (reminderType === "DUE_TODAY") {
    badgeColor =
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800";
    badgeLabel = "Due Today";
    badgeIcon = Calendar;
  } else if (reminderType === "STATEMENT") {
    badgeColor =
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
    badgeLabel = "Statement of Account";
    badgeIcon = Mail;
  }

  const BadgeIconComponent = badgeIcon;

  return (
    <div className="space-y-3">
      {/* Email Metadata Bar */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badgeColor}`}
            >
              <BadgeIconComponent size={11} />
              <span>{badgeLabel}</span>
            </span>
            <span className="text-xs text-zinc-400">
              Live Rendered Output (Unified Template)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Device Preview Toggle */}
            <div className="flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => setDeviceMode("desktop")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                  deviceMode === "desktop"
                    ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                }`}
                title="Desktop View (Full Width)"
              >
                <Monitor size={12} />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode("mobile")}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                  deviceMode === "mobile"
                    ? "bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone size={12} />
                <span>Mobile</span>
              </button>
            </div>

            {/* Copy HTML */}
            <button
              type="button"
              onClick={handleCopyHtml}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-600 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              title="Copy Raw HTML Template"
            >
              {copiedHtml ? (
                <Check size={12} className="text-emerald-600" />
              ) : (
                <Copy size={12} />
              )}
              <span>{copiedHtml ? "Copied" : "Copy HTML"}</span>
            </button>
          </div>
        </div>

        {/* Envelope Metadata */}
        <div className="mt-2.5 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-14 font-bold text-zinc-400">From:</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {senderCompany} {senderEmail ? `<${senderEmail}>` : ""}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-14 font-bold text-zinc-400 pt-0.5">To:</span>
            <div className="flex flex-wrap gap-1.5">
              {recipientEmails && recipientEmails.length > 0 ? (
                recipientEmails.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-medium text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"
                  >
                    {email}
                  </span>
                ))
              ) : (
                <span className="italic text-zinc-400">
                  No recipient email addresses selected yet (Select in Compose
                  tab)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-14 font-bold text-zinc-400 pt-0.5">
              Subject:
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {subject || "Payment Reminder"}
            </span>
          </div>
        </div>
      </div>

      {/* Rendered Email Frame */}
      <div className="flex justify-center overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-100/80 p-2 sm:p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
        <div
          className={`transition-all duration-200 ${
            deviceMode === "mobile"
              ? "w-full max-w-[375px] shadow-lg"
              : "w-full max-w-[660px]"
          }`}
        >
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-700">
            <iframe
              title="Email Template Live Preview"
              srcDoc={html}
              sandbox="allow-same-origin"
              className="h-[380px] sm:h-[480px] w-full border-0 bg-[#F3F6FB]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
