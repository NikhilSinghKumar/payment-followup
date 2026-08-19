import FollowupForm from "@/app/components/followup/FollowupForm";
import { getClients } from "@/app/actions/client";

export default async function NewFollowupPage() {
  const clients = await getClients();
  return (
    <div className="w-full py-1">
      <FollowupForm clients={clients} />
    </div>
  );
}
