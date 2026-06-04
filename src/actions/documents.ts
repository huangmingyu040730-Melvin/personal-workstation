"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DocumentRelatedType } from "@/lib/content-types";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getOptionalString, getString } from "@/lib/forms";
import {
  buildDocumentStoragePath,
  validateDocumentFileDescriptor,
  WORKSPACE_FILES_BUCKET
} from "@/lib/storage/documents";
import { documentMetadataSchema } from "@/lib/validations/document";

export type PreparedDocumentUpload = {
  documentId: string;
  storageBucket: typeof WORKSPACE_FILES_BUCKET;
  storagePath: string;
  name: string;
  category: string;
  fileSize: number;
  mimeType: string;
  relatedType: DocumentRelatedType | null;
  relatedId: string | null;
};

export type PrepareDocumentUploadResult =
  | { ok: true; upload: PreparedDocumentUpload }
  | { ok: false; message: string };

export type FinalizeDocumentUploadResult =
  | { ok: true; documentId: string }
  | { ok: false; message: string };

export type RollbackDocumentUploadResult =
  | { ok: true }
  | { ok: false; message: string };

function documentResultError(message: string): { ok: false; message: string } {
  return { ok: false, message };
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

async function storageObjectExists(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>,
  storagePath: string
) {
  const pathParts = storagePath.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  if (!fileName || !directory || storagePath.includes("..") || storagePath.includes("\\")) {
    return false;
  }

  const { data, error } = await supabase.storage.from(WORKSPACE_FILES_BUCKET).list(directory, {
    limit: 100,
    search: fileName
  });

  if (error) {
    console.error("storage object existence check failed", { message: error.message });
    return false;
  }

  return Boolean(data?.some((item) => item.name === fileName));
}

export async function prepareDocumentUploadAction(formData: FormData): Promise<PrepareDocumentUploadResult> {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return documentResultError(error ?? "当前账号没有管理员权限。");
  }

  const fileValidation = validateDocumentFileDescriptor({
    name: getString(formData, "file_name"),
    type: getString(formData, "file_type"),
    size: Number(getString(formData, "file_size"))
  });

  if (!fileValidation.ok) {
    return documentResultError(fileValidation.message);
  }

  const metadata = documentMetadataFromForm(formData, fileValidation.safeFileName);

  if (!metadata.success) {
    return documentResultError(metadata.error.issues[0]?.message ?? "请检查文件信息。");
  }

  const relatedType = metadata.data.related_type as DocumentRelatedType | null;
  const relatedExists = await ensureRelatedRecordExists(supabase, relatedType, metadata.data.related_id);

  if (!relatedExists) {
    return documentResultError("关联对象不存在，请重新选择。");
  }

  const documentId = crypto.randomUUID();
  const storagePath = buildDocumentStoragePath({
    documentId,
    fileName: fileValidation.safeFileName,
    relatedType,
    relatedId: metadata.data.related_id
  });

  return {
    ok: true,
    upload: {
      documentId,
      storageBucket: WORKSPACE_FILES_BUCKET,
      storagePath,
      name: metadata.data.name,
      category: metadata.data.category,
      fileSize: Number(getString(formData, "file_size")),
      mimeType: fileValidation.mimeType,
      relatedType,
      relatedId: metadata.data.related_id
    }
  };
}

export async function finalizeDocumentUploadAction(upload: PreparedDocumentUpload): Promise<FinalizeDocumentUploadResult> {
  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return documentResultError(error ?? "当前账号没有管理员权限。");
  }

  if (upload.storageBucket !== WORKSPACE_FILES_BUCKET) {
    return documentResultError("文件存储位置无效，请重新上传。");
  }

  const fileValidation = validateDocumentFileDescriptor({
    name: upload.storagePath.split("/").pop() ?? upload.name,
    type: upload.mimeType,
    size: upload.fileSize
  });

  if (!fileValidation.ok) {
    return documentResultError(fileValidation.message);
  }

  const metadata = documentMetadataSchema.safeParse({
    name: upload.name,
    category: upload.category,
    related_type: upload.relatedType,
    related_id: upload.relatedId
  });

  if (!metadata.success) {
    return documentResultError(metadata.error.issues[0]?.message ?? "请检查文件信息。");
  }

  const relatedType = metadata.data.related_type as DocumentRelatedType | null;
  const relatedExists = await ensureRelatedRecordExists(supabase, relatedType, metadata.data.related_id);

  if (!relatedExists) {
    await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([upload.storagePath]);
    return documentResultError("关联对象不存在，已尝试清理刚上传的文件。");
  }

  const exists = await storageObjectExists(supabase, upload.storagePath);

  if (!exists) {
    return documentResultError("文件对象不存在，请重新上传。");
  }

  const { data, error: insertError } = await supabase
    .from("documents")
    .insert({
      id: upload.documentId,
      name: metadata.data.name,
      category: metadata.data.category,
      storage_bucket: WORKSPACE_FILES_BUCKET,
      storage_path: upload.storagePath,
      file_size: upload.fileSize,
      mime_type: upload.mimeType,
      related_type: relatedType,
      related_id: metadata.data.related_id,
      visibility: "private",
      owner_id: actorId
    })
    .select("id,name,related_type,related_id")
    .single();

  if (insertError) {
    const { error: cleanupError } = await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([upload.storagePath]);

    if (cleanupError) {
      console.error("document storage cleanup after finalize failed", { message: cleanupError.message });
    }

    return documentResultError(getDocumentErrorMessage(insertError));
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
  revalidatePath("/dashboard/documents");
  if (data.related_type === "publication" && data.related_id) {
    revalidatePath(`/dashboard/publications/${data.related_id}`);
  }

  return { ok: true, documentId: data.id };
}

export async function rollbackPreparedDocumentUploadAction(upload: PreparedDocumentUpload): Promise<RollbackDocumentUploadResult> {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return documentResultError(error ?? "当前账号没有管理员权限。");
  }

  if (upload.storageBucket !== WORKSPACE_FILES_BUCKET) {
    return documentResultError("文件存储位置无效。");
  }

  const { error: removeError } = await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([upload.storagePath]);

  if (removeError) {
    return documentResultError("清理已上传文件失败，请稍后在文件中心检查。");
  }

  return { ok: true };
}

export async function deleteDocumentAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/documents/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("id,name,category,storage_bucket,storage_path,file_size,mime_type,related_type,related_id,visibility,owner_id,created_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !document) {
    redirect(`/dashboard/documents/${id}?error=${encodeFormError(fetchError?.message || "文件记录不存在。")}`);
  }

  const { error: deleteRecordError } = await supabase.from("documents").delete().eq("id", id);

  if (deleteRecordError) {
    redirect(`/dashboard/documents/${id}?error=${encodeFormError(deleteRecordError.message || "删除文件记录失败，尚未删除 Storage 对象。")}`);
  }

  const { error: storageError } = await supabase.storage.from(document.storage_bucket).remove([document.storage_path]);

  if (storageError) {
    console.error("document storage delete after record delete failed", { message: storageError.message });
    await supabase
      .from("documents")
      .insert({
        id: document.id,
        name: document.name,
        category: document.category,
        storage_bucket: document.storage_bucket,
        storage_path: document.storage_path,
        file_size: document.file_size,
        mime_type: document.mime_type,
        related_type: document.related_type,
        related_id: document.related_id,
        visibility: document.visibility,
        owner_id: document.owner_id,
        created_at: document.created_at
      });
    redirect(`/dashboard/documents/${id}?error=${encodeFormError("删除文件对象失败，已尝试恢复文件记录，请稍后重试。")}`);
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
  revalidatePath("/dashboard/documents");
  if (document.related_type === "publication" && document.related_id) {
    revalidatePath(`/dashboard/publications/${document.related_id}`);
  }
  redirect("/dashboard/documents");
}
