import SubClientForm from "./SubclientForm";

export default async function NewSubClientPage({ params }) {
  const { id } = await params;

  return <SubClientForm clientId={Number(id)} />;
}
