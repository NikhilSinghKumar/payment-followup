import FollowupForm from "@/app/components/followup/FollowupForm";
import { getClients } from "@/app/actions/client";

export default async function NewFollowupPage() {
  const clients = await getClients();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Follow-up</h1>
        <p className="text-sm text-gray-500">
          Create a payment follow-up for an invoice.
        </p>
      </div>

      <FollowupForm clients={clients} />
    </div>
  );
}
