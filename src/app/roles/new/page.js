import { getCompanies } from "@/app/actions/company";
import { createRole } from "@/app/actions/role";
import RoleForm from "@/app/components/role/RoleForm";

export default async function NewRoleForm() {
  const companies = await getCompanies({
    activeOnly: true,
  });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <RoleForm
        mode="create"
        companies={companies}
        permissions={[]} // No permissions during create
        initialData={{}}
        action={createRole}
      />
    </div>
  );
}
