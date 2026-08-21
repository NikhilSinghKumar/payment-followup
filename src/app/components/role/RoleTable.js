import Link from "next/link";

export default function RoleTable({ roles }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto [scrollbar-width:thin]">
        <table className="w-full min-w-[600px]">
          {/* ===================================== */}
          {/* HEADER */}
          {/* ===================================== */}

          <thead className="bg-slate-50">
            <tr className="text-sm font-semibold text-slate-700">
              <th className="px-4 py-3 text-left">Role</th>

              <th className="px-4 py-3 text-left">Company</th>

              {/* <th className="px-4 py-3 text-left">Description</th> */}

              <th className="px-4 py-3 text-center">System</th>

              {/* <th className="px-4 py-3 text-center">Status</th> */}

              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          {/* ===================================== */}
          {/* BODY */}
          {/* ===================================== */}

          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  No roles found.
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  {/* Role */}

                  <td className="px-4 py-3 font-medium text-slate-900">
                    {role.roleName}
                  </td>

                  {/* Company */}

                  <td className="px-4 py-3">{role.companyName}</td>

                  {/* Description */}
                  {/* 
                <td className="px-4 py-3 text-slate-600">
                  {role.description || "-"}
                </td> */}

                  {/* System */}

                  {/* <td className="px-4 py-3 text-center">
                  {role.isSystem ? (
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                      Yes
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      No
                    </span>
                  )}
                </td> */}

                  {/* Status */}

                  <td className="px-4 py-3 text-center">
                    {role.isActive ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Actions */}

                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-3">
                      <Link
                        href={`/roles/${role.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View
                      </Link>

                      <Link
                        href={`/roles/${role.id}/edit`}
                        className="text-sm text-amber-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
