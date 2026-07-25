import { notFound } from "next/navigation";

// import { getRoleById, getPermissions, updateRole } from "@/app/actions/role";
import { getRoleById, updateRole } from "@/app/actions/role";
import { getCompanies } from "@/app/actions/company";

import RoleForm from "@/app/components/role/RoleForm";

export default async function EditRolePage({ params }) {
  const { id } = await params;

  // -----------------------------------------
  // Load Role
  // -----------------------------------------

  const role = await getRoleById(id);

  if (!role) {
    notFound();
  }

  // -----------------------------------------
  // Load Companies
  // -----------------------------------------

  const companies = await getCompanies({
    activeOnly: true,
  });

  // -----------------------------------------
  // Load Permissions
  // -----------------------------------------

  // const permissions = await getPermissions();

  return (
    <div className="mx-auto max-w-6xl p-6">
      <RoleForm
        mode="edit"
        initialData={role}
        companies={companies}
        // permissions={permissions}
        action={updateRole.bind(null, role.id)}
      />
    </div>
  );
}
