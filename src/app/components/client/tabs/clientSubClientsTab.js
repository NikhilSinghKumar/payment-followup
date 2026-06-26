"use client";

import Link from "next/link";

export default function ClientSubClientsTab({ client, subClients = [] }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-800">Sub Clients</h3>
          <p className="text-sm text-zinc-500">
            Manage sub clients under parent clients
          </p>
        </div>

        <Link
          href={`/clients/${client.id}/sub-clients/new`}
          className="flex justify-center items-center h-10 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium shadow hover:shadow-lg transition"
        >
          + Add Sub Client
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-100 text-zinc-700">
            <tr>
              <th className="px-4 py-3 text-left">S.N.</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Company Code</th>
              <th className="px-4 py-3 text-left">GST Number</th>
              <th className="px-4 py-3 text-center">TDS</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {subClients.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-zinc-500"
                >
                  No sub clients found.
                </td>
              </tr>
            ) : (
              subClients.map((subClient, index) => (
                <tr key={subClient.id} className="border-t hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium">{index + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {subClient.companyName}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {subClient.companyCode}
                  </td>

                  <td className="px-4 py-3">{subClient.gstNumber || "-"}</td>

                  <td className="px-4 py-3 text-center">
                    {subClient.tdsApplicable ? (
                      <span className="text-green-600 font-medium">Yes</span>
                    ) : (
                      <span className="text-zinc-400">No</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {subClient.isActive ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/clients/${client.id}/sub-clients/${subClient.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>

                      <button
                        className="text-red-600 hover:underline"
                        disabled
                        title="Coming soon"
                      >
                        Delete
                      </button>
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
