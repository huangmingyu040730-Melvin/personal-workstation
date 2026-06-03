"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DocumentRelatedType } from "@/lib/content-types";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getOptionalString, getString } from "@/lib/forms";
import {
  buildDocumentStoragePath,
  validateDocumentFile,
  WORKSPACE_FILES_BUCKET
} from "@/lib/storage/documents";
import { documentMetadataSchema } from "@/lib/validations/document";

function documentErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeFormError(message)}`);
}

function getDocumentErrorMessage(error: { code?: string; message?: string }) {
  return error.message || "文件操作失败，请稍后重试。";
}

function documentMetadataFromForm(formData: FormData, fallbackName: string) {
  const name = getString(formData, "name") || fallbackName;

  return documentMetadataSchema.safeParse({
    name,
    category: getString(formData, "category"),
    related_type: getOptionalString(formData, "related_type"),
    related_id: getOptionalString(formData, "related_id")
  });
}

async function ensureRelatedRecordExists(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>,
  relatedType: DocumentRelatedType | null,
  relatedId: string | null
) {
  if (!relatedType || !relatedId) {
    return true;
  }

  const table = relatedType === "publication" ? "publications" : relatedType === "project" ? "projects" : "skills";
  const { data, error } = await supabase.from(table).select("id").eq("id", relatedId).maybeSingle();

  if (error) {
    console.error("ensureRelatedRecordExists failed", { relatedType, code: error.code, message: error.message });
  }

  return Boolean(data);
}

export async function uploadDocumentAction(formData: FormData) {
  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    documentErrorRedirect("/documents/upload", error ?? "当前账号没有管理员权限。");
  }

  const rawFile = formData.get("file");
  const file = rawFile instanceof File ? rawFile : null;
  const fileValidation = await validateDocumentFile(file);

  if (!fileValidation.ok) {
    documentErrorRedirect("/documents/upload", fileValidation.message);
  }

  if (!file) {
    documentErrorRedirect("/documents/upload", "请选择需要上传的文件。");
  }

  const metadata = documentMetadataFromForm(formData, fileValidation.safeFileName);

  if (!metadata.success) {
    documentErrorRedirect("/documents/upload", metadata.error.issues[0]?.message ?? "请检查文件信息。");
  }

  const relatedType = metadata.data.related_type as DocumentRelatedType | null;
  const relatedExists = await ensureRelatedRecordExists(supabase, relatedType, metadata.data.related_id);

  if (!relatedExists) {
    documentErrorRedirect("/documents/upload", "关联对象不存在，请重新选择。");
  }

  const documentId = crypto.randomUUID();
  const storagePath = buildDocumentStoragePath({
    documentId,
    fileName: fileValidation.safeFileName,
    relatedType,
    relatedId: metadata.data.related_id
  });

  const { error: uploadError } = await supabase.storage.from(WORKSPACE_FILES_BUCKET).upload(storagePath, file, {
    contentType: fileValidation.mimeType,
    upsert: false
  });

  if (uploadError) {
    documentErrorRedirect("/documents/upload", uploadError.message || "文件上传失败，请稍后重试。");
  }

  const { data, error: insertError } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      name: metadata.data.name,
      category: metadata.data.category,
      storage_bucket: WORKSPACE_FILES_BUCKET,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: fileValidation.mimeType,
      related_type: relatedType,
      related_id: metadata.data.related_id,
      visibility: "private",
      owner_id: actorId
    })
    .select("id,name,related_type,related_id")
    .single();

  if (insertError) {
    const { error: cleanupError } = await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([storagePath]);

    if (cleanupError) {
      console.error("document storage cleanup after insert failed", { code: cleanupError.name, message: cleanupError.message });
    }

    documentErrorRedirect("/documents/upload", getDocumentErrorMessage(insertError));
  }

  await writeActivityLog({
    action: "document.upload",
    entityType: "document",
    entityId: data.id,
    metadata: {
      name: data.name,
      related_type: data.related_type,
      related_id: data.related_id
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/documents");
  if (data.related_type === "publication" && data.related_id) {
    revalidatePath(`/publications/${data.related_id}`);
  }
  redirect(`/documents/${data.id}`);
}

export async function deleteDocumentAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/documents/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("id,name,storage_bucket,storage_path,related_type,related_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !document) {
    redirect(`/documents/${id}?error=${encodeFormError(fetchError?.message || "文件记录不存在。")}`);
  }

  const { error: storageError } = await supabase.storage.from(document.storage_bucket).remove([document.storage_path]);

  if (storageError) {
    redirect(`/documents/${id}?error=${encodeFormError(storageError.message || "删除文件对象失败，请稍后重试。")}`);
  }

  const { error: deleteError } = await supabase.from("documents").delete().eq("id", id);

  if (deleteError) {
    redirect(`/documents/${id}?error=${encodeFormError(deleteError.message || "删除文件记录失败。")}`);
  }

  await writeActivityLog({
    action: "document.delete",
    entityType: "document",
    entityId: id,
    metadata: {
      name: document.name,
      related_type: document.related_type,
      related_id: document.related_id
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/documents");
  if (document.related_type === "publication" && document.related_id) {
    revalidatePath(`/publications/${document.related_id}`);
  }
  redirect("/documents");
}
