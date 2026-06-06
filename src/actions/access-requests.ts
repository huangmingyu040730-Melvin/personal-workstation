"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getOptionalString, getString } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { reviewAccessRequestSchema, submitAccessRequestSchema } from "@/lib/validations/access-request";

function accessRequestErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function submitPayloadFromForm(formData: FormData) {
  return submitAccessRequestSchema.safeParse({
    requester_name: getString(formData, "requester_name"),
    requester_email: getString(formData, "requester_email"),
    organization: getOptionalString(formData, "organization"),
    requested_content_type: getOptionalString(formData, "requested_content_type"),
    requested_content_title: getOptionalString(formData, "requested_content_title"),
    requested_content_url: getOptionalString(formData, "requested_content_url"),
    reason: getString(formData, "reason")
  });
}

function reviewPayloadFromForm(formData: FormData) {
  return reviewAccessRequestSchema.safeParse({
    status: getString(formData, "status"),
    admin_note: getOptionalString(formData, "admin_note")
  });
}

export async function submitAccessRequestAction(formData: FormData) {
  const parsed = submitPayloadFromForm(formData);

  if (!parsed.success) {
    accessRequestErrorRedirect("/access-request", parsed.error.issues[0]?.message ?? "请检查访问申请表单。");
  }

  const supabase = await createClient();

  if (!supabase) {
    accessRequestErrorRedirect("/access-request", "当前暂时无法提交申请，请稍后再试。");
  }

  const { error } = await supabase.from("access_requests").insert({
    ...parsed.data,
    status: "pending",
    admin_note: null,
    reviewed_at: null
  });

  if (error) {
    console.error("submitAccessRequestAction failed", { code: error.code, message: error.message });
    accessRequestErrorRedirect("/access-request", "申请提交失败，请稍后重试。");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/access-requests");
  redirect("/access-request?success=1");
}

export async function reviewAccessRequestAction(id: string, formData: FormData) {
  const parsed = reviewPayloadFromForm(formData);
  const detailPath = `/dashboard/access-requests/${id}`;

  if (!parsed.success) {
    accessRequestErrorRedirect(detailPath, parsed.error.issues[0]?.message ?? "请检查处理表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    accessRequestErrorRedirect(detailPath, error ?? "当前账号没有管理员权限。");
  }

  const reviewedAt = parsed.data.status === "pending" ? null : new Date().toISOString();
  const { data, error: updateError } = await supabase
    .from("access_requests")
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.admin_note,
      reviewed_at: reviewedAt
    })
    .eq("id", id)
    .select("id,status,requester_name,requested_content_type,requested_content_title")
    .single();

  if (updateError) {
    console.error("reviewAccessRequestAction failed", { code: updateError.code, message: updateError.message });
    accessRequestErrorRedirect(detailPath, "保存处理结果失败，请稍后重试。");
  }

  await writeActivityLog({
    action: `access_request.${data.status}`,
    entityType: "access_request",
    entityId: data.id,
    metadata: {
      requester_name: data.requester_name,
      requested_content_type: data.requested_content_type,
      requested_content_title: data.requested_content_title
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/access-requests");
  revalidatePath(detailPath);
  redirect(detailPath);
}
