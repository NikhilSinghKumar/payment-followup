import { getCompanies } from "@/app/actions/company";
import CompanyTable from "@/app/components/company/CompanyTable";
import Link from "next/link";

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Link
          href="/companies/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Company
        </Link>
      </div>
      <CompanyTable companies={companies} />
    </div>
  );
}
