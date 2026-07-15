import Link from "next/link";

export default function SettingsTab({ company }) {
  return (
    <div className="space-y-6">
      {/* ====================================== */}
      {/* Edit Company */}
      {/* ====================================== */}

      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold">Company Information</h2>

        <p className="mt-2 text-sm text-slate-500">
          Update the company basic information.
        </p>

        <div className="mt-6">
          <Link
            href={`/companies/${company.id}/edit`}
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Edit Company
          </Link>
        </div>
      </div>

      {/* ====================================== */}
      {/* Danger Zone */}
      {/* ====================================== */}

      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-700">Danger Zone</h2>

        <p className="mt-2 text-sm text-red-600">
          Deactivating or deleting a company may affect all related records.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            disabled
            className="rounded-lg bg-yellow-500 px-5 py-3 text-white opacity-60"
          >
            Deactivate
          </button>

          <button
            disabled
            className="rounded-lg bg-red-600 px-5 py-3 text-white opacity-60"
          >
            Delete Company
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          These actions will be enabled after Edit Company is completed.
        </p>
      </div>
    </div>
  );
}
