"use client";

import Link from "next/link";
import DeleteSubClientButton from "../../DeleteSubClientButton";
import ImportSubClients from "../../ImportSubClients";

export default function ClientSubClientsTab({
  clientId,
  client,
  subClients = [],
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/clients/${client.id}/sub-clients/new`}
          className="flex justify-center items-center h-9 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium shadow-xs hover:from-blue-500 hover:to-indigo-500 transition"
        >
          + Add Sub Client
        </Link>

        <Link
          href="/api/sub-clients/sample-csv"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          Sample CSV
        </Link>
        <ImportSubClients clientId={clientId} />
        <Link
          href={`/api/sub-clients/export?clientId=${clientId}`}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          Export
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full min-w-[760px] text-xs">
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
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/clients/${client.id}/sub-clients/${subClient.id}/edit`}
                          className="rounded-md border border-blue-200 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                        >
                          Edit
                        </Link>

                        <DeleteSubClientButton
                          clientId={clientId}
                          subClientId={subClient.id}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
