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

export default async function ClientDetailPage({ params }) {
  const { id } = await params;

  const clientId = Number(id);

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

      awbCount: count(invoiceAwbs.id),

      paidAmount: sql`
        COALESCE(
          SUM(${paymentAllocations.allocatedAmount}),
          0
        )
      `,

      outstandingAmount: sql`
        ${invoices.amount}
        -
        COALESCE(
          SUM(${paymentAllocations.allocatedAmount}),
          0
        )
      `,
    })
    .from(invoices)

    .leftJoin(
      invoiceAwbs,
      and(
        eq(invoiceAwbs.invoiceId, invoices.id),
        isNull(invoiceAwbs.deletedAt),
      ),
    )

    .leftJoin(
      paymentAllocations,
      and(
        eq(paymentAllocations.invoiceId, invoices.id),
        isNull(paymentAllocations.deletedAt),
      ),
    )

    .where(and(eq(invoices.clientId, clientId), isNull(invoices.deletedAt)))

    .groupBy(invoices.id)

    .orderBy(desc(invoices.id));

  // =====================================
  // SUMMARY TOTALS
  // =====================================

  const totalInvoices = invoiceData.length;

  const totalAmount = invoiceData.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const totalOutstanding = invoiceData.reduce(
    (sum, item) => sum + Number(item.outstandingAmount || 0),
    0,
  );

  const overdueInvoices = invoiceData.filter((invoice) => {
    if (!invoice.dueDate) return false;

    return (
      new Date(invoice.dueDate) < new Date() &&
      Number(invoice.outstandingAmount) > 0
    );
  }).length;

  return (
    <div className="min-h-screen p-4 md:p-6">
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

        {/* ===================================== */}
        {/* FILTER BAR */}
        {/* ===================================== */}

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {/* Search */}
            <input placeholder="Search invoice..." className="input-primary" />

            {/* FY */}
            <select className="input-primary">
              <option>All Financial Years</option>
              <option>2025-26</option>
              <option>2024-25</option>
            </select>

            {/* Status */}
            <select className="input-primary">
              <option>All Status</option>
              <option>Pending</option>
              <option>Partial</option>
              <option>Paid</option>
              <option>Disputed</option>
            </select>

            {/* Date */}
            <input type="date" className="input-primary" />
          </div>
        </div>

        {/* ===================================== */}
        {/* INVOICE TABLE */}
        {/* ===================================== */}

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          {/* TABLE HEADER */}
          <div className="grid grid-cols-[1.2fr_120px_90px_120px_120px_120px_120px_100px] gap-3 border-b border-zinc-200 bg-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-600">
            <div>Invoice</div>
            <div>FY</div>
            <div>AWB Count</div>
            <div>Amount</div>
            <div>Paid</div>
            <div>Outstanding</div>
            <div>Due Date</div>
            <div>Status</div>
          </div>

          {/* TABLE BODY */}
          <div>
            {invoiceData.length === 0 ? (
              <div className="p-10 text-center text-sm text-zinc-500">
                No invoices found.
              </div>
            ) : (
              invoiceData.map((invoice) => {
                const outstanding = Number(invoice.outstandingAmount || 0);
                const isOverdue =
                  invoice.dueDate &&
                  new Date(invoice.dueDate) < new Date() &&
                  outstanding > 0;
                return (
                  <Link
                    key={invoice.id}
                    href={`/invoices/${invoice.id}`}
                    className="grid grid-cols-[1.2fr_120px_90px_120px_120px_120px_120px_100px] gap-3 border-b border-zinc-100 px-4 py-3 text-sm transition hover:bg-blue-50/40"
                  >
                    {/* Invoice */}
                    <div>
                      <div className="font-medium text-zinc-800">
                        {invoice.invoiceNumber}
                      </div>
                    </div>

                    {/* FY */}
                    <div className="text-zinc-600">{invoice.financialYear}</div>

                    {/* AWBs */}
                    <div>
                      <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                        {invoice.awbCount}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="font-medium text-zinc-800">
                      ₹{Number(invoice.amount).toLocaleString()}
                    </div>

                    {/* Paid */}
                    <div className="text-emerald-600">
                      ₹{Number(invoice.paidAmount).toLocaleString()}
                    </div>

                    {/* Outstanding */}
                    <div
                      className={
                        outstanding > 0
                          ? "font-medium text-orange-600"
                          : "font-medium text-emerald-600"
                      }
                    >
                      ₹{outstanding.toLocaleString()}
                    </div>

                    {/* Due Date */}
                    <div className="text-zinc-600">
                      {invoice.dueDate
                        ? new Date(invoice.dueDate).toLocaleDateString()
                        : "-"}
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          invoice.status === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : invoice.status === "partial"
                              ? "bg-orange-100 text-orange-700"
                              : invoice.status === "disputed"
                                ? "bg-red-100 text-red-700"
                                : invoice.status === "pending" && isOverdue
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {invoice.status === "pending" && isOverdue
                          ? "overdue"
                          : invoice.status}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
