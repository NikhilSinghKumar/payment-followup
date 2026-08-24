import {
  getNotificationSettings,
  getEscalationTierRules,
} from "@/app/actions/notificationSettings";
import { getSuspensionDefaulters } from "@/app/actions/suspension";
import { getDepartments } from "@/app/actions/department";
import NotificationSettingsForm from "@/app/components/settings/NotificationSettingsForm";
import NotificationLogsTable from "@/app/components/settings/NotificationLogsTable";
import EscalationHierarchyConfig from "@/app/components/settings/EscalationHierarchyConfig";
// import DepartmentManager from "@/app/components/settings/DepartmentManager";
import SuspensionControlCenter from "@/app/components/settings/SuspensionControlCenter";
import Link from "next/link";
import {
  Bell,
  Sliders,
  History,
  Building,
  Building2,
  Mail,
  ShieldAlert,
  Flame,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notification Settings & Automation Controls | PAFEX",
  description:
    "Configure automated reminder schedules, rules, suspension controls, and delivery logs.",
};

export default async function SettingsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams?.tab || "notifications";

  const { settings, company } = await getNotificationSettings();
  const {
    rules: escalationRules,
    rolesList,
    departmentsList,
  } = await getEscalationTierRules();
  const allDepartments = await getDepartments();
  const { defaulters } = await getSuspensionDefaulters();

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Notification & Escalation Settings
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Manage automatic reminder schedules, service suspension policies,
              multi-tier department escalations and inspect delivery audit logs.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
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
            href="/settings?tab=suspensions"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "suspensions"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <ShieldAlert
              size={14}
              className={
                activeTab === "suspensions" ? "text-white" : "text-red-500"
              }
            />
            <span>Suspension Center</span>
            {defaulters?.length > 0 && (
              <span className="rounded-full bg-red-500/20 px-1.5 py-0.2 text-[10px] font-bold text-red-600 dark:text-red-300">
                {defaulters.length}
              </span>
            )}
          </Link>

          <Link
            href="/settings?tab=escalations"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "escalations"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <Flame
              size={14}
              className={
                activeTab === "escalations" ? "text-white" : "text-amber-500"
              }
            />
            <span>Escalation Hierarchy</span>
          </Link>

          {/* <Link
            href="/settings?tab=departments"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "departments"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            <Building2 size={14} />
            <span>Departments</span>
          </Link> */}

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
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "notifications" && (
        <NotificationSettingsForm
          initialSettings={settings || {}}
          company={company || {}}
        />
      )}

      {activeTab === "suspensions" && (
        <SuspensionControlCenter
          initialDefaulters={defaulters || []}
          initialSettings={settings || {}}
          company={company || {}}
        />
      )}

      {activeTab === "escalations" && (
        <EscalationHierarchyConfig
          initialRules={escalationRules || []}
          rolesList={rolesList || []}
          departmentsList={departmentsList || []}
        />
      )}

      {/* {activeTab === "departments" && (
        <DepartmentManager departments={allDepartments || []} />
      )} */}

      {activeTab === "logs" && <NotificationLogsTable />}
    </div>
  );
}
