import PaymentForm from "@/app/components/payment/PaymentForm";
import { getClients } from "@/app/actions/client";
import { getNotificationSettings } from "@/app/actions/notificationSettings";

export default async function NewPaymentPage() {
  const [clients, settingsData] = await Promise.all([
    getClients(),
    getNotificationSettings(),
  ]);

  return (
    <div className="space-y-6">
      {/* Payment Form */}
      <PaymentForm
        clients={clients}
        notificationSettings={settingsData?.settings || null}
      />
    </div>
  );
}
