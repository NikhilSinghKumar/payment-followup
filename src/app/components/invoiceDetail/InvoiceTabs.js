"use client";

import { useState } from "react";

import AwbsTab from "./tabs/AwbsTab";
import PaymentsTab from "./tabs/PaymentsTab";
import FollowupsTab from "./tabs/FollowupsTab";
import ActivityTab from "./tabs/ActivityTab";
import OverviewTab from "./tabs/OverviewTab";

export default function InvoiceTabs({
  invoice,
  invoiceId,
  awbs,
  payments,
  followups,
  activities,
}) {
  const [tab, setTab] = useState("overview");

  const tabs = [
    {
      key: "overview",
      label: "Overview",
    },
    {
      key: "awbs",
      label: `AWBs (${awbs.length})`,
    },
    {
      key: "payments",
      label: `Payments (${payments.length})`,
    },
    {
      key: "followups",
      label: `Followups (${followups.length})`,
    },
    {
      key: "activity",
      label: "Activity",
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* TAB HEADER */}
      <div className="flex gap-2 border-b border-zinc-200 p-3">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition ${
              tab === item.key
                ? "bg-blue-500 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="p-4">
        {tab === "overview" && <OverviewTab invoice={invoice} />}

        {tab === "awbs" && <AwbsTab invoiceId={invoiceId} awbs={awbs} />}

        {tab === "payments" && (
          <PaymentsTab invoiceId={invoiceId} payments={payments} />
        )}

        {tab === "followups" && (
          <FollowupsTab invoiceId={invoiceId} followups={followups} />
        )}

        {tab === "activity" && <ActivityTab activities={activities} />}
      </div>
    </div>
  );
}
