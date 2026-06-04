import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/auth/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return children;
  }

  const { isAdmin } = await getAdminClient();

  if (!isAdmin) {
    redirect("/login?next=/dashboard");
  }

  return children;
}
