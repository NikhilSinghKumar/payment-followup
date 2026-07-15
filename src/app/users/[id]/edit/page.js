import { notFound } from "next/navigation";

import UserForm from "@/app/components/user/UserForm";

import { getUserById, updateUser } from "@/app/actions/user";

import { getCompanies } from "@/app/actions/company";
import { getRoles } from "@/app/actions/role";

export default async function EditUserPage({ params }) {
  const { id } = await params;

  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  const companies = await getCompanies({
    activeOnly: true,
  });

  const roles = await getRoles({ activeOnly: true });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <UserForm
        mode="edit"
        initialData={user}
        companies={companies}
        roles={roles}
        action={updateUser.bind(null, user.id)}
      />
    </div>
  );
}
