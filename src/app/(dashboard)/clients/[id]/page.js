import Link from "next/link";
import { db } from "@/db";
import {
  clients,
  invoices,
  invoiceAwbs,
  payments,
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
import SendClientReminderModal from "@/app/components/reminder/SendClientReminderModal";
import OpeningBalanceModal from "@/app/components/client/OpeningBalanceModal";
import { getOpeningBalanceByClientId } from "@/app/actions/openingBalance";
import { getClientLocationsByClientId } from "@/app/actions/clientLocations";
import { getClientContactsByClientId } from "@/app/actions/clientContacts";
import { getSubClientsByClientId } from "@/app/actions/sub-client";
import { getFollowupsByClient } from "@/app/actions/followup";
import { getPaymentsByClient } from "@/app/actions/payment";

export default async function ClientDetailPage({ params, searchParams }) {
  const { id } = await params;

  const resolvedSearchParams = await searchParams;

  const clientId = Number(id);
  const contacts = await getClientContactsByClientId(clientId);

  const activeTab = resolvedSearchParams?.tab || "overview";

  let clientFollowups = [];
  let clientPayments = [];

  if (activeTab === "followups") {
    clientFollowups = await getFollowupsByClient(clientId);
  }

  if (activeTab === "payments") {
    clientPayments = await getPaymentsByClient(clientId);
  }

  const clientLocations = await getClientLocationsByClientId(clientId);
  const subClients = await getSubClientsByClientId(clientId);
  const openingBalanceRecord = await getOpeningBalanceByClientId(clientId);

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

      paidAmount: invoices.paidAmount,
      outstandingAmount: invoices.outstandingAmount,

      status: invoices.status,

      dueDate: invoices.dueDate,
      isOpeningBalance: invoices.isOpeningBalance,

      awbCount: sql`
      COALESCE(${awbCounts.awbCount}, 0)
    `.mapWith(Number),
    })

    .from(invoices)

    .leftJoin(awbCounts, eq(awbCounts.invoiceId, invoices.id))

    .where(and(eq(invoices.clientId, clientId), isNull(invoices.deletedAt)))

    .orderBy(desc(invoices.id));

  // NORMALIZED INVOIVE DATA
  const normalizedInvoiceData = enrichInvoices(invoiceData);

  // =====================================
  // CLIENT PAYMENT SUMMARY
  // =====================================

  const paymentSummary = await db
    .select({
      paymentsReceived: sql`
      COALESCE(
        SUM(${payments.amount}),
        0
      )
    `.mapWith(Number),
    })
    .from(payments)
    .where(
      and(
        eq(payments.clientId, clientId),
        isNull(payments.deletedAt),
        eq(payments.isVoided, false),
      ),
    );

  const paymentsReceived = Number(paymentSummary[0]?.paymentsReceived || 0);

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

  const totalAllocated = normalizedInvoiceData.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0),
    0,
  );

  // Unallocated payment funds currently held on account
  const onAccountAmount = Math.max(paymentsReceived - totalAllocated, 0);

  // Net Outstanding = Net Payable - Payments Received
  const netOutstanding = Math.max(totalNetPayable - paymentsReceived, 0);

  // True Credit Balance = Only when client payments received exceed total net payable
  const creditBalance = Math.max(paymentsReceived - totalNetPayable, 0);

  return (
    <div className="bg-zinc-50">
      {/* ===================================== */}
      {/* PAGE WRAPPER */}
      {/* ===================================== */}

      <div className="mx-auto max-w-7xl p-2 space-y-4">
        {/* ===================================== */}
        {/* HEADER */}
        {/* ===================================== */}

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            {/* LEFT */}
            <div>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
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

            {/* RIGHT ACTIONS */}
            <div className="flex flex-wrap items-center gap-2">
              <OpeningBalanceModal
                clientId={client.id}
                clientName={client.companyName}
                existingOpeningBalance={openingBalanceRecord}
              />
              <SendClientReminderModal
                clientId={client.id}
                clientName={client.companyName}
              />
              <Link
                href={`/clients/${client.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <span>Edit Client</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ===================================== */}
        {/* SUMMARY CARDS */}
        {/* ===================================== */}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {/* Total Invoices */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Total Invoices
            </p>

            <h2 className="mt-2 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              {totalInvoices}
            </h2>
            <p className="mt-1 text-[10px] text-zinc-400">Total count</p>
          </div>

          {/* Invoice Amount */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Invoice Amount
            </p>

            <h2 className="mt-2 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              ₹{totalAmount.toLocaleString("en-IN")}
            </h2>
            <p className="mt-1 text-[10px] text-zinc-400">Gross billed</p>
          </div>

          {/* Net Payable */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Net Payable
            </p>

            <h2 className="mt-2 text-xl font-semibold text-blue-600 dark:text-blue-400">
              ₹{totalNetPayable.toLocaleString("en-IN")}
            </h2>
            <p className="mt-1 text-[10px] text-zinc-400">
              After TDS & discounts
            </p>
          </div>

          {/* Payments Received */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Received
            </p>

            <h2 className="mt-2 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
              ₹{paymentsReceived.toLocaleString("en-IN")}
            </h2>
            <p className="mt-1 text-[10px] text-zinc-400">Total collected</p>
          </div>

          {/* On Account (Unallocated Payment) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              On Account
            </p>

            <h2
              className={`mt-2 text-xl font-semibold ${
                onAccountAmount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              ₹{onAccountAmount.toLocaleString("en-IN")}
            </h2>
            <p className="mt-1 text-[10px] text-zinc-400">Unallocated funds</p>
          </div>

          {/* Net Outstanding (Net Payable - Payments Received) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Outstanding
            </p>

            <h2
              className={`mt-2 text-xl font-semibold ${
                netOutstanding > 0
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              ₹{netOutstanding.toLocaleString("en-IN")}
            </h2>
            <p className="mt-1 text-[10px] text-zinc-400">
              Net Payable - Received
            </p>
          </div>

          {/* Credit Balance (Only if Payments Received > Net Payable) */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Credit Balance
            </p>

            <h2
              className={`mt-2 text-xl font-semibold ${
                creditBalance > 0
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              ₹{creditBalance.toLocaleString("en-IN")}
            </h2>
            <p className="mt-1 text-[10px] text-zinc-400">
              {creditBalance > 0 ? "Advance surplus" : "Overpayment only"}
            </p>
          </div>

          {/* Overdue */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Overdue
            </p>

            <h2 className="mt-2 text-xl font-semibold text-red-500">
              {overdueInvoices}
            </h2>
            <p className="mt-1 text-[10px] text-zinc-400">Past due invoices</p>
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

        {activeTab === "payments" && (
          <ClientPaymentsTab clientId={clientId} payments={clientPayments} />
        )}

        {activeTab === "followups" && (
          <ClientFollowupsTab clientId={clientId} followups={clientFollowups} />
        )}
      </div>
    </div>
  );
}
