"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Plus,
  Save,
  Check,
  AlertCircle,
  Users,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/app/actions/department";

export default function DepartmentManager({ departments = [] }) {
  const [deptList, setDeptList] = useState(departments);
  const [editingDept, setEditingDept] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  function resetForm() {
    setName("");
    setCode("");
    setDescription("");
    setIsActive(true);
    setEditingDept(null);
    setIsCreating(false);
  }

  function startEdit(dept) {
    setEditingDept(dept);
    setName(dept.name || "");
    setCode(dept.code || "");
    setDescription(dept.description || "");
    setIsActive(dept.isActive !== false);
    setIsCreating(false);
  }

  function startCreate() {
    resetForm();
    setIsCreating(true);
  }

  function handleSave(e) {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("code", code);
    formData.append("description", description);
    formData.append("isActive", isActive ? "true" : "false");

    startTransition(async () => {
      let res;
      if (editingDept) {
        res = await updateDepartment(editingDept.id, formData);
      } else {
        res = await createDepartment(formData);
      }

      if (res.success) {
        setFeedback({ type: "success", message: res.message });
        if (editingDept) {
          setDeptList((prev) =>
            prev.map((d) =>
              d.id === editingDept.id
                ? { ...d, name, code, description, isActive }
                : d,
            ),
          );
        } else {
          setDeptList((prev) => [
            ...prev,
            {
              id: Date.now(),
              name,
              code,
              description,
              isActive,
              userCount: 0,
            },
          ]);
        }
        resetForm();
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    });
  }

  function handleDelete(deptId) {
    if (!confirm("Are you sure you want to remove this department?")) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await deleteDepartment(deptId);
      if (res.success) {
        setFeedback({ type: "success", message: res.message });
        setDeptList((prev) => prev.filter((d) => d.id !== deptId));
        if (editingDept?.id === deptId) resetForm();
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Department Management
            </h2>
            <p className="text-xs text-zinc-500">
              Organize company personnel into departments (Finance, Sales,
              Operations, Management) to streamline user management and
              escalation alerts.
            </p>
          </div>
        </div>

        {!isCreating && !editingDept && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus size={14} />
            <span>Add Department</span>
          </button>
        )}
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

      {/* Inline Create/Edit Form */}
      {(isCreating || editingDept) && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 dark:border-blue-900/40 dark:bg-zinc-800/60 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-blue-100 pb-2.5 dark:border-zinc-700">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
              {editingDept
                ? `Edit Department: ${editingDept.name}`
                : "Create New Department"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Department Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Finance & Accounts"
                className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Department Code / Abbreviation
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. FIN, SALES, MGMT"
                className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white px-3 font-mono text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Active Status</span>
              </label>
            </div>

            <div className="sm:col-span-3">
              <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Description & Responsibilities
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Handles accounts receivable, invoice reconciliation, and payment escalation."
                className="h-8.5 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-800 shadow-2xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {isPending ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>
                    {editingDept ? "Update Department" : "Save Department"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Departments Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {deptList.map((dept) => (
          <div
            key={dept.id}
            className={`rounded-2xl border p-4 transition ${
              dept.isActive
                ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                : "border-zinc-200 bg-zinc-50/60 opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  {dept.code || dept.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                    {dept.name}
                  </h3>
                  {dept.code && (
                    <span className="font-mono text-[10px] text-zinc-400">
                      Code: {dept.code}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(dept)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                  title="Edit Department"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(dept.id)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-zinc-800"
                  title="Delete Department"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[32px]">
              {dept.description || "No description provided."}
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2.5 text-xs dark:border-zinc-800">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Users size={13} className="text-blue-500" />
                <span>
                  <strong>{dept.userCount || 0}</strong>{" "}
                  {dept.userCount === 1 ? "member" : "members"}
                </span>
              </div>

              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  dept.isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {dept.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
