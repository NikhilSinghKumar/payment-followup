import { getDashboardData } from "@/app/actions/dashboard/getDashboardData";
import DashboardStats from "@/app/components/dashboard/DashboardStats";

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <div className="space-y-6">
      <DashboardStats summary={dashboard.summary} />
    </div>
  );
}
