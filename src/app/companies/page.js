import { getCompanies } from "@/app/actions/company";
import CompanyTable from "@/app/components/company/CompanyTable";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-6">
      <CompanyTable companies={companies} />
    </div>
  );
}
