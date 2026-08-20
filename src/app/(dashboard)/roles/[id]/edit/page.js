import { notFound } from "next/navigation";
import { getRoleById, updateRole } from "@/app/actions/role";
import { getCompanies } from "@/app/actions/company";
import { getPermissions } from "@/app/actions/permission";
import RoleForm from "@/app/components/role/RoleForm";

export const metadata = {
  title: "Edit Role | PAFEX",
  description: "Update role permissions and configuration.",
};

export default async function EditRolePage({ params }) {
  const resolvedParams = await params;
  const role = await getRoleById(resolvedParams.id);

  if (!role) {
    notFound();
  }

  const companies = await getCompanies({ activeOnly: true });
  const permissions = await getPermissions();

  return (
    <div className="py-4">
      <RoleForm
        mode="edit"
        initialData={role}
        companies={companies}
        permissions={permissions}
        action={updateRole.bind(null, role.id)}
      />
    </div>
  );
}
