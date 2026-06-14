"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DocumentAssetRelationType, DocumentCollectionRecord, DocumentCollectionType, DocumentRelatedType } from "@/lib/content-types";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { encodeFormError, getOptionalString, getString } from "@/lib/forms";
import { getDocumentAssetLinkKey, type DocumentAssetLinkInput } from "@/lib/queries/document-asset-links";
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
  documentBulkDeleteSchema,
  documentBulkVisibilitySchema,
  documentBulkRelationSchema,
  addDocumentAssetLinksSchema,
  addDocumentCollectionAssetLinksSchema,
  bulkRemoveDocumentAssetLinksSchema,
  documentCollectionDeleteWithFilesSchema,
  documentCollectionEditableMetadataSchema,
  documentCollectionRelationSyncSchema,
  documentCollectionMetadataSchema,
  documentEditableMetadataSchema,
  documentMetadataSchema,
  removeDocumentAssetLinkSchema,
  removeDocumentCollectionAssetLinkSchema
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
  assetLinks: DocumentAssetLinkInput[];
};

export type PreparedDocumentCollectionUpload = {
  collectionId: string;
  title: string;
  collectionType: DocumentCollectionType;
  relatedType: DocumentRelatedType | null;
  relatedId: string | null;
  assetLinks: DocumentAssetLinkInput[];
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

type AdminSupabaseClient = NonNullable<Awaited<ReturnType<typeof getAdminClient>>["supabase"]>;

type DocumentDeletionRecord = {
  id: string;
  name: string | null;
  storage_bucket: string;
  storage_path: string;
  collection_id: string | null;
  related_type: string | null;
  related_id: string | null;
};

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

function getBooleanFromForm(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "yes" || value === "1";
}

function getDocumentAssetTargetsFromForm(formData: FormData) {
  const rawLinks = formData
    .getAll("asset_links")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  const legacyRelated = relatedValuesFromForm(formData);
  const targets = rawLinks.flatMap((value) => {
    const [assetType, ...idParts] = value.split(":");
    const assetId = idParts.join(":");

    if (!assetType || !assetId) {
      return [];
    }

    return [{
      asset_type: assetType as DocumentRelatedType,
      asset_id: assetId
    }];
  });

  if (legacyRelated.related_type && legacyRelated.related_id) {
    targets.push({
      asset_type: legacyRelated.related_type as DocumentRelatedType,
      asset_id: legacyRelated.related_id
    });
  }

  const seen = new Set<string>();
  return targets.filter((target) => {
    const key = `${target.asset_type}:${target.asset_id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildDocumentAssetLinkInputs(
  targets: Array<{ asset_type: DocumentRelatedType; asset_id: string }>,
  relationType: DocumentAssetRelationType,
  note: string | null
): DocumentAssetLinkInput[] {
  const seen = new Set<string>();

  return targets
    .map((target) => ({
      asset_type: target.asset_type,
      asset_id: target.asset_id,
      relation_type: relationType,
      note
    }))
    .filter((link) => {
      const key = getDocumentAssetLinkKey(link);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function mergeDocumentAssetLinks(...groups: DocumentAssetLinkInput[][]) {
  const seen = new Set<string>();
  const merged: DocumentAssetLinkInput[] = [];

  for (const link of groups.flat()) {
    const key = getDocumentAssetLinkKey(link);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(link);
  }

  return merged;
}

function getPrimaryAssetLink(assetLinks: DocumentAssetLinkInput[]) {
  return assetLinks[0] ?? null;
}

function getDocumentIdsFromForm(formData: FormData) {
  return Array.from(new Set(
    formData
      .getAll("document_ids")
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
  ));
}

function getSafeDashboardReturnTo(value: string | null | undefined) {
  if (!value) {
    return "/dashboard/documents";
  }

  try {
    const url = new URL(value, "https://local.invalid");
    const isSameOrigin = url.origin === "https://local.invalid";
    const isDashboardPath = url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/");

    if (!isSameOrigin || !isDashboardPath) {
      return "/dashboard/documents";
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return "/dashboard/documents";
  }
}

function getReturnPathWithMessage(returnTo: string, params: Record<string, string>) {
  const url = new URL(returnTo, "https://local.invalid");
  url.searchParams.delete("error");
  url.searchParams.delete("notice");
  url.searchParams.delete("count");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return `${url.pathname}${url.search}`;
}

function getDashboardPathname(value: string) {
  return new URL(value, "https://local.invalid").pathname;
}

function uniqueRelationKeys(records: Array<{ related_type: string | null; related_id: string | null }>) {
  return Array.from(new Set(
    records
      .filter((record) => record.related_type && record.related_id)
      .map((record) => `${record.related_type}:${record.related_id}`)
  ))
    .map((key) => {
      const [relatedType, ...idParts] = key.split(":");
      return {
        relatedType: relatedType as DocumentRelatedType,
        relatedId: idParts.join(":")
      };
    });
}

function uniqueNullableValues(values: Array<string | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function getRelatedSummaries(records: Array<{ related_type: string | null; related_id: string | null }>) {
  return uniqueRelationKeys(records).map((relation) => ({
    related_type: relation.relatedType,
    related_id: relation.relatedId
  }));
}

async function deleteDocumentRecordsFromStorageAndDatabase(
  supabase: AdminSupabaseClient,
  documents: DocumentDeletionRecord[]
) {
  if (documents.length === 0) {
    return { ok: true as const };
  }

  const documentIds = documents.map((document) => document.id);
  const collectionIds = uniqueNullableValues(documents.map((document) => document.collection_id));
  const invalidStorageRecord = documents.find((document) => (
    document.storage_bucket !== WORKSPACE_FILES_BUCKET || !document.storage_path
  ));

  if (invalidStorageRecord) {
    console.error("document bulk delete blocked by invalid storage bucket", {
      documentId: invalidStorageRecord.id,
      collectionId: invalidStorageRecord.collection_id
    });
    return {
      ok: false as const,
      message: "文件存储位置无效，未执行删除。"
    };
  }

  const { error: storageError } = await supabase
    .storage
    .from(WORKSPACE_FILES_BUCKET)
    .remove(documents.map((document) => document.storage_path));

  if (storageError) {
    console.error("document bulk delete storage remove failed", {
      documentIds,
      collectionIds,
      message: storageError.message
    });
    return {
      ok: false as const,
      message: "删除文件对象失败，未删除数据库记录，请稍后重试。"
    };
  }

  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .in("id", documentIds);

  if (deleteError) {
    console.error("document bulk delete database delete failed after storage remove", {
      documentIds,
      collectionIds,
      code: deleteError.code,
      message: deleteError.message
    });
    return {
      ok: false as const,
      message: "文件对象已删除，但数据库记录删除失败，请人工复核文件记录。"
    };
  }

  for (const collectionId of collectionIds) {
    await refreshDocumentCollectionStats(supabase, collectionId);
  }

  return { ok: true as const };
}

async function ensureRelatedRecordExists(
  supabase: AdminSupabaseClient,
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

async function ensureDocumentAssetLinksExist(
  supabase: AdminSupabaseClient,
  assetLinks: DocumentAssetLinkInput[]
) {
  for (const link of assetLinks) {
    const exists = await ensureRelatedRecordExists(supabase, link.asset_type, link.asset_id);

    if (!exists) {
      return false;
    }
  }

  return true;
}

async function getCollectionAssetLinksForUpload(
  supabase: AdminSupabaseClient,
  collectionId: string | null
): Promise<DocumentAssetLinkInput[]> {
  if (!collectionId) {
    return [];
  }

  const { data, error } = await supabase
    .from("document_collection_asset_links")
    .select("asset_type,asset_id,relation_type,note")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getCollectionAssetLinksForUpload failed", { code: error.code, message: error.message });
    return [];
  }

  return ((data ?? []) as DocumentAssetLinkInput[]).map((link) => ({
    asset_type: link.asset_type,
    asset_id: link.asset_id,
    relation_type: link.relation_type,
    note: link.note
  }));
}

async function insertDocumentAssetLinks(
  supabase: AdminSupabaseClient,
  documentIds: string[],
  assetLinks: DocumentAssetLinkInput[],
  actorId: string | null
) {
  if (documentIds.length === 0 || assetLinks.length === 0) {
    return { ok: true as const };
  }

  const rows = documentIds.flatMap((documentId) => assetLinks.map((link) => ({
    document_id: documentId,
    asset_type: link.asset_type,
    asset_id: link.asset_id,
    relation_type: link.relation_type,
    note: link.note,
    created_by: actorId
  })));

  const { error } = await supabase
    .from("document_asset_links")
    .upsert(rows, {
      onConflict: "document_id,asset_type,asset_id,relation_type",
      ignoreDuplicates: true
    });

  if (error) {
    console.error("insertDocumentAssetLinks failed", { code: error.code, message: error.message });
    return {
      ok: false as const,
      message: error.message || "添加文件关联失败。"
    };
  }

  return { ok: true as const };
}

async function insertDocumentCollectionAssetLinks(
  supabase: AdminSupabaseClient,
  collectionIds: string[],
  assetLinks: DocumentAssetLinkInput[],
  actorId: string | null
) {
  if (collectionIds.length === 0 || assetLinks.length === 0) {
    return { ok: true as const };
  }

  const rows = collectionIds.flatMap((collectionId) => assetLinks.map((link) => ({
    collection_id: collectionId,
    asset_type: link.asset_type,
    asset_id: link.asset_id,
    relation_type: link.relation_type,
    note: link.note,
    created_by: actorId
  })));

  const { error } = await supabase
    .from("document_collection_asset_links")
    .upsert(rows, {
      onConflict: "collection_id,asset_type,asset_id,relation_type",
      ignoreDuplicates: true
    });

  if (error) {
    console.error("insertDocumentCollectionAssetLinks failed", { code: error.code, message: error.message });
    return {
      ok: false as const,
      message: error.message || "添加文档包关联失败。"
    };
  }

  return { ok: true as const };
}

async function setDocumentPrimaryRelationIfEmpty(
  supabase: AdminSupabaseClient,
  documentIds: string[],
  primaryLink: DocumentAssetLinkInput | null
) {
  if (documentIds.length === 0 || !primaryLink) {
    return;
  }

  const { error } = await supabase
    .from("documents")
    .update({
      related_type: primaryLink.asset_type,
      related_id: primaryLink.asset_id
    })
    .in("id", documentIds)
    .is("related_type", null)
    .is("related_id", null);

  if (error) {
    console.error("setDocumentPrimaryRelationIfEmpty failed", { code: error.code, message: error.message });
  }
}

async function setCollectionPrimaryRelationIfEmpty(
  supabase: AdminSupabaseClient,
  collectionIds: string[],
  primaryLink: DocumentAssetLinkInput | null
) {
  if (collectionIds.length === 0 || !primaryLink) {
    return;
  }

  const { error } = await supabase
    .from("document_collections")
    .update({
      related_type: primaryLink.asset_type,
      related_id: primaryLink.asset_id
    })
    .in("id", collectionIds)
    .is("related_type", null)
    .is("related_id", null);

  if (error) {
    console.error("setCollectionPrimaryRelationIfEmpty failed", { code: error.code, message: error.message });
  }
}

async function getDocumentCollectionForUpload(
  supabase: AdminSupabaseClient,
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
  supabase: AdminSupabaseClient,
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

function revalidatePublicDocumentAttachmentPaths() {
  revalidatePath("/projects");
  revalidatePath("/publications");
  revalidatePath("/knowledge");
  revalidatePath("/skills");
}

function revalidateDocumentAssetLinks(assetLinks: DocumentAssetLinkInput[]) {
  if (assetLinks.length > 0) {
    revalidatePublicDocumentAttachmentPaths();
  }

  for (const link of assetLinks) {
    revalidateDocumentPaths({
      relatedType: link.asset_type,
      relatedId: link.asset_id
    });
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
  supabase: AdminSupabaseClient,
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

  const assetTargets = getDocumentAssetTargetsFromForm(formData);
  const assetRelationType = (getString(formData, "asset_relation_type") || "related") as DocumentAssetRelationType;
  const assetLinks = buildDocumentAssetLinkInputs(assetTargets, assetRelationType, getOptionalString(formData, "asset_note"));
  const primaryLink = getPrimaryAssetLink(assetLinks);
  const metadata = documentCollectionMetadataSchema.safeParse({
    title: getString(formData, "title"),
    description: getOptionalString(formData, "description"),
    collection_type: getString(formData, "collection_type"),
    related_type: primaryLink?.asset_type ?? getOptionalString(formData, "related_type"),
    related_id: primaryLink?.asset_id ?? getOptionalString(formData, "related_id"),
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
  const assetLinksExist = await ensureDocumentAssetLinksExist(supabase, assetLinks);

  if (!relatedExists || !assetLinksExist) {
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

  const linkInsertResult = await insertDocumentCollectionAssetLinks(supabase, [data.id], assetLinks, actorId);

  if (!linkInsertResult.ok) {
    await supabase.from("document_collections").delete().eq("id", data.id);
    return documentResultError(linkInsertResult.message);
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
      asset_link_count: assetLinks.length,
      requested_file_count: metadata.data.file_count,
      requested_total_size: metadata.data.total_size
    }
  });

  revalidateDocumentPaths({
    collectionId: data.id,
    relatedType: data.related_type as DocumentRelatedType | null,
    relatedId: data.related_id
  });
  revalidateDocumentAssetLinks(assetLinks);

  return {
    ok: true,
    collection: {
      collectionId: data.id,
      title: data.title,
      collectionType: data.collection_type as DocumentCollectionType,
      relatedType: data.related_type as DocumentRelatedType | null,
      relatedId: data.related_id,
      assetLinks,
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

  const submittedAssetTargets = getDocumentAssetTargetsFromForm(formData);
  const submittedRelationType = (getString(formData, "asset_relation_type") || "related") as DocumentAssetRelationType;
  const submittedAssetLinks = buildDocumentAssetLinkInputs(submittedAssetTargets, submittedRelationType, getOptionalString(formData, "asset_note"));
  const relatedType = metadata.data.related_type as DocumentRelatedType | null;
  const collection = await getDocumentCollectionForUpload(supabase, metadata.data.collection_id);

  if (metadata.data.collection_id && !collection) {
    return documentResultError("文档包不存在，请重新创建批次。");
  }

  const collectionAssetLinks = await getCollectionAssetLinksForUpload(supabase, collection?.id ?? null);
  const collectionLegacyLinks = collection?.related_type && collection.related_id
    ? buildDocumentAssetLinkInputs([{
        asset_type: collection.related_type as DocumentRelatedType,
        asset_id: collection.related_id
      }], "related", null)
    : [];
  const effectiveAssetLinks = mergeDocumentAssetLinks(collectionAssetLinks, collectionLegacyLinks, submittedAssetLinks);
  const primaryLink = getPrimaryAssetLink(effectiveAssetLinks);
  const effectiveRelatedType = (primaryLink?.asset_type ?? collection?.related_type ?? relatedType) as DocumentRelatedType | null;
  const effectiveRelatedId = primaryLink?.asset_id ?? collection?.related_id ?? metadata.data.related_id;
  const relatedExists = await ensureRelatedRecordExists(supabase, effectiveRelatedType, effectiveRelatedId);
  const assetLinksExist = await ensureDocumentAssetLinksExist(supabase, effectiveAssetLinks);

  if (!relatedExists || !assetLinksExist) {
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
      relatedId: effectiveRelatedId,
      assetLinks: effectiveAssetLinks
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

  const relatedExists = await ensureRelatedRecordExists(supabase, relatedType, metadata.data.related_id);
  const assetLinksExist = await ensureDocumentAssetLinksExist(supabase, upload.assetLinks);

  if (!relatedExists || !assetLinksExist) {
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

  const linkInsertResult = await insertDocumentAssetLinks(supabase, [data.id], upload.assetLinks, actorId);

  if (!linkInsertResult.ok) {
    await supabase.from("documents").delete().eq("id", data.id);
    await supabase.storage.from(WORKSPACE_FILES_BUCKET).remove([upload.storagePath]);
    return documentResultError(linkInsertResult.message);
  }

  await writeActivityLog({
    action: "document.upload",
    entityType: "document",
    entityId: data.id,
    metadata: {
      name: data.name,
      collection_id: metadata.data.collection_id,
      related_type: data.related_type,
      related_id: data.related_id,
      asset_link_count: upload.assetLinks.length
    }
  });

  await refreshDocumentCollectionStats(supabase, metadata.data.collection_id);
  revalidateDocumentPaths({
    documentId: data.id,
    collectionId: metadata.data.collection_id,
    relatedType: data.related_type as DocumentRelatedType | null,
    relatedId: data.related_id
  });
  revalidateDocumentAssetLinks(upload.assetLinks);

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
    visibility: getString(formData, "visibility"),
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
    .select("id,name,category,collection_id,visibility,related_type,related_id")
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
      visibility: metadata.data.visibility,
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
      old_visibility: existing.visibility,
      new_visibility: metadata.data.visibility,
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
  revalidatePublicDocumentAttachmentPaths();

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

export async function syncDocumentCollectionRelationsAction(id: string, formData: FormData) {
  const { supabase, isAdmin, error } = await getAdminClient();
  const detailPath = `/dashboard/documents/collections/${id}`;

  if (!supabase || !isAdmin) {
    redirect(`${detailPath}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const relatedValues = relatedValuesFromForm(formData);
  const syncAction = getString(formData, "collection_sync_action");
  const parsed = documentCollectionRelationSyncSchema.safeParse({
    collection_sync_action: syncAction,
    related_type: syncAction === "unlink" ? null : relatedValues.related_type,
    related_id: syncAction === "unlink" ? null : relatedValues.related_id
  });

  if (!parsed.success) {
    redirect(`${detailPath}?error=${encodeFormError(parsed.error.issues[0]?.message ?? "请检查文档包同步信息。")}`);
  }

  const nextRelatedType = parsed.data.collection_sync_action === "unlink"
    ? null
    : parsed.data.related_type as DocumentRelatedType | null;
  const nextRelatedId = parsed.data.collection_sync_action === "unlink" ? null : parsed.data.related_id;
  const relatedExists = await ensureRelatedRecordExists(supabase, nextRelatedType, nextRelatedId);

  if (!relatedExists) {
    redirect(`${detailPath}?error=${encodeFormError("目标关联对象不存在，请重新选择。")}`);
  }

  const { data: collection, error: fetchError } = await supabase
    .from("document_collections")
    .select("id,title,collection_type,related_type,related_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !collection) {
    redirect(`${detailPath}?error=${encodeFormError(fetchError?.message || "文档包不存在或无权限访问。")}`);
  }

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id,collection_id,related_type,related_id")
    .eq("collection_id", id);

  if (documentsError) {
    redirect(`${detailPath}?error=${encodeFormError(documentsError.message || "读取文档包内文件失败。")}`);
  }

  const documentsInCollection = documents ?? [];
  const oldRelatedType = collection.related_type as DocumentRelatedType | null;
  const oldRelatedId = collection.related_id;
  const oldDocumentRelations = uniqueRelationKeys(documentsInCollection);
  const documentRollbackGroups = documentsInCollection.reduce<Array<{
    documentIds: string[];
    relatedType: DocumentRelatedType | null;
    relatedId: string | null;
  }>>((groups, document) => {
    const relatedType = document.related_type as DocumentRelatedType | null;
    const relatedId = document.related_id;
    const existingGroup = groups.find((group) => group.relatedType === relatedType && group.relatedId === relatedId);

    if (existingGroup) {
      existingGroup.documentIds.push(document.id);
    } else {
      groups.push({
        documentIds: [document.id],
        relatedType,
        relatedId
      });
    }

    return groups;
  }, []);

  const { error: documentsUpdateError } = await supabase
    .from("documents")
    .update({
      related_type: nextRelatedType,
      related_id: nextRelatedId
    })
    .eq("collection_id", id);

  if (documentsUpdateError) {
    console.error("syncDocumentCollectionRelationsAction documents update failed", {
      collectionId: id,
      code: documentsUpdateError.code,
      message: documentsUpdateError.message
    });
    redirect(`${detailPath}?error=${encodeFormError(documentsUpdateError.message || "同步包内文件关联失败，文档包关联未修改。")}`);
  }

  const { error: collectionUpdateError } = await supabase
    .from("document_collections")
    .update({
      related_type: nextRelatedType,
      related_id: nextRelatedId
    })
    .eq("id", id);

  if (collectionUpdateError) {
    console.error("syncDocumentCollectionRelationsAction collection update failed", {
      collectionId: id,
      code: collectionUpdateError.code,
      message: collectionUpdateError.message
    });

    let rollbackFailed = false;

    for (const group of documentRollbackGroups) {
      const { error: rollbackError } = await supabase
        .from("documents")
        .update({
          related_type: group.relatedType,
          related_id: group.relatedId
        })
        .in("id", group.documentIds);

      if (rollbackError) {
        rollbackFailed = true;
        console.error("syncDocumentCollectionRelationsAction documents rollback failed", {
          collectionId: id,
          code: rollbackError.code,
          message: rollbackError.message
        });
      }
    }

    if (rollbackFailed) {
      redirect(`${detailPath}?error=${encodeFormError("文档包关联更新失败，且包内文件回滚未完全成功，请检查文档包内文件关联后重试。")}`);
    }

    redirect(`${detailPath}?error=${encodeFormError(collectionUpdateError.message || "文档包关联更新失败，包内文件已尝试恢复原关联。")}`);
  }

  const isUnlink = parsed.data.collection_sync_action === "unlink";
  const syncedAssetLinks = nextRelatedType && nextRelatedId
    ? buildDocumentAssetLinkInputs([{ asset_type: nextRelatedType, asset_id: nextRelatedId }], "related", null)
    : [];

  if (isUnlink) {
    await supabase.from("document_collection_asset_links").delete().eq("collection_id", id);

    if (documentsInCollection.length > 0) {
      await supabase
        .from("document_asset_links")
        .delete()
        .in("document_id", documentsInCollection.map((document) => document.id));
    }
  } else {
    await insertDocumentCollectionAssetLinks(supabase, [id], syncedAssetLinks, null);
    await insertDocumentAssetLinks(supabase, documentsInCollection.map((document) => document.id), syncedAssetLinks, null);
  }

  await writeActivityLog({
    action: isUnlink ? "document_collection.bulk_unlink" : "document_collection.sync_relations",
    entityType: "document_collection",
    entityId: id,
    metadata: {
      collection_id: id,
      document_count: documentsInCollection.length,
      old_related_type: collection.related_type,
      old_related_id: collection.related_id,
      ...(isUnlink ? {} : {
        new_related_type: nextRelatedType,
        new_related_id: nextRelatedId
      })
    }
  });

  revalidateDocumentPaths({
    collectionId: id,
    relatedType: oldRelatedType,
    relatedId: oldRelatedId
  });
  revalidateDocumentPaths({
    collectionId: id,
    relatedType: nextRelatedType,
    relatedId: nextRelatedId
  });
  revalidateDocumentAssetLinks(syncedAssetLinks);

  for (const relation of oldDocumentRelations) {
    revalidateDocumentPaths({
      relatedType: relation.relatedType,
      relatedId: relation.relatedId
    });
  }

  const notice = isUnlink ? "collection_relations_unlinked" : "collection_relations_synced";
  redirect(`${detailPath}?notice=${notice}&count=${documentsInCollection.length}`);
}

export async function addDocumentAssetLinksAction(formData: FormData) {
  const returnTo = getSafeDashboardReturnTo(getOptionalString(formData, "return_to"));
  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(error ?? "当前账号没有管理员权限。") }));
  }

  const assetTargets = getDocumentAssetTargetsFromForm(formData);
  const parsed = addDocumentAssetLinksSchema.safeParse({
    document_ids: getDocumentIdsFromForm(formData),
    asset_links: assetTargets,
    relation_type: getString(formData, "asset_relation_type") || "related",
    note: getOptionalString(formData, "asset_note"),
    return_to: returnTo
  });

  if (!parsed.success) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(parsed.error.issues[0]?.message ?? "请检查关联信息。")
    }));
  }

  const assetLinks = buildDocumentAssetLinkInputs(
    parsed.data.asset_links as Array<{ asset_type: DocumentRelatedType; asset_id: string }>,
    parsed.data.relation_type as DocumentAssetRelationType,
    parsed.data.note
  );
  const assetLinksExist = await ensureDocumentAssetLinksExist(supabase, assetLinks);

  if (!assetLinksExist) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError("关联对象不存在，请重新选择。") }));
  }

  const { data: documents, error: fetchError } = await supabase
    .from("documents")
    .select("id,collection_id,related_type,related_id")
    .in("id", parsed.data.document_ids);

  if (fetchError || !documents || documents.length !== parsed.data.document_ids.length) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(fetchError?.message || "部分文件不存在或没有权限访问。")
    }));
  }

  const insertResult = await insertDocumentAssetLinks(supabase, parsed.data.document_ids, assetLinks, actorId);

  if (!insertResult.ok) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(insertResult.message) }));
  }

  await setDocumentPrimaryRelationIfEmpty(supabase, parsed.data.document_ids, getPrimaryAssetLink(assetLinks));

  await writeActivityLog({
    action: "document.asset_links.add",
    entityType: "document",
    entityId: parsed.data.document_ids[0],
    metadata: {
      document_ids: parsed.data.document_ids,
      document_count: parsed.data.document_ids.length,
      asset_links: assetLinks.map((link) => ({
        asset_type: link.asset_type,
        asset_id: link.asset_id,
        relation_type: link.relation_type
      }))
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath(getDashboardPathname(returnTo));

  for (const documentId of parsed.data.document_ids) {
    revalidatePath(`/dashboard/documents/${documentId}`);
  }

  for (const collectionId of uniqueNullableValues(documents.map((document) => document.collection_id))) {
    revalidatePath(`/dashboard/documents/collections/${collectionId}`);
  }

  revalidateDocumentAssetLinks(assetLinks);

  redirect(getReturnPathWithMessage(returnTo, {
    notice: "document_asset_links_added",
    count: `${parsed.data.document_ids.length}`
  }));
}

export async function removeDocumentAssetLinkAction(linkId: string, formData: FormData) {
  const returnTo = getSafeDashboardReturnTo(getOptionalString(formData, "return_to"));
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(error ?? "当前账号没有管理员权限。") }));
  }

  const parsed = removeDocumentAssetLinkSchema.safeParse({
    return_to: returnTo
  });

  if (!parsed.success) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(parsed.error.issues[0]?.message ?? "请检查移除关联信息。")
    }));
  }

  const { data: link, error: fetchError } = await supabase
    .from("document_asset_links")
    .select("id,document_id,asset_type,asset_id,relation_type")
    .eq("id", linkId)
    .maybeSingle();

  if (fetchError || !link) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(fetchError?.message || "关联记录不存在。") }));
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id,collection_id,related_type,related_id")
    .eq("id", link.document_id)
    .maybeSingle();

  const { error: deleteError } = await supabase
    .from("document_asset_links")
    .delete()
    .eq("id", linkId);

  if (deleteError) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(deleteError.message || "移除文件关联失败。") }));
  }

  if (
    document &&
    link.relation_type === "related" &&
    document.related_type === link.asset_type &&
    document.related_id === link.asset_id
  ) {
    await supabase
      .from("documents")
      .update({ related_type: null, related_id: null })
      .eq("id", link.document_id);
  }

  await writeActivityLog({
    action: "document.asset_link.remove",
    entityType: "document",
    entityId: link.document_id,
    metadata: {
      document_id: link.document_id,
      asset_type: link.asset_type,
      asset_id: link.asset_id,
      relation_type: link.relation_type
    }
  });

  revalidateDocumentPaths({
    documentId: link.document_id,
    collectionId: document?.collection_id,
    relatedType: link.asset_type as DocumentRelatedType,
    relatedId: link.asset_id
  });
  revalidatePath(getDashboardPathname(returnTo));
  revalidatePublicDocumentAttachmentPaths();

  redirect(getReturnPathWithMessage(returnTo, { notice: "document_asset_link_removed" }));
}

export async function bulkRemoveDocumentAssetLinksAction(formData: FormData) {
  const returnTo = getSafeDashboardReturnTo(getOptionalString(formData, "return_to"));
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(error ?? "当前账号没有管理员权限。") }));
  }

  const relatedValues = relatedValuesFromForm(formData);
  const removeScope = getString(formData, "remove_scope") || "specific";
  const parsed = bulkRemoveDocumentAssetLinksSchema.safeParse({
    document_ids: getDocumentIdsFromForm(formData),
    remove_scope: removeScope,
    asset_type: removeScope === "all" ? null : relatedValues.related_type,
    asset_id: removeScope === "all" ? null : relatedValues.related_id,
    clear_confirm: getOptionalString(formData, "clear_confirm"),
    return_to: returnTo
  });

  if (!parsed.success) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(parsed.error.issues[0]?.message ?? "请检查移除关联信息。")
    }));
  }

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id,collection_id,related_type,related_id")
    .in("id", parsed.data.document_ids);

  if (documentsError || !documents || documents.length !== parsed.data.document_ids.length) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(documentsError?.message || "部分文件不存在或没有权限访问。")
    }));
  }

  const { data: existingLinks } = await supabase
    .from("document_asset_links")
    .select("asset_type,asset_id")
    .in("document_id", parsed.data.document_ids);

  let linksQuery = supabase
    .from("document_asset_links")
    .delete()
    .in("document_id", parsed.data.document_ids);

  if (parsed.data.remove_scope === "specific" && parsed.data.asset_type && parsed.data.asset_id) {
    linksQuery = linksQuery
      .eq("asset_type", parsed.data.asset_type)
      .eq("asset_id", parsed.data.asset_id);
  }

  const { error: deleteError } = await linksQuery;

  if (deleteError) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(deleteError.message || "批量移除文件关联失败。") }));
  }

  if (parsed.data.remove_scope === "all") {
    await supabase
      .from("documents")
      .update({ related_type: null, related_id: null })
      .in("id", parsed.data.document_ids);
  } else if (parsed.data.asset_type && parsed.data.asset_id) {
    await supabase
      .from("documents")
      .update({ related_type: null, related_id: null })
      .in("id", parsed.data.document_ids)
      .eq("related_type", parsed.data.asset_type)
      .eq("related_id", parsed.data.asset_id);
  }

  await writeActivityLog({
    action: parsed.data.remove_scope === "all" ? "document.asset_links.clear" : "document.asset_links.remove",
    entityType: "document",
    entityId: parsed.data.document_ids[0],
    metadata: {
      document_ids: parsed.data.document_ids,
      document_count: parsed.data.document_ids.length,
      remove_scope: parsed.data.remove_scope,
      asset_type: parsed.data.asset_type,
      asset_id: parsed.data.asset_id
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath(getDashboardPathname(returnTo));

  for (const documentId of parsed.data.document_ids) {
    revalidatePath(`/dashboard/documents/${documentId}`);
  }

  for (const collectionId of uniqueNullableValues(documents.map((document) => document.collection_id))) {
    revalidatePath(`/dashboard/documents/collections/${collectionId}`);
  }

  if (parsed.data.asset_type && parsed.data.asset_id) {
    revalidateDocumentPaths({
      relatedType: parsed.data.asset_type as DocumentRelatedType,
      relatedId: parsed.data.asset_id
    });
  } else {
    const affectedLinkRelations = (existingLinks ?? []).map((link) => ({
      relatedType: link.asset_type as DocumentRelatedType,
      relatedId: link.asset_id as string
    }));
    const affectedLegacyRelations = uniqueRelationKeys(documents);
    const affectedRelations = Array.from(new Map(
      [...affectedLinkRelations, ...affectedLegacyRelations].map((relation) => [
        `${relation.relatedType}:${relation.relatedId}`,
        relation
      ])
    ).values());

    for (const relation of affectedRelations) {
      revalidateDocumentPaths({
        relatedType: relation.relatedType,
        relatedId: relation.relatedId
      });
    }
  }
  revalidatePublicDocumentAttachmentPaths();

  redirect(getReturnPathWithMessage(returnTo, {
    notice: parsed.data.remove_scope === "all" ? "document_asset_links_cleared" : "document_asset_links_removed",
    count: `${parsed.data.document_ids.length}`
  }));
}

export async function addDocumentCollectionAssetLinksAction(collectionId: string, formData: FormData) {
  const returnTo = getSafeDashboardReturnTo(getOptionalString(formData, "return_to")) || `/dashboard/documents/collections/${collectionId}`;
  const { supabase, isAdmin, actorId, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(error ?? "当前账号没有管理员权限。") }));
  }

  const assetTargets = getDocumentAssetTargetsFromForm(formData);
  const parsed = addDocumentCollectionAssetLinksSchema.safeParse({
    asset_links: assetTargets,
    relation_type: getString(formData, "asset_relation_type") || "related",
    note: getOptionalString(formData, "asset_note"),
    apply_to_documents: getBooleanFromForm(formData, "apply_to_documents"),
    return_to: returnTo
  });

  if (!parsed.success) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(parsed.error.issues[0]?.message ?? "请检查文档包关联信息。")
    }));
  }

  const { data: collection, error: collectionError } = await supabase
    .from("document_collections")
    .select("id,related_type,related_id")
    .eq("id", collectionId)
    .maybeSingle();

  if (collectionError || !collection) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(collectionError?.message || "文档包不存在。") }));
  }

  const assetLinks = buildDocumentAssetLinkInputs(
    parsed.data.asset_links as Array<{ asset_type: DocumentRelatedType; asset_id: string }>,
    parsed.data.relation_type as DocumentAssetRelationType,
    parsed.data.note
  );
  const assetLinksExist = await ensureDocumentAssetLinksExist(supabase, assetLinks);

  if (!assetLinksExist) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError("关联对象不存在，请重新选择。") }));
  }

  const collectionInsert = await insertDocumentCollectionAssetLinks(supabase, [collectionId], assetLinks, actorId);

  if (!collectionInsert.ok) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(collectionInsert.message) }));
  }

  await setCollectionPrimaryRelationIfEmpty(supabase, [collectionId], getPrimaryAssetLink(assetLinks));

  let syncedDocumentCount = 0;

  if (parsed.data.apply_to_documents) {
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("id")
      .eq("collection_id", collectionId);

    if (documentsError) {
      redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(documentsError.message || "读取包内文件失败。") }));
    }

    const documentIds = (documents ?? []).map((document) => document.id as string);
    const documentInsert = await insertDocumentAssetLinks(supabase, documentIds, assetLinks, actorId);

    if (!documentInsert.ok) {
      redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(documentInsert.message) }));
    }

    await setDocumentPrimaryRelationIfEmpty(supabase, documentIds, getPrimaryAssetLink(assetLinks));
    syncedDocumentCount = documentIds.length;

    for (const documentId of documentIds) {
      revalidatePath(`/dashboard/documents/${documentId}`);
    }
  }

  await writeActivityLog({
    action: "document_collection.asset_links.add",
    entityType: "document_collection",
    entityId: collectionId,
    metadata: {
      collection_id: collectionId,
      apply_to_documents: parsed.data.apply_to_documents,
      synced_document_count: syncedDocumentCount,
      asset_links: assetLinks.map((link) => ({
        asset_type: link.asset_type,
        asset_id: link.asset_id,
        relation_type: link.relation_type
      }))
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/documents/collections/${collectionId}`);
  revalidatePath(getDashboardPathname(returnTo));
  revalidateDocumentAssetLinks(assetLinks);

  redirect(getReturnPathWithMessage(returnTo, {
    notice: parsed.data.apply_to_documents ? "collection_asset_links_added_to_documents" : "collection_asset_links_added",
    count: `${syncedDocumentCount}`
  }));
}

export async function removeDocumentCollectionAssetLinkAction(linkId: string, formData: FormData) {
  const returnTo = getSafeDashboardReturnTo(getOptionalString(formData, "return_to"));
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(error ?? "当前账号没有管理员权限。") }));
  }

  const parsed = removeDocumentCollectionAssetLinkSchema.safeParse({
    apply_to_documents: getBooleanFromForm(formData, "apply_to_documents"),
    return_to: returnTo
  });

  if (!parsed.success) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(parsed.error.issues[0]?.message ?? "请检查移除文档包关联信息。")
    }));
  }

  const { data: link, error: fetchError } = await supabase
    .from("document_collection_asset_links")
    .select("id,collection_id,asset_type,asset_id,relation_type")
    .eq("id", linkId)
    .maybeSingle();

  if (fetchError || !link) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(fetchError?.message || "文档包关联记录不存在。") }));
  }

  const { data: collection } = await supabase
    .from("document_collections")
    .select("id,related_type,related_id")
    .eq("id", link.collection_id)
    .maybeSingle();

  const { error: deleteError } = await supabase
    .from("document_collection_asset_links")
    .delete()
    .eq("id", linkId);

  if (deleteError) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(deleteError.message || "移除文档包关联失败。") }));
  }

  if (
    collection &&
    link.relation_type === "related" &&
    collection.related_type === link.asset_type &&
    collection.related_id === link.asset_id
  ) {
    await supabase
      .from("document_collections")
      .update({ related_type: null, related_id: null })
      .eq("id", link.collection_id);
  }

  let syncedDocumentCount = 0;

  if (parsed.data.apply_to_documents) {
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("id,related_type,related_id")
      .eq("collection_id", link.collection_id);

    if (documentsError) {
      redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(documentsError.message || "读取包内文件失败。") }));
    }

    const documentIds = (documents ?? []).map((document) => document.id as string);

    if (documentIds.length > 0) {
      const { error: documentLinkDeleteError } = await supabase
        .from("document_asset_links")
        .delete()
        .in("document_id", documentIds)
        .eq("asset_type", link.asset_type)
        .eq("asset_id", link.asset_id)
        .eq("relation_type", link.relation_type);

      if (documentLinkDeleteError) {
        redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(documentLinkDeleteError.message || "移除包内文件关联失败。") }));
      }

      const { error: legacyUpdateError } = await supabase
        .from("documents")
        .update({ related_type: null, related_id: null })
        .in("id", documentIds)
        .eq("related_type", link.asset_type)
        .eq("related_id", link.asset_id);

      if (legacyUpdateError) {
        redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(legacyUpdateError.message || "清理包内文件主关联失败。") }));
      }

      syncedDocumentCount = documentIds.length;

      for (const documentId of documentIds) {
        revalidatePath(`/dashboard/documents/${documentId}`);
      }
    }
  }

  await writeActivityLog({
    action: "document_collection.asset_link.remove",
    entityType: "document_collection",
    entityId: link.collection_id,
    metadata: {
      collection_id: link.collection_id,
      asset_type: link.asset_type,
      asset_id: link.asset_id,
      relation_type: link.relation_type,
      apply_to_documents: parsed.data.apply_to_documents,
      synced_document_count: syncedDocumentCount
    }
  });

  revalidateDocumentPaths({
    collectionId: link.collection_id,
    relatedType: link.asset_type as DocumentRelatedType,
    relatedId: link.asset_id
  });
  revalidatePath(getDashboardPathname(returnTo));
  revalidatePublicDocumentAttachmentPaths();

  redirect(getReturnPathWithMessage(returnTo, {
    notice: parsed.data.apply_to_documents ? "collection_asset_link_removed_from_documents" : "collection_asset_link_removed",
    count: `${syncedDocumentCount}`
  }));
}

export async function bulkUpdateDocumentRelationsAction(formData: FormData) {
  const returnTo = getSafeDashboardReturnTo(getOptionalString(formData, "return_to"));
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(error ?? "当前账号没有管理员权限。") }));
  }

  const relatedValues = relatedValuesFromForm(formData);
  const bulkAction = getString(formData, "bulk_action");
  const documentIds = getDocumentIdsFromForm(formData);
  const parsed = documentBulkRelationSchema.safeParse({
    bulk_action: bulkAction,
    document_ids: documentIds,
    related_type: bulkAction === "unlink" ? null : relatedValues.related_type,
    related_id: bulkAction === "unlink" ? null : relatedValues.related_id,
    return_to: returnTo
  });

  if (!parsed.success) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(parsed.error.issues[0]?.message ?? "请检查批量操作信息。")
    }));
  }

  const nextRelatedType = parsed.data.bulk_action === "unlink"
    ? null
    : parsed.data.related_type as DocumentRelatedType | null;
  const nextRelatedId = parsed.data.bulk_action === "unlink" ? null : parsed.data.related_id;
  const relatedExists = await ensureRelatedRecordExists(supabase, nextRelatedType, nextRelatedId);

  if (!relatedExists) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError("目标关联对象不存在，请重新选择。") }));
  }

  const { data: existingDocuments, error: fetchError } = await supabase
    .from("documents")
    .select("id,collection_id,related_type,related_id")
    .in("id", parsed.data.document_ids);

  if (fetchError) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(fetchError.message || "读取文件记录失败。")
    }));
  }

  if (!existingDocuments || existingDocuments.length !== parsed.data.document_ids.length) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError("部分文件不存在或没有权限访问。") }));
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      related_type: nextRelatedType,
      related_id: nextRelatedId
    })
    .in("id", parsed.data.document_ids);

  if (updateError) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(updateError.message || "批量更新文件关联失败。") }));
  }

  const legacyAssetLinks = nextRelatedType && nextRelatedId
    ? buildDocumentAssetLinkInputs([{ asset_type: nextRelatedType, asset_id: nextRelatedId }], "related", null)
    : [];

  if (parsed.data.bulk_action !== "unlink") {
    await insertDocumentAssetLinks(supabase, parsed.data.document_ids, legacyAssetLinks, null);
  }

  const action = parsed.data.bulk_action === "unlink" ? "document.bulk_unlink" : "document.bulk_update_relations";
  await writeActivityLog({
    action,
    entityType: "document",
    entityId: parsed.data.document_ids[0],
    metadata: {
      document_ids: parsed.data.document_ids,
      document_count: parsed.data.document_ids.length,
      new_related_type: nextRelatedType,
      new_related_id: nextRelatedId
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath(getDashboardPathname(returnTo));

  for (const collectionId of uniqueNullableValues(existingDocuments.map((document) => document.collection_id))) {
    revalidatePath(`/dashboard/documents/collections/${collectionId}`);
  }

  for (const relation of uniqueRelationKeys(existingDocuments)) {
    revalidateDocumentPaths({
      relatedType: relation.relatedType,
      relatedId: relation.relatedId
    });
  }

  revalidateDocumentPaths({
    relatedType: nextRelatedType,
    relatedId: nextRelatedId
  });
  revalidateDocumentAssetLinks(legacyAssetLinks);

  const notice = parsed.data.bulk_action === "unlink" ? "bulk_unlinked" : "bulk_relations_updated";
  redirect(getReturnPathWithMessage(returnTo, {
    notice,
    count: `${parsed.data.document_ids.length}`
  }));
}

export async function bulkUpdateDocumentVisibilityAction(formData: FormData) {
  const returnTo = getSafeDashboardReturnTo(getOptionalString(formData, "return_to"));
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(error ?? "当前账号没有管理员权限。") }));
  }

  const parsed = documentBulkVisibilitySchema.safeParse({
    document_ids: getDocumentIdsFromForm(formData),
    visibility: getString(formData, "visibility"),
    return_to: returnTo
  });

  if (!parsed.success) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(parsed.error.issues[0]?.message ?? "请检查批量权限信息。")
    }));
  }

  const { data: existingDocuments, error: fetchError } = await supabase
    .from("documents")
    .select("id,collection_id,visibility,related_type,related_id")
    .in("id", parsed.data.document_ids);

  if (fetchError) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(fetchError.message || "读取文件记录失败。")
    }));
  }

  if (!existingDocuments || existingDocuments.length !== parsed.data.document_ids.length) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError("部分文件不存在或没有权限访问。") }));
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      visibility: parsed.data.visibility
    })
    .in("id", parsed.data.document_ids);

  if (updateError) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(updateError.message || "批量更新文件权限失败。") }));
  }

  await writeActivityLog({
    action: "document.bulk_update_visibility",
    entityType: "document",
    entityId: parsed.data.document_ids[0],
    metadata: {
      document_ids: parsed.data.document_ids,
      document_count: parsed.data.document_ids.length,
      old_visibility_counts: existingDocuments.reduce<Record<string, number>>((counts, document) => {
        const visibility = String(document.visibility ?? "unknown");
        counts[visibility] = (counts[visibility] ?? 0) + 1;
        return counts;
      }, {}),
      new_visibility: parsed.data.visibility
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath(getDashboardPathname(returnTo));
  revalidatePublicDocumentAttachmentPaths();

  for (const collectionId of uniqueNullableValues(existingDocuments.map((document) => document.collection_id))) {
    revalidatePath(`/dashboard/documents/collections/${collectionId}`);
  }

  for (const relation of uniqueRelationKeys(existingDocuments)) {
    revalidateDocumentPaths({
      relatedType: relation.relatedType,
      relatedId: relation.relatedId
    });
  }

  redirect(getReturnPathWithMessage(returnTo, {
    notice: "documents_visibility_updated",
    count: `${parsed.data.document_ids.length}`
  }));
}

export async function bulkDeleteDocumentsAction(formData: FormData) {
  const returnTo = getSafeDashboardReturnTo(getOptionalString(formData, "return_to"));
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(error ?? "当前账号没有管理员权限。") }));
  }

  const parsed = documentBulkDeleteSchema.safeParse({
    document_ids: getDocumentIdsFromForm(formData),
    delete_confirm: getOptionalString(formData, "delete_confirm"),
    return_to: returnTo
  });

  if (!parsed.success) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(parsed.error.issues[0]?.message ?? "请检查批量删除信息。")
    }));
  }

  const { data: documents, error: fetchError } = await supabase
    .from("documents")
    .select("id,name,storage_bucket,storage_path,collection_id,related_type,related_id")
    .in("id", parsed.data.document_ids);

  if (fetchError) {
    redirect(getReturnPathWithMessage(returnTo, {
      error: encodeFormError(fetchError.message || "读取文件记录失败。")
    }));
  }

  if (!documents || documents.length !== parsed.data.document_ids.length) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError("部分文件不存在或没有权限访问。") }));
  }

  const documentsToDelete = documents as DocumentDeletionRecord[];
  const collectionIds = uniqueNullableValues(documentsToDelete.map((document) => document.collection_id));
  const relatedSummaries = getRelatedSummaries(documentsToDelete);
  const deleteResult = await deleteDocumentRecordsFromStorageAndDatabase(supabase, documentsToDelete);

  if (!deleteResult.ok) {
    redirect(getReturnPathWithMessage(returnTo, { error: encodeFormError(deleteResult.message) }));
  }

  await writeActivityLog({
    action: "document.bulk_delete",
    entityType: "document",
    entityId: parsed.data.document_ids[0],
    metadata: {
      document_ids: parsed.data.document_ids,
      document_count: parsed.data.document_ids.length,
      collection_ids: collectionIds,
      related_summaries: relatedSummaries
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath(getDashboardPathname(returnTo));

  for (const documentId of parsed.data.document_ids) {
    revalidatePath(`/dashboard/documents/${documentId}`);
  }

  for (const collectionId of collectionIds) {
    revalidatePath(`/dashboard/documents/collections/${collectionId}`);
  }

  for (const relation of uniqueRelationKeys(documentsToDelete)) {
    revalidateDocumentPaths({
      relatedType: relation.relatedType,
      relatedId: relation.relatedId
    });
  }
  revalidatePublicDocumentAttachmentPaths();

  redirect(getReturnPathWithMessage(returnTo, {
    notice: "documents_deleted",
    count: `${parsed.data.document_ids.length}`
  }));
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

export async function deleteDocumentCollectionWithFilesAction(id: string, formData: FormData) {
  const { supabase, isAdmin, error } = await getAdminClient();
  const collectionPath = `/dashboard/documents/collections/${id}`;

  if (!supabase || !isAdmin) {
    redirect(`${collectionPath}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const parsed = documentCollectionDeleteWithFilesSchema.safeParse({
    confirmation_text: getString(formData, "confirmation_text")
  });

  if (!parsed.success) {
    redirect(`${collectionPath}?error=${encodeFormError(parsed.error.issues[0]?.message ?? "请检查删除确认文本。")}`);
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

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id,name,storage_bucket,storage_path,collection_id,related_type,related_id")
    .eq("collection_id", id);

  if (documentsError) {
    redirect(`${collectionPath}?error=${encodeFormError(documentsError.message || "读取文档包内文件失败。")}`);
  }

  const documentsToDelete = (documents ?? []) as DocumentDeletionRecord[];
  const oldDocumentRelations = uniqueRelationKeys(documentsToDelete);
  const deleteResult = await deleteDocumentRecordsFromStorageAndDatabase(supabase, documentsToDelete);

  if (!deleteResult.ok) {
    redirect(`${collectionPath}?error=${encodeFormError(deleteResult.message)}`);
  }

  const { error: deleteCollectionError } = await supabase
    .from("document_collections")
    .delete()
    .eq("id", id);

  if (deleteCollectionError) {
    console.error("document collection delete failed after deleting files", {
      collectionId: id,
      code: deleteCollectionError.code,
      message: deleteCollectionError.message
    });
    redirect(`${collectionPath}?error=${encodeFormError("文件已删除，但文档包记录删除失败，请人工复核文档包。")}`);
  }

  const relatedType = collection.related_type as DocumentRelatedType | null;
  const relatedId = collection.related_id;

  await writeActivityLog({
    action: "document_collection.delete_with_files",
    entityType: "document_collection",
    entityId: id,
    metadata: {
      collection_id: id,
      document_count: documentsToDelete.length,
      related_type: collection.related_type,
      related_id: collection.related_id
    }
  });

  revalidateDocumentPaths({
    collectionId: id,
    relatedType,
    relatedId
  });

  for (const document of documentsToDelete) {
    revalidatePath(`/dashboard/documents/${document.id}`);
  }

  for (const relation of oldDocumentRelations) {
    revalidateDocumentPaths({
      relatedType: relation.relatedType,
      relatedId: relation.relatedId
    });
  }
  revalidatePublicDocumentAttachmentPaths();

  redirect(`/dashboard/documents?notice=collection_deleted_with_files&count=${documentsToDelete.length}`);
}

export async function deleteDocumentAction(id: string) {
  const { supabase, isAdmin, error } = await getAdminClient();

  if (!supabase || !isAdmin) {
    redirect(`/dashboard/documents/${id}?error=${encodeFormError(error ?? "当前账号没有管理员权限。")}`);
  }

  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select("id,name,storage_bucket,storage_path,collection_id,related_type,related_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !document) {
    redirect(`/dashboard/documents/${id}?error=${encodeFormError(fetchError?.message || "文件记录不存在。")}`);
  }

  const documentToDelete = document as DocumentDeletionRecord;
  const deleteResult = await deleteDocumentRecordsFromStorageAndDatabase(supabase, [documentToDelete]);

  if (!deleteResult.ok) {
    redirect(`/dashboard/documents/${id}?error=${encodeFormError(deleteResult.message)}`);
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

  revalidateDocumentPaths({
    documentId: id,
    collectionId: documentToDelete.collection_id,
    relatedType: documentToDelete.related_type as DocumentRelatedType | null,
    relatedId: documentToDelete.related_id
  });
  revalidatePublicDocumentAttachmentPaths();
  redirect("/dashboard/documents?notice=documents_deleted&count=1");
}
