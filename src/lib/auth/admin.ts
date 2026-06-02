import { createClient } from "@/lib/supabase/server";

export async function getAdminClient() {
  const supabase = await createClient();

  if (!supabase) {
    return { supabase: null, isAdmin: false, actorId: null, error: "Supabase 尚未配置。" };
  }

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    return { supabase, isAdmin: false, actorId: null, error: "请先登录管理员账号。" };
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

  if (adminError || !isAdmin) {
    return { supabase, isAdmin: false, actorId: claimsData.claims.sub ?? null, error: "当前账号没有管理员权限。" };
  }

  return { supabase, isAdmin: true, actorId: claimsData.claims.sub ?? null, error: null };
}

export async function writeActivityLog({
  action,
  entityType,
  entityId,
  metadata
}: {
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { supabase, isAdmin, actorId } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return;
  }

  const { error } = await supabase.from("activity_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata: metadata ?? {}
  });

  if (error) {
    console.error("activity_logs insert failed", {
      action,
      entityType,
      code: error.code,
      message: error.message
    });
  }
}
