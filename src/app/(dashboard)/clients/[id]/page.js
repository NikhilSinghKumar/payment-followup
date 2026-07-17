import Link from "next/link";
import { db } from "@/db";
import {
  clients,
  invoices,
  invoiceAwbs,
  paymentAllocations,
} from "@/db/schema";
import { getClientById } from "@/app/actions/client";
import { enrichInvoices } from "@/lib/invoice-summary";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import ClientTabs from "@/app/components/client/clientTabs";
import ClientOverviewTab from "@/app/components/client/tabs/clientOverviewTab";
import ClientSubClientsTab from "@/app/components/client/tabs/clientSubClientsTab";
import ClientInvoicesTab from "@/app/components/client/tabs/clientInvoicesTab";
import ClientLocationsTab from "@/app/components/client/tabs/clientLocationsTab";
import ClientContactsTab from "@/app/components/client/tabs/clientContactsTab";
import ClientPaymentsTab from "@/app/components/client/tabs/clientPaymentsTab";
import ClientFollowupsTab from "@/app/components/client/tabs/clientFollowupsTab";
import { getClientLocationsByClientId } from "@/app/actions/clientLocations";
import { getClientContactsByClientId } from "@/app/actions/clientContacts";
import { getSubClientsByClientId } from "@/app/actions/sub-client";

export default async function ClientDetailPage({ params, searchParams }) {
  const { id } = await params;

  const resolvedSearchParams = await searchParams;

  const clientId = Number(id);
  const contacts = await getClientContactsByClientId(clientId);

  const activeTab = resolvedSearchParams?.tab || "overview";

  const clientLocations = await getClientLocationsByClientId(clientId);
  const subClients = await getSubClientsByClientId(clientId);

  if (isNaN(clientId)) {
    return <div className="p-6 text-red-500">Invalid client ID</div>;
  }

  // =====================================
  // CLIENT
  // =====================================

  const client = await getClientById(clientId);

  if (!client) {
    return <div className="p-6 text-sm text-red-500">Client not found</div>;
  }

  // =====================================
  // INVOICE SUMMARY
  // =====================================
  // =====================================
  // AGGREGATE SUBQUERIES
  // =====================================

  const awbCounts = db
    .select({
      invoiceId: invoiceAwbs.invoiceId,

      awbCount: count(invoiceAwbs.id).as("awb_count"),
    })
    .from(invoiceAwbs)
    .where(isNull(invoiceAwbs.deletedAt))
    .groupBy(invoiceAwbs.invoiceId)
    .as("awb_counts");

  const paymentTotals = db
    .select({
      invoiceId: paymentAllocations.invoiceId,

      paid: sql`
    COALESCE(
      SUM(${paymentAllocations.allocatedAmount}),
      0
    )
  `
        .mapWith(Number)
        .as("paid_amount"),
    })
    .from(paymentAllocations)
    .where(isNull(paymentAllocations.deletedAt))
    .groupBy(paymentAllocations.invoiceId)
    .as("payment_totals");

  // =====================================
  // INVOICE SUMMARY
  // =====================================

  const invoiceData = await db
    .select({
      id: invoices.id,

      financialYear: invoices.financialYear,

      invoiceNumber: invoices.invoiceNumber,

      invoiceAmount: invoices.invoiceAmount,

      netPayableAmount: invoices.netPayableAmount,

      status: invoices.status,

      dueDate: invoices.dueDate,

      awbCount: sql`
      COALESCE(${awbCounts.awbCount}, 0)
    `.mapWith(Number),

      paid: sql`
      COALESCE(${paymentTotals.paid}, 0)
    `.mapWith(Number),
    })

    .from(invoices)

    .leftJoin(awbCounts, eq(awbCounts.invoiceId, invoices.id))

    .leftJoin(paymentTotals, eq(paymentTotals.invoiceId, invoices.id))

    .where(and(eq(invoices.clientId, clientId), isNull(invoices.deletedAt)))

    .orderBy(desc(invoices.id));

  // NORMALIZED INVOIVE DATA
  const normalizedInvoiceData = enrichInvoices(invoiceData);

  // =====================================
  // SUMMARY TOTALS
  // =====================================

  const totalInvoices = normalizedInvoiceData.length;

  const totalAmount = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.invoiceAmount || 0),
    0,
  );

  const totalOutstanding = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.due || 0),
    0,
  );

  const overdueInvoices = normalizedInvoiceData.filter(
    (invoice) => invoice.isOverdue,
  ).length;

  const totalNetPayable = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.netPayableAmount || 0),
    0,
  );

  const totalPaid = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.paid || 0),
    0,
  );

  return (
    <div className="bg-zinc-50">
      {/* ===================================== */}
      {/* PAGE WRAPPER */}
      {/* ===================================== */}

      <div className="mx-auto max-w-7xl p-2 space-y-4">
        {/* ===================================== */}
        {/* HEADER */}
        {/* ===================================== */}

        <div className="">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {/* LEFT */}
            <div>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-zinc-800">
                    {client.companyName}
                  </h1>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                    <span>{client.companyCode}</span>

                    {client.gstNumber && (
                      <>
                        <span className="text-pink-500 text-xl">•</span>
                        <span>{client.gstNumber}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {client.address && (
                <p className="mt-3 max-w-2xl text-sm text-zinc-500">
                  {client.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ===================================== */}
        {/* SUMMARY CARDS */}
        {/* ===================================== */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {/* Total Invoices */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Total Invoices
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-zinc-800">
              {totalInvoices}
            </h2>
          </div>

          {/* Invoice Amount */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Invoice Amount
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-zinc-800">
              ₹{totalAmount.toLocaleString()}
            </h2>
          </div>

          {/* Net Payable */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Net Payable
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-blue-600">
              ₹{totalNetPayable.toLocaleString("en-IN")}
            </h2>
          </div>

          {/* Total Paid */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Total Paid
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-emerald-500">
              ₹{totalPaid.toLocaleString("en-IN")}
            </h2>
          </div>

          {/* Outstanding */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Outstanding
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-orange-600">
              ₹{totalOutstanding.toLocaleString()}
            </h2>
          </div>

          {/* Overdue */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Overdue Invoices
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-red-500">
              {overdueInvoices}
            </h2>
          </div>
        </div>

        <ClientTabs clientId={clientId} activeTab={activeTab} />

        {/* ===================================== */}
        {/* TAB CONTENT */}
        {/* ===================================== */}

        {activeTab === "overview" && (
          <ClientOverviewTab client={client} invoices={normalizedInvoiceData} />
        )}

        {activeTab === "sub-clients" && (
          <ClientSubClientsTab
            client={client}
            clientId={clientId}
            subClients={subClients}
          />
        )}

        {activeTab === "invoices" && (
          <ClientInvoicesTab
            clientId={clientId}
            invoices={normalizedInvoiceData}
          />
        )}

        {activeTab === "locations" && (
          <ClientLocationsTab clientId={clientId} locations={clientLocations} />
        )}

        {activeTab === "contacts" && (
          <ClientContactsTab clientId={clientId} contacts={contacts} />
        )}

        {activeTab === "payments" && <ClientPaymentsTab payments={[]} />}

        {activeTab === "followups" && <ClientFollowupsTab followups={[]} />}
      </div>
    </div>
  );
}
