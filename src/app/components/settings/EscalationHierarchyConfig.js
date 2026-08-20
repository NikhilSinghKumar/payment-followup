"use client";

import { useState, useTransition } from "react";
import {
  ShieldAlert,
  Save,
  Plus,
  Play,
  Check,
  AlertCircle,
  Clock,
  Mail,
  UserCheck,
  Users,
  Building2,
  Briefcase,
  Info,
  Flame,
  UserPlus,
} from "lucide-react";
import {
  saveEscalationTierRules,
  triggerManualEscalationRun,
} from "@/app/actions/notificationSettings";

export default function EscalationHierarchyConfig({
  initialRules = [],
  rolesList = [],
  departmentsList = [],
}) {
  const [rules, setRules] = useState(
    initialRules.length > 0
      ? initialRules
      : [
          {
            tierLevel: 1,
            daysAfterDue: 1,
            targetDepartmentId: departmentsList[0]?.id || "",
            targetRoleId: rolesList[0]?.id || "",
            notifyAccountManager: false,
            customEmail: "",
            description:
              "Tier 1: Initial reminder to Collections / Accounts Executive on 1st day overdue",
            isActive: true,
          },
          {
            tierLevel: 2,
            daysAfterDue: 4,
            targetDepartmentId: departmentsList[0]?.id || "",
            targetRoleId: rolesList[1]?.id || rolesList[0]?.id || "",
            notifyAccountManager: true,
            customEmail: "",
            description:
              "Tier 2: Escalation to Finance Lead + Client Account/Sales Manager",
            isActive: true,
          },
          {
            tierLevel: 3,
            daysAfterDue: 8,
            targetDepartmentId:
              departmentsList.find((d) =>
                /mgmt|management|exec/i.test(d.code || d.name),
              )?.id ||
              departmentsList[0]?.id ||
              "",
            targetRoleId: "",
            notifyAccountManager: true,
            customEmail: "",
            description:
              "Tier 3: Executive Escalation to Management & Finance Directors",
            isActive: true,
          },
        ],
  );

  const [isSaving, startSaveTransition] = useTransition();
  const [isEvaluating, startEvalTransition] = useTransition();
  const [feedback, setFeedback] = useState(null);
  const [evalResult, setEvalResult] = useState(null);

  function handleRuleChange(index, field, value) {
    setRules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function handleAddTier() {
    const nextTierNum = rules.length + 1;
    const lastDays = rules[rules.length - 1]?.daysAfterDue || 0;
    setRules((prev) => [
      ...prev,
      {
        tierLevel: nextTierNum,
        daysAfterDue: lastDays + 4,
        targetDepartmentId: departmentsList[0]?.id || "",
        targetRoleId: "",
        notifyAccountManager: true,
        customEmail: "",
        description: `Tier ${nextTierNum}: Senior escalation step`,
        isActive: true,
      },
    ]);
  }

  function handleRemoveTier(index) {
    if (rules.length <= 1) return;
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    setFeedback(null);
    startSaveTransition(async () => {
      const res = await saveEscalationTierRules(rules);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  function handleRunEscalation() {
    setFeedback(null);
    setEvalResult(null);
    startEvalTransition(async () => {
      const res = await triggerManualEscalationRun();
      if (res.success) {
        setEvalResult(res.summary);
        setFeedback({ type: "success", message: res.message });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
            <Flame size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Department & Role Escalation Hierarchy
            </h2>
            <p className="text-xs text-zinc-500">
              Route overdue invoices hierarchically across Departments (Finance,
              Sales, Management) and Roles to resolve receivables faster.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunEscalation}
            disabled={isEvaluating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {isEvaluating ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
            ) : (
              <Play size={13} className="text-red-500" />
            )}
            <span>Evaluate & Run Now</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isSaving ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save size={13} />
            )}
            <span>Save Escalation Tiers</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-xl p-3.5 text-xs font-semibold ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
              : "border border-red-200 bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <Check size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Evaluation Results Banner */}
      {evalResult && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-200">
            <span>Escalation Evaluation Summary:</span>
            <span>Overdue Evaluated: {evalResult.totalOverdueInvoices}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-2 text-center dark:bg-zinc-800">
              <span className="text-[10px] text-zinc-500">
                Escalated Emails
              </span>
              <div className="font-bold text-emerald-600">
                {evalResult.escalated}
              </div>
            </div>
            <div className="rounded-lg bg-white p-2 text-center dark:bg-zinc-800">
              <span className="text-[10px] text-zinc-500">
                Auto-Resolved (Paid)
              </span>
              <div className="font-bold text-blue-600">
                {evalResult.resolvedPaid}
              </div>
            </div>
            <div className="rounded-lg bg-white p-2 text-center dark:bg-zinc-800">
              <span className="text-[10px] text-zinc-500">
                Pending Next SLA
              </span>
              <div className="font-bold text-zinc-700 dark:text-zinc-300">
                {evalResult.skipped}
              </div>
            </div>
            <div className="rounded-lg bg-white p-2 text-center dark:bg-zinc-800">
              <span className="text-[10px] text-zinc-500">Errors</span>
              <div className="font-bold text-red-600">
                {evalResult.errors?.length || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Hierarchy Tiers Builder */}
      <div className="space-y-4">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className={`relative rounded-2xl border p-4 transition ${
              rule.isActive
                ? "border-zinc-200 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-800/30"
                : "border-dashed border-zinc-200 bg-zinc-100/50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            {/* Step Marker */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3 pb-3 border-b border-zinc-200/60 dark:border-zinc-700/60">
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                    rule.tierLevel === 1
                      ? "bg-amber-500"
                      : rule.tierLevel === 2
                        ? "bg-orange-600"
                        : "bg-red-600"
                  }`}
                >
                  {rule.tierLevel}
                </span>
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  Tier {rule.tierLevel} Escalation Step
                </span>
                <span className="text-[11px] text-zinc-400">
                  (Triggered at <strong>{rule.daysAfterDue} days</strong>{" "}
                  overdue)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={(e) =>
                      handleRuleChange(idx, "isActive", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enabled</span>
                </label>

                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(idx)}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Days Overdue
                </label>
                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="number"
                    min="1"
                    value={rule.daysAfterDue}
                    onChange={(e) =>
                      handleRuleChange(idx, "daysAfterDue", e.target.value)
                    }
                    className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  Days after invoice due date
                </span>
              </div>

              {/* Department Target */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Target Department
                </label>
                <div className="relative">
                  <Building2
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <select
                    value={rule.targetDepartmentId || ""}
                    onChange={(e) =>
                      handleRuleChange(
                        idx,
                        "targetDepartmentId",
                        e.target.value,
                      )
                    }
                    className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">Any / All Departments</option>
                    {departmentsList.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.code ? `(${dept.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  e.g. Finance, Sales, or Management
                </span>
              </div>

              {/* Role Target (Optional Narrowing) */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Target Role (Optional)
                </label>
                <div className="relative">
                  <Briefcase
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <select
                    value={rule.targetRoleId || ""}
                    onChange={(e) =>
                      handleRuleChange(idx, "targetRoleId", e.target.value)
                    }
                    className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    <option value="">All Roles in Dept</option>
                    {rolesList.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  Narrow down to specific role
                </span>
              </div>

              {/* Custom / CC Email */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Custom / External CC (Optional)
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    value={rule.customEmail || ""}
                    placeholder="e.g. director@company.com"
                    onChange={(e) =>
                      handleRuleChange(idx, "customEmail", e.target.value)
                    }
                    className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                </div>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">
                  Additional external CC emails
                </span>
              </div>

              {/* Description */}
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Escalation Note / Description
                </label>
                <input
                  type="text"
                  value={rule.description || ""}
                  placeholder="e.g. Tier 2: Escalation to Finance Lead & Sales KAM"
                  onChange={(e) =>
                    handleRuleChange(idx, "description", e.target.value)
                  }
                  className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Step Button */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleAddTier}
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-300 transition"
        >
          <Plus size={14} />
          <span>Add Escalation Tier</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Info size={14} />
          <span>
            If the invoice is paid or settled at any point, escalations stop
            automatically.
          </span>
        </div>
      </div>
    </div>
  );
}
