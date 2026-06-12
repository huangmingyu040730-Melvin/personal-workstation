"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DocumentCollectionRecord, DocumentCollectionType, DocumentRelatedType } from "@/lib/content-types";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getOptionalString, getString } from "@/lib/forms";
import {
  buildDocumentStoragePath,
  getFolderPath,
  hasBlockedDocumentPath,
  MAX_DOCUMENT_BATCH_FILE_COUNT,
  MAX_DOCUMENT_BATCH_TOTAL_SIZE,
  sanitizePathSegment,
  sanitizeRelativePath,
  validateDocumentFileDescriptor,
  WORKSPACE_FILES_BUCKET
} from "@/lib/storage/documents";
import {
  documentCollectionEditableMetadataSchema,
  documentCollectionMetadataSchema,
  documentEditableMetadataSchema,
  documentMetadataSchema
} from "@/lib/validations/document";

export type PreparedDocumentUpload = {
  documentId: string;
  storageBucket: typeof WORKSPACE_FILES_BUCKET;
  storagePath: string;
  name: string;
  category: string;
  fileSize: number;
  mimeType: string;
  collectionId: string | null;
  originalName: string | null;
  relativePath: string | null;
  folderPath: string | null;
  relatedType: DocumentRelatedType | null;
  relatedId: string | null;
};

export type PreparedDocumentCollectionUpload = {
  collectionId: string;
  title: string;
  collectionType: DocumentCollectionType;
  relatedType: DocumentRelatedType | null;
  relatedId: string | null;
  rootFolderName: string | null;
  fileCount: number;
  totalSize: number;
};

export type PrepareDocumentUploadResult =
  | { ok: true; upload: PreparedDocumentUpload }
  | { ok: false; message: string };

export type PrepareDocumentCollectionUploadResult =
  | { ok: true; collection: PreparedDocumentCollectionUpload }
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
    related_id: getOptionalString(formData, "related_id"),
    collection_id: getOptionalString(formData, "collection_id"),
    original_name: getOptionalString(formData, "original_name"),
    relative_path: getOptionalString(formData, "relative_path")
  });
}

function relatedValuesFromForm(formData: FormData) {
  const relatedKey = getOptionalString(formData, "related_key");

  if (!relatedKey) {
    return {
      related_type: getOptionalString(formData, "related_type"),
      related_id: getOptionalString(formData, "related_id")
    };
  }

  const [relatedType, ...idParts] = relatedKey.split(":");

  return {
    related_type: relatedType,
    related_id: idParts.join(":") || null
  };
}

async function ensureRelatedRecordExists(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>,
  relatedType: DocumentRelatedType | null,
  relatedId: string | null
) {
  if (!relatedType || !relatedId) {
    return true;
  }

  const table =
    relatedType === "publication"
      ? "publications"
      : relatedType === "project"
        ? "projects"
        : relatedType === "knowledge"
          ? "knowledge_notes"
          : "skills";
  const { data, error } = await supabase.from(table).select("id").eq("id", relatedId).maybeSingle();

  if (error) {
    console.error("ensureRelatedRecordExists failed", { relatedType, code: error.code, message: error.message });
  }

  return Boolean(data);
}

async function getDocumentCollectionForUpload(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>,
  collectionId: string | null
) {
  if (!collectionId) {
    return null;
  }

  const { data, error } = await supabase
    .from("document_collections")
    .select("id,title,collection_type,related_type,related_id")
    .eq("id", collectionId)
    .maybeSingle();

  if (error) {
    console.error("getDocumentCollectionForUpload failed", { code: error.code, message: error.message });
  }

  return (data as Pick<DocumentCollectionRecord, "id" | "title" | "collection_type" | "related_type" | "related_id"> | null) ?? null;
}

async function refreshDocumentCollectionStats(
  supabase: NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>,
  collectionId: string | null
) {
  if (!collectionId) {
    return;
  }

  const { data, error } = await supabase.from("documents").select("file_size").eq("collection_id", collectionId);

  if (error) {
    console.error("refreshDocumentCollectionStats select failed", { code: error.code, message: error.message });
    return;
  }

  const fileSizes = (data ?? []).map((item) => Number(item.file_size ?? 0));
  const { error: updateError } = await supabase
    .from("document_collections")
    .update({
      file_count: fileSizes.length,
      total_size: fileSizes.reduce((sum, size) => sum + size, 0)
    })
    .eq("id", collectionId);

  if (updateError) {
    console.error("refreshDocumentCollectionStats update failed", { code: updateError.code, message: updateError.message });
  }
}

function revalidateDocumentPaths(options: {
  documentId?: string | null;
  collectionId?: string | null;
  relatedType?: DocumentRelatedType | null;
  relatedId?: string | null;
}) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");

  if (options.documentId) {
    revalidatePath(`/dashboard/documents/${options.documentId}`);
  }

  if (options.collectionId) {
    revalidatePath(`/dashboard/documents/collections/${options.collectionId}`);
  }

  if (!options.relatedType || !options.relatedId) {
    return;
  }

  if (options.relatedType === "publication") {
    revalidatePath(`/dashboard/publications/${options.relatedId}`);
  }

  if (options.relatedType === "project") {
    revalidatePath(`/dashboard/projects/${options.relatedId}`);
  }

  if (options.relatedType === "knowledge") {
    revalidatePath(`/dashboard/knowledge/${options.relatedId}`);
  }

  if (options.relatedType === "skill") {
    revalidatePath(`/dashboard/skills/${options.relatedId}`);
  }
}

function getRelatedDetailHref(relatedType: DocumentRelatedType | null, relatedId: string | null) {
  if (!relatedType || !relatedId) {
    return null;
  }

  if (relatedType === "publication") {
    return `/dashboard/publications/${relatedId}`;
  }

  if (relatedType === "project") {
    return `/dashboard/projects/${relatedId}`;
  }

  if (relatedType === "knowledge") {
    return `/dashboard/knowledge/${relatedId}`;
  }

  if (relatedType === "skill") {
    return `/dashboard/skills/${relatedId}`;
  }

  return null;
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

export async function prepareDocumentCollectionUploadAction(formData: FormData): Promise<PrepareDocumentCollectionUploadResult> {
  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return documentResultError(error ?? "当前账号没有管理员权限。");
  }

  const metadata = documentCollectionMetadataSchema.safeParse({
    title: getString(formData, "title"),
    description: getOptionalString(formData, "description"),
    collection_type: getString(formData, "collection_type"),
    related_type: getOptionalString(formData, "related_type"),
    related_id: getOptionalString(formData, "related_id"),
    root_folder_name: getOptionalString(formData, "root_folder_name"),
    file_count: getString(formData, "file_count"),
    total_size: getString(formData, "total_size")
  });

  if (!metadata.success) {
    return documentResultError(metadata.error.issues[0]?.message ?? "请检查文档包信息。");
  }

  if (metadata.data.file_count > MAX_DOCUMENT_BATCH_FILE_COUNT) {
    return documentResultError(`单次最多上传 ${MAX_DOCUMENT_BATCH_FILE_COUNT} 个文件。`);
  }

  if (metadata.data.total_size > MAX_DOCUMENT_BATCH_TOTAL_SIZE) {
    return documentResultError("单次批量上传总大小不能超过 200 MB。");
  }

  const relatedType = metadata.data.related_type as DocumentRelatedType | null;
  const relatedExists = await ensureRelatedRecordExists(supabase, relatedType, metadata.data.related_id);

  if (!relatedExists) {
    return documentResultError("关联对象不存在，请重新选择。");
  }

  const rootFolderName = metadata.data.root_folder_name ? sanitizePathSegment(metadata.data.root_folder_name) : null;
  const { data, error: insertError } = await supabase
    .from("document_collections")
    .insert({
      owner_id: actorId,
      title: metadata.data.title,
      description: metadata.data.description,
      collection_type: metadata.data.collection_type,
      related_type: relatedType,
      related_id: metadata.data.related_id,
      root_folder_name: rootFolderName,
      file_count: 0,
      total_size: 0,
      visibility: "private"
    })
    .select("id,title,collection_type,related_type,related_id,root_folder_name,file_count,total_size")
    .single();

  if (insertError || !data) {
    return documentResultError(getDocumentErrorMessage(insertError ?? { message: "创建文档包失败，请稍后重试。" }));
  }

  await writeActivityLog({
    action: "document_collection.create",
    entityType: "document_collection",
    entityId: data.id,
    metadata: {
      title: data.title,
      collection_type: data.collection_type,
      related_type: data.related_type,
      related_id: data.related_id,
      requested_file_count: metadata.data.file_count,
      requested_total_size: metadata.data.total_size
    }
  });

  revalidateDocumentPaths({
    collectionId: data.id,
    relatedType: data.related_type as DocumentRelatedType | null,
    relatedId: data.related_id
  });

  return {
    ok: true,
    collection: {
      collectionId: data.id,
      title: data.title,
      collectionType: data.collection_type as DocumentCollectionType,
      relatedType: data.related_type as DocumentRelatedType | null,
      relatedId: data.related_id,
      rootFolderName: data.root_folder_name,
      fileCount: data.file_count,
      totalSize: data.total_size
    }
  };
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
  const collection = await getDocumentCollectionForUpload(supabase, metadata.data.collection_id);

  if (metadata.data.collection_id && !collection) {
    return documentResultError("文档包不存在，请重新创建批次。");
  }

  if (collection && metadata.data.related_type && collection.related_type && metadata.data.related_type !== collection.related_type) {
    return documentResultError("文件关联类型与文档包不一致。");
  }

  if (collection && metadata.data.related_id && collection.related_id && metadata.data.related_id !== collection.related_id) {
    return documentResultError("文件关联对象与文档包不一致。");
  }

  const effectiveRelatedType = (collection?.related_type ?? relatedType) as DocumentRelatedType | null;
  const effectiveRelatedId = collection?.related_id ?? metadata.data.related_id;
  const relatedExists = await ensureRelatedRecordExists(supabase, effectiveRelatedType, effectiveRelatedId);

  if (!relatedExists) {
    return documentResultError("关联对象不存在，请重新选择。");
  }

  const documentId = crypto.randomUUID();
  const originalName = metadata.data.original_name || getString(formData, "file_name");

  if (metadata.data.relative_path && hasBlockedDocumentPath(metadata.data.relative_path)) {
    return documentResultError("文件夹路径中包含不支持的可执行安装包或脚本文件。");
  }

  const relativePath = metadata.data.relative_path
    ? sanitizeRelativePath(metadata.data.relative_path, fileValidation.safeFileName)
    : null;
  const folderPath = relativePath ? getFolderPath(relativePath) : null;
  const storagePath = buildDocumentStoragePath({
    documentId,
    fileName: fileValidation.safeFileName,
    relatedType: effectiveRelatedType,
    relatedId: effectiveRelatedId,
    collectionId: collection?.id ?? null,
    relativePath
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
      collectionId: collection?.id ?? null,
      originalName,
      relativePath,
      folderPath,
      relatedType: effectiveRelatedType,
      relatedId: effectiveRelatedId
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
    name: upload.originalName ?? upload.storagePath.split("/").pop() ?? upload.name,
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
    related_id: upload.relatedId,
    collection_id: upload.collectionId,
    original_name: upload.originalName,
    relative_path: upload.relativePath
  });

  if (!metadata.success) {
    return documentResultError(metadata.error.issues[0]?.message ?? "请检查文件信息。");
  }

  const relatedType = metadata.data.related_type as DocumentRelatedType | null;
  const collection = await getDocumentCollectionForUpload(supabase, metadata.data.collection_id);

  if (metadata.data.collection_id && !collection) {
    await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([upload.storagePath]);
    return documentResultError("文档包不存在，已尝试清理刚上传的文件。");
  }

  if (collection && relatedType && collection.related_type && relatedType !== collection.related_type) {
    await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([upload.storagePath]);
    return documentResultError("文件关联类型与文档包不一致，已尝试清理刚上传的文件。");
  }

  if (collection && metadata.data.related_id && collection.related_id && metadata.data.related_id !== collection.related_id) {
    await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([upload.storagePath]);
    return documentResultError("文件关联对象与文档包不一致，已尝试清理刚上传的文件。");
  }

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
      collection_id: metadata.data.collection_id,
      original_name: upload.originalName,
      relative_path: upload.relativePath,
      folder_path: upload.folderPath,
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
      collection_id: metadata.data.collection_id,
      related_type: data.related_type,
      related_id: data.related_id
    }
  });

  await refreshDocumentCollectionStats(supabase, metadata.data.collection_id);
  revalidateDocumentPaths({
    documentId: data.id,
    collectionId: metadata.data.collection_id,
    relatedType: data.related_type as DocumentRelatedType | null,
    relatedId: data.related_id
  });

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

export async function updateDocumentMetadataAction(id: string, formData: FormData) {
  const { supabase, isAdmin, error } = await getAdminClient();
  const detailPath = `/dashboard/documents/${id}`;

  if (!supabase || !isAdmin) {
    redirect(`${detailPath}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const relatedValues = relatedValuesFromForm(formData);
  const metadata = documentEditableMetadataSchema.safeParse({
    name: getString(formData, "name"),
    category: getString(formData, "category"),
    related_type: relatedValues.related_type,
    related_id: relatedValues.related_id
  });

  if (!metadata.success) {
    redirect(`${detailPath}?error=${encodeFormError(metadata.error.issues[0]?.message ?? "请检查文件信息。")}`);
  }

  const relatedType = metadata.data.related_type as DocumentRelatedType | null;
  const relatedExists = await ensureRelatedRecordExists(supabase, relatedType, metadata.data.related_id);

  if (!relatedExists) {
    redirect(`${detailPath}?error=${encodeFormError("关联对象不存在，请重新选择。")}`);
  }

  const { data: existing, error: fetchError } = await supabase
    .from("documents")
    .select("id,name,category,collection_id,related_type,related_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    redirect(`${detailPath}?error=${encodeFormError(fetchError?.message || "文件记录不存在。")}`);
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      name: metadata.data.name,
      category: metadata.data.category,
      related_type: relatedType,
      related_id: metadata.data.related_id
    })
    .eq("id", id);

  if (updateError) {
    redirect(`${detailPath}?error=${encodeFormError(updateError.message || "更新文件信息失败。")}`);
  }

  const oldRelatedType = existing.related_type as DocumentRelatedType | null;
  const oldRelatedId = existing.related_id;

  await writeActivityLog({
    action: "document.update_metadata",
    entityType: "document",
    entityId: id,
    metadata: {
      name: metadata.data.name,
      category: metadata.data.category,
      old_related_type: existing.related_type,
      old_related_id: existing.related_id,
      new_related_type: relatedType,
      new_related_id: metadata.data.related_id
    }
  });

  revalidateDocumentPaths({
    documentId: id,
    collectionId: existing.collection_id,
    relatedType: oldRelatedType,
    relatedId: oldRelatedId
  });
  revalidateDocumentPaths({
    documentId: id,
    collectionId: existing.collection_id,
    relatedType,
    relatedId: metadata.data.related_id
  });

  redirect(`${detailPath}?notice=metadata_updated`);
}

export async function updateDocumentCollectionMetadataAction(id: string, formData: FormData) {
  const { supabase, isAdmin, error } = await getAdminClient();
  const detailPath = `/dashboard/documents/collections/${id}`;

  if (!supabase || !isAdmin) {
    redirect(`${detailPath}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const relatedValues = relatedValuesFromForm(formData);
  const metadata = documentCollectionEditableMetadataSchema.safeParse({
    title: getString(formData, "title"),
    description: getOptionalString(formData, "description"),
    collection_type: getString(formData, "collection_type"),
    related_type: relatedValues.related_type,
    related_id: relatedValues.related_id
  });

  if (!metadata.success) {
    redirect(`${detailPath}?error=${encodeFormError(metadata.error.issues[0]?.message ?? "请检查文档包信息。")}`);
  }

  const relatedType = metadata.data.related_type as DocumentRelatedType | null;
  const relatedExists = await ensureRelatedRecordExists(supabase, relatedType, metadata.data.related_id);

  if (!relatedExists) {
    redirect(`${detailPath}?error=${encodeFormError("关联对象不存在，请重新选择。")}`);
  }

  const { data: existing, error: fetchError } = await supabase
    .from("document_collections")
    .select("id,title,description,collection_type,related_type,related_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    redirect(`${detailPath}?error=${encodeFormError(fetchError?.message || "文档包不存在。")}`);
  }

  const { error: updateError } = await supabase
    .from("document_collections")
    .update({
      title: metadata.data.title,
      description: metadata.data.description,
      collection_type: metadata.data.collection_type,
      related_type: relatedType,
      related_id: metadata.data.related_id
    })
    .eq("id", id);

  if (updateError) {
    redirect(`${detailPath}?error=${encodeFormError(updateError.message || "更新文档包信息失败。")}`);
  }

  const oldRelatedType = existing.related_type as DocumentRelatedType | null;
  const oldRelatedId = existing.related_id;

  await writeActivityLog({
    action: "document_collection.update_metadata",
    entityType: "document_collection",
    entityId: id,
    metadata: {
      title: metadata.data.title,
      collection_type: metadata.data.collection_type,
      old_related_type: existing.related_type,
      old_related_id: existing.related_id,
      new_related_type: relatedType,
      new_related_id: metadata.data.related_id
    }
  });

  revalidateDocumentPaths({
    collectionId: id,
    relatedType: oldRelatedType,
    relatedId: oldRelatedId
  });
  revalidateDocumentPaths({
    collectionId: id,
    relatedType,
    relatedId: metadata.data.related_id
  });

  redirect(`${detailPath}?notice=collection_updated`);
}

export async function deleteDocumentCollectionAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();
  const collectionPath = `/dashboard/documents/collections/${id}`;

  if (!supabase || !isAdmin) {
    redirect(`${collectionPath}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: collection, error: fetchError } = await supabase
    .from("document_collections")
    .select("id,title,collection_type,related_type,related_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    redirect(`${collectionPath}?error=${encodeFormError(fetchError.message || "读取文档包失败。")}`);
  }

  if (!collection) {
    redirect(`/dashboard/documents?error=${encodeFormError("文档包不存在或已经被删除。")}`);
  }

  const { count, error: countError } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", id);

  if (countError) {
    redirect(`${collectionPath}?error=${encodeFormError(countError.message || "检查文档包文件数量失败。")}`);
  }

  if ((count ?? 0) > 0) {
    redirect(`${collectionPath}?error=${encodeFormError("该文档包仍包含文件，请先删除文件后再删除文档包。")}`);
  }

  const { error: deleteError } = await supabase.from("document_collections").delete().eq("id", id);

  if (deleteError) {
    redirect(`${collectionPath}?error=${encodeFormError(deleteError.message || "删除文档包失败。")}`);
  }

  const relatedType = collection.related_type as DocumentRelatedType | null;
  const relatedId = collection.related_id;

  await writeActivityLog({
    action: "document_collection.delete",
    entityType: "document_collection",
    entityId: id,
    metadata: {
      title: collection.title,
      collection_type: collection.collection_type,
      related_type: collection.related_type,
      related_id: collection.related_id
    }
  });

  revalidateDocumentPaths({
    collectionId: id,
    relatedType,
    relatedId
  });

  const relatedHref = getRelatedDetailHref(relatedType, relatedId);

  if (relatedHref) {
    redirect(`${relatedHref}?notice=collection_deleted`);
  }

  redirect("/dashboard/documents?notice=collection_deleted");
}

export async function deleteDocumentAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/documents/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("id,name,category,storage_bucket,storage_path,file_size,mime_type,collection_id,original_name,relative_path,folder_path,related_type,related_id,visibility,owner_id,created_at")
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
        collection_id: document.collection_id,
        original_name: document.original_name,
        relative_path: document.relative_path,
        folder_path: document.folder_path,
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
      collection_id: document.collection_id,
      related_type: document.related_type,
      related_id: document.related_id
    }
  });

  await refreshDocumentCollectionStats(supabase, document.collection_id);
  revalidateDocumentPaths({
    documentId: id,
    collectionId: document.collection_id,
    relatedType: document.related_type as DocumentRelatedType | null,
    relatedId: document.related_id
  });
  redirect("/dashboard/documents");
}
