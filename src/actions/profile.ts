"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getArrayFromText, getBoolean, getOptionalString, getString } from "@/lib/forms";
import { profileSchema } from "@/lib/validations/profile";

function parseKeyValueText(value: string, label: string) {
  const result: Record<string, string> = {};
  const lines = value
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const separatorIndex = line.search(/[:：]/);

    if (separatorIndex <= 0) {
      return { error: `${label}请使用“名称: 内容”的格式，每行一条。` };
    }

    const key = line.slice(0, separatorIndex).trim();
    const itemValue = line.slice(separatorIndex + 1).trim();

    if (!key || !itemValue) {
      return { error: `${label}包含空的名称或内容，请检查后再保存。` };
    }

    result[key] = itemValue;
  }

  return { data: result };
}

function profileErrorRedirect(message: string): never {
  redirect(`/dashboard/profile?error=${encodeFormError(message)}`);
}

function profilePayloadFromForm(formData: FormData) {
  const contact = parseKeyValueText(getString(formData, "contact"), "公开联系方式");
  const socialLinks = parseKeyValueText(getString(formData, "social_links"), "社交链接");

  if (contact.error) {
    return { success: false as const, error: contact.error };
  }

  if (socialLinks.error) {
    return { success: false as const, error: socialLinks.error };
  }

  const isPublic = getBoolean(formData, "is_public");

  const parsed = profileSchema.safeParse({
    display_name: getString(formData, "display_name"),
    headline: getOptionalString(formData, "headline"),
    bio: getOptionalString(formData, "bio"),
    education: getOptionalString(formData, "education"),
    role_title: getOptionalString(formData, "role_title"),
    organization: getOptionalString(formData, "organization"),
    location: getOptionalString(formData, "location"),
    research_interests: getArrayFromText(formData, "research_interests"),
    skill_tags: getArrayFromText(formData, "skill_tags"),
    contact: contact.data ?? {},
    social_links: socialLinks.data ?? {},
    avatar_url: getOptionalString(formData, "avatar_url"),
    resume_url: getOptionalString(formData, "resume_url"),
    is_public: isPublic,
    visibility: isPublic ? "public" : "private"
  });

  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "请检查个人资料表单。" };
  }

  return { success: true as const, data: parsed.data };
}

export async function updateProfileAction(formData: FormData) {
  const parsed = profilePayloadFromForm(formData);

  if (!parsed.success) {
    profileErrorRedirect(parsed.error);
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    profileErrorRedirect(error ?? "当前账号没有管理员权限。");
  }

  const existingId = getOptionalString(formData, "id");
  const payload = parsed.data;
  const mutation = existingId
    ? supabase.from("profiles").update(payload).eq("id", existingId).select("id,display_name").single()
    : supabase.from("profiles").insert(payload).select("id,display_name").single();

  const { data, error: saveError } = await mutation;

  if (saveError) {
    profileErrorRedirect(saveError.message || "个人资料保存失败，请稍后重试。");
  }

  await writeActivityLog({
    action: existingId ? "profile.update" : "profile.create",
    entityType: "profile",
    entityId: data.id,
    metadata: { title: data.display_name, is_public: payload.is_public }
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  redirect("/dashboard/profile?saved=1");
}
