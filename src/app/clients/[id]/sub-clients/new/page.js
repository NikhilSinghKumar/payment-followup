import NewSubClientForm from "./NewSubclientForm";

export default async function NewSubClientPage({ params }) {
  const { id } = await params;

  return <NewSubClientForm clientId={Number(id)} />;
}
