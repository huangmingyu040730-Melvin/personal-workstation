"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getBoolean, getOptionalString, getString, getStringArray } from "@/lib/forms";
import { skillSchema, skillVersionSchema } from "@/lib/validations/skill";

function skillPayloadFromForm(formData: FormData) {
  return skillSchema.safeParse({
    name: getString(formData, "name"),
    slug: getString(formData, "slug"),
    description: getString(formData, "description"),
    content: getOptionalString(formData, "content"),
    category: getString(formData, "category"),
    platforms: getStringArray(formData, "platforms"),
    status: getString(formData, "status"),
    current_version: getOptionalString(formData, "current_version"),
    input_description: getOptionalString(formData, "input_description"),
    output_description: getOptionalString(formData, "output_description"),
    usage_guide: getOptionalString(formData, "usage_guide"),
    skill_md_content: getOptionalString(formData, "skill_md_content"),
    repository_url: getOptionalString(formData, "repository_url"),
    is_featured: getBoolean(formData, "is_featured"),
    visibility: getString(formData, "visibility"),
    create_initial_version: getBoolean(formData, "create_initial_version"),
    version_notes: getOptionalString(formData, "version_notes"),
    version_released_at: getOptionalString(formData, "version_released_at")
  });
}

function skillErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function getSkillErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "slug 或版本号已存在，请检查后重试。";
  }

  return error.message || "Skill 保存失败，请稍后重试。";
}

function skillInsertPayload(input: ReturnType<typeof skillSchema.parse>) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    content: input.content,
    category: input.category,
    platforms: input.platforms,
    status: input.status,
    current_version: input.current_version,
    input_description: input.input_description,
    output_description: input.output_description,
    usage_guide: input.usage_guide,
    skill_md_content: input.skill_md_content,
    repository_url: input.repository_url,
    is_featured: input.is_featured,
    visibility: input.visibility
  };
}

export async function createSkillAction(formData: FormData) {
  const parsed = skillPayloadFromForm(formData);

  if (!parsed.success) {
    skillErrorRedirect("/dashboard/skills/new", parsed.error.issues[0]?.message ?? "请检查 Skill 表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    skillErrorRedirect("/dashboard/skills/new", error ?? "当前账号没有管理员权限。");
  }

  const { data, error: insertError } = await supabase
    .from("skills")
    .insert(skillInsertPayload(parsed.data))
    .select("id,name,slug,current_version")
    .single();

  if (insertError) {
    skillErrorRedirect("/dashboard/skills/new", getSkillErrorMessage(insertError));
  }

  await writeActivityLog({
    action: "skill.create",
    entityType: "skill",
    entityId: data.id,
    metadata: { name: data.name, slug: data.slug, version: data.current_version }
  });

  if (parsed.data.create_initial_version && parsed.data.current_version) {
    const { error: versionError } = await supabase.from("skill_versions").insert({
      skill_id: data.id,
      version: parsed.data.current_version,
      notes: parsed.data.version_notes,
      released_at: parsed.data.version_released_at
    });

    if (!versionError) {
      await writeActivityLog({
        action: "skill_version.create",
        entityType: "skill",
        entityId: data.id,
        metadata: { name: data.name, version: parsed.data.current_version }
      });
    } else {
      console.error("initial skill version insert failed", { code: versionError.code, message: versionError.message });
    }
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/skills");
  revalidatePath("/dashboard/skills");
  revalidatePath(`/skills/${data.slug}`);
  redirect(`/dashboard/skills/${data.id}`);
}

export async function updateSkillAction(id: string, formData: FormData) {
  const parsed = skillPayloadFromForm(formData);
  const editPath = `/dashboard/skills/${id}/edit`;

  if (!parsed.success) {
    skillErrorRedirect(editPath, parsed.error.issues[0]?.message ?? "请检查 Skill 表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    skillErrorRedirect(editPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase
    .from("skills")
    .update(skillInsertPayload(parsed.data))
    .eq("id", id)
    .select("id,name,slug,current_version")
    .single();

  if (updateError) {
    skillErrorRedirect(editPath, getSkillErrorMessage(updateError));
  }

  await writeActivityLog({
    action: "skill.update",
    entityType: "skill",
    entityId: data.id,
    metadata: { name: data.name, slug: data.slug, version: data.current_version }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/skills");
  revalidatePath("/dashboard/skills");
  revalidatePath(`/skills/${data.slug}`);
  revalidatePath(`/dashboard/skills/${id}`);
  redirect(`/dashboard/skills/${id}`);
}

export async function deleteSkillAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/skills/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: existing } = await supabase.from("skills").select("name,slug").eq("id", id).maybeSingle();
  const { error: deleteError } = await supabase.from("skills").delete().eq("id", id);

  if (deleteError) {
    redirect(`/dashboard/skills/${id}?error=${encodeFormError(deleteError.message || "删除 Skill 失败。")}`);
  }

  await writeActivityLog({
    action: "skill.delete",
    entityType: "skill",
    entityId: id,
    metadata: { name: existing?.name ?? "已删除 Skill", slug: existing?.slug ?? null }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/skills");
  if (existing?.slug) {
    revalidatePath(`/skills/${existing.slug}`);
  }
  revalidatePath("/dashboard/skills");
  redirect("/dashboard/skills");
}

export async function createSkillVersionAction(skillId: string, formData: FormData) {
  const parsed = skillVersionSchema.safeParse({
    version: getString(formData, "version"),
    notes: getOptionalString(formData, "notes"),
    released_at: getOptionalString(formData, "released_at")
  });

  if (!parsed.success) {
    skillErrorRedirect(`/dashboard/skills/${skillId}`, parsed.error.issues[0]?.message ?? "请检查版本记录。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    skillErrorRedirect(`/dashboard/skills/${skillId}`, error ?? "当前账号没有管理员权限。");
  }

  const { error: insertError } = await supabase.from("skill_versions").insert({
    skill_id: skillId,
    ...parsed.data
  });

  if (insertError) {
    skillErrorRedirect(`/dashboard/skills/${skillId}`, getSkillErrorMessage(insertError));
  }

  const { data: skill } = await supabase.from("skills").select("name").eq("id", skillId).maybeSingle();

  await writeActivityLog({
    action: "skill_version.create",
    entityType: "skill",
    entityId: skillId,
    metadata: { name: skill?.name ?? "Skill", version: parsed.data.version }
  });

  revalidatePath("/dashboard");
  revalidatePath("/skills");
  revalidatePath("/dashboard/skills");
  revalidatePath(`/dashboard/skills/${skillId}`);
  redirect(`/dashboard/skills/${skillId}`);
}
