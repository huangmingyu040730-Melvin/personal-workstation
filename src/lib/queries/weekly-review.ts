import { createClient } from "@/lib/supabase/server";
import { emptyWeeklyReview, loadWeeklyReview } from "@/lib/workstation/weekly-review";

export async function getDashboardWeeklyReview() {
  const supabase = await createClient();

  if (!supabase) {
    return emptyWeeklyReview();
  }

  const result = await loadWeeklyReview(supabase);

  if (!result.ok) {
    console.error("getDashboardWeeklyReview failed", { code: result.error.code, message: result.error.message });
    return emptyWeeklyReview();
  }

  return result.data;
}
