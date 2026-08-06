import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth";

export default async function Home() {
  const currentUser = await getCurrentUser();

  // Already logged in
  if (currentUser?.user) {
    redirect("/dashboard");
  }

  // Not logged in
  redirect("/login");
}
