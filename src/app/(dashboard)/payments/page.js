import { getPayments } from "@/app/actions/payment";
import PaymentTable from "@/app/components/payment/PaymentTable";
import PaymentToolbar from "@/app/components/payment/PaymentToolbar";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams?.q || "";
  const date = resolvedParams?.date || "";
  const startDate = resolvedParams?.startDate || "";
  const endDate = resolvedParams?.endDate || "";

  const payments = await getPayments({
    query,
    date,
    startDate,
    endDate,
  });

  const hasFilter = Boolean(query || date || startDate || endDate);

  return (
    <div className="space-y-4">
      {/* Search, Filter & Actions Toolbar */}
      <PaymentToolbar totalCount={payments.length} />

      {/* Payment Table */}
      <PaymentTable payments={payments} hasFilter={hasFilter} />
    </div>
  );
}
