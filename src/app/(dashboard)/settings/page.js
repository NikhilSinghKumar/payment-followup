import { getNotificationSettings } from "@/app/actions/notificationSettings";
import NotificationSettingsForm from "@/app/components/settings/NotificationSettingsForm";
import NotificationLogsTable from "@/app/components/settings/NotificationLogsTable";
import Link from "next/link";
import {
  Bell,
  Sliders,
  History,
  Building,
  Mail,
  ShieldAlert,
} from "lucide-react";

export const metadata = {
  title: "Notification Settings & Automation Controls | PAFEX",
  description:
    "Configure automated reminder schedules, rules, and delivery logs.",
};

export default async function SettingsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams?.tab || "notifications";

  const { settings, company } = await getNotificationSettings();

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Notification & Automation Settings
            </h1>
            {/* <p className="mt-1 text-xs text-zinc-500">
              Manage automatic reminder schedules, follow-up escalation rules,
              and inspect delivery logs.
            </p> */}
          </div>

          {/* {company && (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Building
                size={14}
                className="text-blue-600 dark:text-blue-400"
              />
              <span className="font-semibold">{company.companyName}</span>
            </div>
          )} */}
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 pt-4 dark:border-zinc-800">
          <Link
            href="/settings?tab=notifications"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "notifications"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <Sliders size={14} />
            <span>Automation Rules & Schedule</span>
          </Link>

          <Link
            href="/settings?tab=logs"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "logs"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <History size={14} />
            <span>Delivery & Audit Logs</span>
          </Link>

          {/* {company?.id && (
            <Link
              href={`/companies/${company.id}`}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Building size={14} />
              <span>Company</span>
            </Link>
          )} */}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "notifications" && (
        <NotificationSettingsForm
          initialSettings={settings || {}}
          company={company || {}}
        />
      )}

      {activeTab === "logs" && <NotificationLogsTable />}
    </div>
  );
}
