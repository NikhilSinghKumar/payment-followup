import { notFound } from "next/navigation";
import UserForm from "@/app/components/user/UserForm";
import { getUserById, updateUser } from "@/app/actions/user";
import { getCompanies } from "@/app/actions/company";
import { getRoles } from "@/app/actions/role";
import { getDepartments } from "@/app/actions/department";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const user = await getUserById(resolvedParams.id);
  if (!user) return { title: "Edit User | PAFEX" };
  return {
    title: `Edit ${user.firstName} ${user.lastName || ""} | PAFEX`,
  };
}

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
  const departments = await getDepartments({ activeOnly: true });

  return (
    <div className="mx-auto max-w-5xl p-6">
      <UserForm
        mode="edit"
        initialData={user}
        companies={companies}
        departments={departments}
        roles={roles}
        action={updateUser.bind(null, user.id)}
      />
    </div>
  );
}
