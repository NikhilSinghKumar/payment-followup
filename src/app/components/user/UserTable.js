import Link from "next/link";

export default function UserTable({ users }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Company</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Mobile</th>
            <th className="px-4 py-3 text-left">Designation</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-10 text-center text-slate-500">
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="border-t border-slate-200">
                <td className="px-4 py-3">
                  {user.firstName} {user.lastName}
                </td>

                <td className="px-4 py-3">{user.companyName}</td>

                <td className="px-4 py-3">{user.email}</td>

                <td className="px-4 py-3">{user.mobile || "-"}</td>

                <td className="px-4 py-3">{user.designation || "-"}</td>

                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      user.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <Link
                      href={`/users/${user.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>

                    <Link
                      href={`/users/${user.id}/edit`}
                      className="text-amber-600 hover:underline"
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
  );
}
