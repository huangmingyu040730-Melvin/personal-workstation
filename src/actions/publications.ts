"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getArrayFromText, getBoolean, getOptionalString, getString } from "@/lib/forms";
import { publicationSchema } from "@/lib/validations/publication";

function publicationPayloadFromForm(formData: FormData) {
  return publicationSchema.safeParse({
    title: getString(formData, "title"),
    slug: getString(formData, "slug"),
    publication_type: getString(formData, "publication_type"),
    summary: getString(formData, "summary"),
    abstract: getOptionalString(formData, "abstract"),
    published_on: getOptionalString(formData, "published_on"),
    tags: getArrayFromText(formData, "tags"),
    project_id: getOptionalString(formData, "project_id"),
    is_featured: getBoolean(formData, "is_featured"),
    visibility: getString(formData, "visibility")
  });
}

function publicationErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function getPublicationErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "slug 已存在，请换一个成果 slug。";
  }

  return error.message || "成果保存失败，请稍后重试。";
}

export async function createPublicationAction(formData: FormData) {
  const parsed = publicationPayloadFromForm(formData);

  if (!parsed.success) {
    publicationErrorRedirect("/publications/new", parsed.error.issues[0]?.message ?? "请检查成果表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    publicationErrorRedirect("/publications/new", error ?? "当前账号没有管理员权限。");
  }

  const { data, error: insertError } = await supabase
    .from("publications")
    .insert(parsed.data)
    .select("id,title,slug")
    .single();

  if (insertError) {
    publicationErrorRedirect("/publications/new", getPublicationErrorMessage(insertError));
  }

  await writeActivityLog({
    action: "publication.create",
    entityType: "publication",
    entityId: data.id,
    metadata: { title: data.title, slug: data.slug }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/publications");
  redirect(`/publications/${data.id}`);
}

export async function updatePublicationAction(id: string, formData: FormData) {
  const parsed = publicationPayloadFromForm(formData);
  const editPath = `/publications/${id}/edit`;

  if (!parsed.success) {
    publicationErrorRedirect(editPath, parsed.error.issues[0]?.message ?? "请检查成果表单。");
  }

  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    publicationErrorRedirect(editPath, error ?? "当前账号没有管理员权限。");
  }

  const { data, error: updateError } = await supabase
    .from("publications")
    .update(parsed.data)
    .eq("id", id)
    .select("id,title,slug")
    .single();

  if (updateError) {
    publicationErrorRedirect(editPath, getPublicationErrorMessage(updateError));
  }

  await writeActivityLog({
    action: "publication.update",
    entityType: "publication",
    entityId: data.id,
    metadata: { title: data.title, slug: data.slug }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/publications");
  revalidatePath(`/publications/${id}`);
  redirect(`/publications/${id}`);
}

export async function deletePublicationAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/publications/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { count, error: countError } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("related_type", "publication")
    .eq("related_id", id);

  if (countError) {
    redirect(`/publications/${id}?error=${encodeFormError(countError.message || "检查关联附件失败。")}`);
  }

  if ((count ?? 0) > 0) {
    redirect(`/publications/${id}?error=${encodeFormError("该成果仍有关联附件，请先删除或解除关联附件后再删除成果。")}`);
  }

  const { data: existing } = await supabase.from("publications").select("title,slug").eq("id", id).maybeSingle();
  const { error: deleteError } = await supabase.from("publications").delete().eq("id", id);

  if (deleteError) {
    redirect(`/publications/${id}?error=${encodeFormError(deleteError.message || "删除成果失败。")}`);
  }

  await writeActivityLog({
    action: "publication.delete",
    entityType: "publication",
    entityId: id,
    metadata: { title: existing?.title ?? "已删除成果", slug: existing?.slug ?? null }
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/publications");
  redirect("/publications");
}
