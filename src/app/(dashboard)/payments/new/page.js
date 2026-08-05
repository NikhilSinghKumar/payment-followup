import PaymentForm from "@/app/components/payment/PaymentForm";
import { getClients } from "@/app/actions/client";

export default async function NewPaymentPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      {/* Payment Form */}
      <PaymentForm clients={clients} />
    </div>
  );
}
