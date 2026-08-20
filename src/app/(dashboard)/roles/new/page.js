import { getCompanies } from "@/app/actions/company";
import { getPermissions } from "@/app/actions/permission";
import { createRole } from "@/app/actions/role";
import RoleForm from "@/app/components/role/RoleForm";

export const metadata = {
  title: "New Role | PAFEX",
  description: "Create a system role and assign module permissions.",
};

export default async function NewRoleForm() {
  const companies = await getCompanies({ activeOnly: true });
  const permissions = await getPermissions();

  return (
    <div className="py-4">
      <RoleForm
        mode="create"
        companies={companies}
        permissions={permissions}
        initialData={{}}
        action={createRole}
      />
    </div>
  );
}
