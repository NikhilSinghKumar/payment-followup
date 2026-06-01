import Link from "next/link";
import { db } from "@/db";
import {
  clients,
  invoices,
  invoiceAwbs,
  paymentAllocations,
} from "@/db/schema";
import { getClientById } from "@/app/actions/client";

import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import ClientTabs from "@/app/components/client/clientTabs";
import ClientOverviewTab from "@/app/components/client/tabs/clientOverviewTab";
import ClientInvoicesTab from "@/app/components/client/tabs/clientInvoicesTab";
import ClientLocationsTab from "@/app/components/client/tabs/clientLocationsTab";
import ClientContactsTab from "@/app/components/client/tabs/clientContactsTab";
import ClientPaymentsTab from "@/app/components/client/tabs/clientPaymentsTab";
import ClientFollowupsTab from "@/app/components/client/tabs/clientFollowupsTab";
import { getClientLocations } from "@/app/actions/clientLocations";

export default async function ClientDetailPage({ params, searchParams }) {
  const { id } = await params;

  const resolvedSearchParams = await searchParams;

  const clientId = Number(id);

  const activeTab = resolvedSearchParams?.tab || "overview";

  const clientLocations = await getClientLocations(clientId);

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

      paidAmount: sql`
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

      amount: invoices.amount,

      status: invoices.status,

      dueDate: invoices.dueDate,

      invoiceFromDate: invoices.invoiceFromDate,

      invoiceToDate: invoices.invoiceToDate,

      awbCount: sql`
      COALESCE(${awbCounts.awbCount}, 0)
    `.mapWith(Number),

      paidAmount: sql`
      COALESCE(${paymentTotals.paidAmount}, 0)
    `.mapWith(Number),
    })

    .from(invoices)

    .leftJoin(awbCounts, eq(awbCounts.invoiceId, invoices.id))

    .leftJoin(paymentTotals, eq(paymentTotals.invoiceId, invoices.id))

    .where(and(eq(invoices.clientId, clientId), isNull(invoices.deletedAt)))

    .orderBy(desc(invoices.id));

  // NORMALIZED INVOIVE DATA
  const normalizedInvoiceData = invoiceData.map((invoice) => {
    const amount = Number(invoice.amount || 0);

    const paidAmount = Number(invoice.paidAmount || 0);

    return {
      ...invoice,

      outstandingAmount: amount - paidAmount,
    };
  });

  // =====================================
  // SUMMARY TOTALS
  // =====================================

  const totalInvoices = normalizedInvoiceData.length;

  const totalAmount = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const totalOutstanding = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.outstandingAmount || 0),
    0,
  );

  const overdueInvoices = normalizedInvoiceData.filter((invoice) => {
    if (!invoice.dueDate) return false;

    return (
      new Date(invoice.dueDate) < new Date() &&
      Number(invoice.outstandingAmount) > 0
    );
  }).length;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 mb-6"></div>
      {/* ===================================== */}
      {/* PAGE WRAPPER */}
      {/* ===================================== */}

      <div className="mx-auto max-w-7xl space-y-4">
        {/* ===================================== */}
        {/* HEADER */}
        {/* ===================================== */}

        <div className="bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {/* LEFT */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-semibold text-white">
                  {client.companyName?.charAt(0)}
                </div>

                <div>
                  <h1 className="text-2xl font-semibold text-zinc-800">
                    {client.companyName}
                  </h1>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                    <span>{client.companyCode}</span>

                    {client.gstNumber && (
                      <>
                        <span>•</span>
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

            {/* ACTIONS */}
            <div className="flex items-center gap-2">
              <Link
                href="/invoices/new"
                className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
              >
                + New Invoice
              </Link>

              <Link
                href="/clients"
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100"
              >
                Back
              </Link>
            </div>
          </div>
        </div>

        {/* ===================================== */}
        {/* SUMMARY CARDS */}
        {/* ===================================== */}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

        {activeTab === "invoices" && (
          <ClientInvoicesTab invoices={normalizedInvoiceData} />
        )}

        {activeTab === "locations" && (
          <ClientLocationsTab clientId={clientId} locations={clientLocations} />
        )}

        {activeTab === "contacts" && <ClientContactsTab contacts={[]} />}

        {activeTab === "payments" && <ClientPaymentsTab payments={[]} />}

        {activeTab === "followups" && <ClientFollowupsTab followups={[]} />}
      </div>
    </div>
  );
}
