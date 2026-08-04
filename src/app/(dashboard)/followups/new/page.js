import FollowupForm from "@/app/components/followup/FollowupForm";
import { getClients } from "@/app/actions/client";

export default async function NewFollowupPage() {
  const clients = await getClients();
  return (
    <div className="space-y-6">
      <FollowupForm clients={clients} />
    </div>
  );
}
