import UserForm from "@/app/components/user/UserForm";
import { getCompanies } from "@/app/actions/company";
import { getRoles } from "@/app/actions/role";
import { getDepartments } from "@/app/actions/department";
import { createUser } from "@/app/actions/user";

export const metadata = {
  title: "Create User | PAFEX",
  description:
    "Add a new user and configure their company, department, and role.",
};

export default async function NewUserPage() {
  const companies = await getCompanies({
    activeOnly: true,
  });
  const roles = await getRoles({ activeOnly: true });
  const departments = await getDepartments({ activeOnly: true });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <UserForm
        roles={roles}
        departments={departments}
        mode="create"
        companies={companies}
        action={createUser}
      />
    </div>
  );
}
