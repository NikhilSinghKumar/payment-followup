export default function OverviewTab({ company }) {
  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  return (
    <div className="space-y-6">
      {/* ===================================== */}
      {/* TOP */}
      {/* ===================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company */}

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-5 text-lg font-semibold">Company Information</h2>

          <div className="space-y-4 text-sm">
            <Info label="Company Name" value={company.companyName} />

            <Info label="Company Code" value={company.companyCode} />

            <Info label="GST Number" value={company.gstNumber} />

            <Info
              label="Status"
              value={company.isActive ? "Active" : "Inactive"}
            />

            <Info label="Created" value={formatDate(company.createdAt)} />
          </div>
        </div>

        {/* Contact */}

        <div className="rounded-xl border bg-white p-5">
          <h2 className="mb-5 text-lg font-semibold">Contact Information</h2>

          <div className="space-y-4 text-sm">
            <Info label="Email" value={company.email} />

            <Info label="Phone" value={company.phone} />

            <Info label="Address" value={company.address} />

            <Info label="City" value={company.city} />

            <Info label="State" value={company.state} />

            <Info label="Country" value={company.country} />
          </div>
        </div>
      </div>

      {/* ===================================== */}
      {/* Statistics */}
      {/* ===================================== */}

      <div className="rounded-xl border bg-white p-5">
        <h2 className="mb-5 text-lg font-semibold">Statistics</h2>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Users" value={company.totalUsers} />

          <Stat label="Clients" value={company.totalClients} />

          <Stat label="Invoices" value={company.totalInvoices} />

          <Stat label="Payments" value={company.totalPayments} />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>

      <span className="font-medium text-right">{value || "-"}</span>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border p-5 text-center">
      <div className="text-2xl font-bold">{value}</div>

      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}
