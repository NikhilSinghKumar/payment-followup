import { getDepartments } from "@/app/actions/department";
import DepartmentManager from "@/app/components/settings/DepartmentManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Departments | Admin | PAFEX",
  description:
    "Manage organization departments for staff allocation and escalation routing.",
};

export default async function DepartmentsPage() {
  const departments = await getDepartments();

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <DepartmentManager departments={departments || []} />
    </div>
  );
}
