import { getClientById } from "@/app/actions/client";
import ClientEditForm from "./_components/clientEditForm";
import { notFound } from "next/navigation";

export default async function EditClientPage({ params }) {
  const { id } = await params;

  const client = await getClientById(Number(id));

  if (!client) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-md">
        {/* Form */}
        <ClientEditForm client={client} />
      </div>
    </div>
  );
}
