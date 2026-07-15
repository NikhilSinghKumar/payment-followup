import UserForm from "@/app/components/user/UserForm";

import { getCompanies } from "@/app/actions/company";
import { getRoles } from "@/app/actions/role";
import { createUser } from "@/app/actions/user";

export default async function NewUserPage() {
  const companies = await getCompanies({
    activeOnly: true,
  });
  const roles = await getRoles({ activeOnly: true });
  return (
    <div className="mx-auto max-w-5xl p-6">
      <UserForm
        roles={roles}
        mode="create"
        companies={companies}
        action={createUser}
      />
    </div>
  );
}
