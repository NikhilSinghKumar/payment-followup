import Link from "next/link";

export default function CompanySummary({ company }) {
  return (
    <div className="space-y-5">
      {/* ====================================== */}
      {/* HEADER */}
      {/* ====================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          {/* LEFT */}

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white">
                {company.companyName?.charAt(0)}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {company.companyName}
                </h1>

                <p className="text-sm text-slate-500">{company.companyCode}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-sm text-slate-600">
              <div>
                <span className="font-medium">GST :</span>{" "}
                {company.gstNumber || "-"}
              </div>

              <div>
                <span className="font-medium">Email :</span>{" "}
                {company.email || "-"}
              </div>

              <div>
                <span className="font-medium">Phone :</span>{" "}
                {company.phone || "-"}
              </div>
            </div>
          </div>

          {/* RIGHT */}

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border p-4">
              <div className="text-2xl font-bold text-blue-600">
                {company.totalUsers}
              </div>

              <div className="text-xs text-slate-500">Users</div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-2xl font-bold text-emerald-600">
                {company.totalClients}
              </div>

              <div className="text-xs text-slate-500">Clients</div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-2xl font-bold text-violet-600">
                {company.totalInvoices}
              </div>

              <div className="text-xs text-slate-500">Invoices</div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="text-2xl font-bold text-orange-600">
                {company.totalPayments}
              </div>

              <div className="text-xs text-slate-500">Payments</div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================== */}
      {/* TABS */}
      {/* ====================================== */}

      <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-2">
        <Link
          href={`?tab=overview`}
          className="rounded-lg px-4 py-2 text-sm hover:bg-slate-100"
        >
          Overview
        </Link>

        <Link
          href={`?tab=users`}
          className="rounded-lg px-4 py-2 text-sm hover:bg-slate-100"
        >
          Users
        </Link>

        <Link
          href={`?tab=clients`}
          className="rounded-lg px-4 py-2 text-sm hover:bg-slate-100"
        >
          Clients
        </Link>

        <Link
          href={`?tab=settings`}
          className="rounded-lg px-4 py-2 text-sm hover:bg-slate-100"
        >
          Settings
        </Link>
      </div>
    </div>
  );
}
