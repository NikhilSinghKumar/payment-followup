import { getSuspensionDefaulters } from "@/app/actions/suspension";
import { getNotificationSettings } from "@/app/actions/notificationSettings";
import SuspensionControlCenter from "@/app/components/settings/SuspensionControlCenter";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Sliders, History } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Service Suspension Control Center | PAFEX",
  description:
    "Manage client service suspension notices, automated credit block rules, and internal summary dispatches.",
};

export default async function SuspensionPage() {
  const { defaulters, company } = await getSuspensionDefaulters();
  const { settings } = await getNotificationSettings();

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                <ShieldAlert size={18} />
              </span>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Service Suspension Control Center
              </h1>
            </div>
            <p className="mt-1.5 text-xs text-zinc-500 max-w-2xl">
              Inspect overdue defaulter clients (&ge; 10 days past due), send
              official suspension notice emails with multi-selection controls,
              toggle automated suspension dispatches, and email internal summary
              reports to operations and finance teams.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/settings?tab=notifications"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <Sliders size={14} />
              <span>Reminder Settings</span>
            </Link>

            <Link
              href="/settings?tab=logs"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <History size={14} />
              <span>Audit Logs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Interactive Control Center */}
      <SuspensionControlCenter
        initialDefaulters={defaulters || []}
        initialSettings={settings || {}}
        company={company || {}}
      />
    </div>
  );
}
