import { getClientById } from "@/app/actions/client";
import SubClientForm from "./SubclientForm";

export default async function NewSubClientPage({ params }) {
  const { id } = await params;

  const client = await getClientById(Number(id));

  return <SubClientForm clientId={Number(id)} client={client} />;
}
