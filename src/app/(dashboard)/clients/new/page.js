import NewClientForm from "@/app/components/client/NewClientForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Add New Client | PAFEX",
  description: "Create a new client record with billing and TDS preferences.",
};

export default function NewClientPage() {
  return <NewClientForm />;
}
