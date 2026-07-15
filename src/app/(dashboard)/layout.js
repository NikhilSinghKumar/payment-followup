import AppLayout from "@/app/components/layout/AppLayout";
import { getCurrentUser } from "@/lib/auth/auth";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();

  return <AppLayout user={user}>{children}</AppLayout>;
}
