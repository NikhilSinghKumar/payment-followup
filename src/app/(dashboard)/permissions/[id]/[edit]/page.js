import { notFound } from "next/navigation";
import { getPermissionById } from "@/app/actions/permission";
import PermissionForm from "@/app/components/permission/PermissionForm";

export const metadata = {
  title: "Edit Permission | PAFEX",
  description: "Update permission properties.",
};

export default async function EditPermissionPage({ params }) {
  const resolvedParams = await params;
  const permission = await getPermissionById(resolvedParams.id);

  if (!permission) {
    notFound();
  }

  return (
    <div className="py-4">
      <PermissionForm mode="edit" initialData={permission} />
    </div>
  );
}
