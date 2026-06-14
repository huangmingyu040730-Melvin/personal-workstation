"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import type { AccessGrantContentType } from "@/lib/content-types";
import { encodeFormError, getOptionalString, getString } from "@/lib/forms";
import { getGrantTarget } from "@/lib/queries/access-grants";
import { accessGrantSchema, revokeAccessGrantSchema } from "@/lib/validations/access-grant";

function grantErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function parseExpiresAt(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "invalid";
  }

  // Store grants as UTC/ISO; display conversion stays in src/lib/format.ts.
  return parsed.toISOString();
}

function payloadFromForm(formData: FormData) {
  return accessGrantSchema.safeParse({
    grantee_email: getString(formData, "grantee_email"),
    content_type: getString(formData, "content_type"),
    content_id: getString(formData, "content_id"),
    expires_at: getOptionalString(formData, "expires_at"),
    admin_note: getOptionalString(formData, "admin_note"),
    request_id: getOptionalString(formData, "request_id")
  });
}

export async function createAccessGrantAction(formData: FormData) {
  const formPath = "/dashboard/access-grants/new";
  const parsed = payloadFromForm(formData);

  if (!parsed.success) {
    grantErrorRedirect(formPath, parsed.error.issues[0]?.message ?? "请检查授权表单。");
  }

  const expiresAt = parseExpiresAt(parsed.data.expires_at);

  if (expiresAt === "invalid") {
    grantErrorRedirect(formPath, "授权有效期格式不正确。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    grantErrorRedirect(formPath, error ?? "当前账号没有管理员权限。");
  }

  const target = await getGrantTarget(parsed.data.content_type as AccessGrantContentType, parsed.data.content_id);

  if (!target) {
    grantErrorRedirect(formPath, "未找到要授权的内容，请确认内容类型与具体内容匹配。");
  }

  if (target.visibility !== "restricted") {
    grantErrorRedirect(formPath, "只能为授权可见（restricted）的内容创建外部访问授权。");
  }

  const { data, error: insertError } = await supabase
    .from("content_access_grants")
    .insert({
      grantee_email: parsed.data.grantee_email.toLowerCase(),
      content_type: parsed.data.content_type,
      content_id: parsed.data.content_id,
      status: "active",
      expires_at: expiresAt,
      admin_note: parsed.data.admin_note
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("createAccessGrantAction failed", { code: insertError.code, message: insertError.message });

    if (insertError.code === "23505") {
      grantErrorRedirect(formPath, "该邮箱已经拥有这条内容的有效授权。");
    }

    grantErrorRedirect(formPath, "创建授权失败，请稍后重试。");
  }

  await writeActivityLog({
    action: "access_grant.create",
    entityType: "content_access_grant",
    entityId: data.id,
    metadata: {
      content_type: data.content_type,
      content_title: target.title,
      status: data.status,
      expires_at: data.expires_at
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/access-grants");
  revalidatePath(target.href);
  redirect("/dashboard/access-grants");
}

export async function revokeAccessGrantAction(id: string) {
  const listPath = "/dashboard/access-grants";
  const parsed = revokeAccessGrantSchema.safeParse({ id });

  if (!parsed.success) {
    grantErrorRedirect(listPath, parsed.error.issues[0]?.message ?? "授权记录无效。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    grantErrorRedirect(listPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase
    .from("content_access_grants")
    .update({ status: "revoked" })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) {
    console.error("revokeAccessGrantAction failed", { code: updateError.code, message: updateError.message });
    grantErrorRedirect(listPath, "撤销授权失败，请稍后重试。");
  }

  const target = await getGrantTarget(data.content_type as AccessGrantContentType, data.content_id);

  await writeActivityLog({
    action: "access_grant.revoke",
    entityType: "content_access_grant",
    entityId: data.id,
    metadata: {
      content_type: data.content_type,
      content_title: target?.title ?? "未知内容",
      status: data.status
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/access-grants");
  revalidatePath(`/dashboard/access-grants/${id}`);
  if (target?.href) {
    revalidatePath(target.href);
  }
  redirect(listPath);
}
