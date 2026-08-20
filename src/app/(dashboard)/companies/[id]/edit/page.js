import { getCompanyById } from "@/app/actions/company";
import CompanyForm from "@/app/components/company/CompanyForm";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Company | PAFEX",
  description: "Edit company entity and bank details.",
};

export default async function EditCompanyPage({ params }) {
  const resolvedParams = await params;
  const company = await getCompanyById(resolvedParams.id);

  if (!company) {
    notFound();
  }

  return (
    <div className="py-4">
      <CompanyForm mode="edit" initialData={company} />
    </div>
  );
}
