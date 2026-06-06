import type { AccessRequestRecord, AccessRequestStatus } from "@/lib/content-types";
import { createClient } from "@/lib/supabase/server";

export async function getAccessRequests(filters?: { status?: string }) {
  const supabase = await createClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("access_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getAccessRequests failed", { code: error.code, message: error.message });
    return [];
  }

  const statusOrder: Record<AccessRequestStatus, number> = {
    pending: 0,
    approved: 1,
    rejected: 2
  };

  return ((data ?? []) as AccessRequestRecord[]).sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];

    if (statusDiff !== 0) {
      return statusDiff;
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function getAccessRequestById(id: string) {
  const supabase = await createClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("access_requests").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getAccessRequestById failed", { code: error.code, message: error.message });
    return null;
  }

  return data as AccessRequestRecord | null;
}

export async function countPendingAccessRequests() {
  const supabase = await createClient();

  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("access_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending" satisfies AccessRequestStatus);

  if (error) {
    console.error("countPendingAccessRequests failed", { code: error.code, message: error.message });
    return 0;
  }

  return count ?? 0;
}
