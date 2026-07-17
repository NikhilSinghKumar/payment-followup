import AppLayout from "@/app/components/layout/AppLayout";
import { getCurrentUser } from "@/lib/auth/auth";

export default async function DashboardLayout({ children }) {
  const auth = await getCurrentUser();

  return <AppLayout user={auth.user}>{children}</AppLayout>;
}
