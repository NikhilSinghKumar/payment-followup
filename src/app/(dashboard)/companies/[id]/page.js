import {
  getCompanySummary,
  getCompanyClients,
  getCompanyUsers,
} from "@/app/actions/companyDetail";

import CompanySummary from "@/app/components/companyDetail/CompanySummary";

import OverviewTab from "@/app/components/companyDetail/OverviewTab";
import UsersTab from "@/app/components/companyDetail/UsersTab";
import ClientsTab from "@/app/components/companyDetail/ClientsTab";
import SettingsTab from "@/app/components/companyDetail/SettingsTab";

export default async function CompanyDetailPage({ params, searchParams }) {
  const { id } = await params;

  const tab = (await searchParams).tab || "overview";

  const company = await getCompanySummary(id);

  const clients = await getCompanyClients(id);

  const users = await getCompanyUsers(id);

  let content;

  switch (tab) {
    // case "users":
    //   content = <UsersTab company={company} users={users} />;
    //   break;

    // case "clients":
    //   content = <ClientsTab company={company} clients={clients} />;
    //   break;

    // case "settings":
    //   content = <SettingsTab company={company} />;
    //   break;

    default:
      content = <OverviewTab company={company} />;
  }

  return (
    <div className="space-y-6">
      <CompanySummary company={company} />

      {content}
    </div>
  );
}
