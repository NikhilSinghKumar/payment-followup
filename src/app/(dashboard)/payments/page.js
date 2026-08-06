import Link from "next/link";
import { Plus } from "lucide-react";

import { getPayments } from "@/app/actions/payment";
import PaymentTable from "@/app/components/payment/PaymentTable";
import ImportPayments from "@/app/components/payment/ImportPayments";

export default async function PaymentsPage() {
  const payments = await getPayments();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 justify-end">
        <Link
          href="/api/import-payments-sample"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Sample CSV
        </Link>
        <ImportPayments />
        <Link
          href="/payments/new"
          className="
            inline-flex h-10 items-center gap-2
            rounded-lg bg-blue-600 px-4
            text-sm font-medium text-white
            shadow-sm transition
            hover:bg-blue-700
          "
        >
          <Plus size={16} />
          Add Payment
        </Link>
      </div>

      {/* Payment Table */}
      <PaymentTable payments={payments} />
    </div>
  );
}
