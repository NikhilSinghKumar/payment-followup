import {
  getInvoiceSummary,
  getInvoiceAwbs,
  getInvoicePayments,
  getInvoiceFollowups,
  getInvoiceActivities,
} from "@/app/actions/invoiceDetail";

import InvoiceSummary from "@/app/components/invoiceDetail/InvoiceSummary";
import InvoiceQuickActions from "@/app/components/invoiceDetail/InvoiceQuickActions";
import InvoiceTabs from "@/app/components/invoiceDetail/InvoiceTabs";

export default async function InvoiceDetailPage({ params }) {
  const { id } = await params;

  const invoiceId = Number(id);

  if (isNaN(invoiceId)) {
    return <div className="p-6 text-red-500">Invalid invoice ID</div>;
  }

  const [summary, awbs, payments, followups, activities] = await Promise.all([
    getInvoiceSummary(invoiceId),
    getInvoiceAwbs(invoiceId),
    getInvoicePayments(invoiceId),
    getInvoiceFollowups(invoiceId),
    getInvoiceActivities(invoiceId),
  ]);

  if (!summary) {
    return <div className="p-6 text-red-500">Invoice not found</div>;
  }

  return (
    <div className="bg-zinc-50 p-2">
      <div className="mx-auto space-y-4">
        {/* SUMMARY */}
        <InvoiceSummary data={summary} />

        {/* QUICK ACTIONS */}
        {/* <InvoiceQuickActions invoiceId={invoiceId} /> */}

        {/* TABS */}
        <InvoiceTabs
          invoice={summary}
          invoiceId={invoiceId}
          awbs={awbs}
          payments={payments}
          followups={followups}
          activities={activities}
        />
      </div>
    </div>
  );
}
