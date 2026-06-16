import type { SupabaseClient } from "@supabase/supabase-js";
import { documentAssetRelationTypes, getDocumentAssetRelationTypeLabel, getDocumentCategoryLabel } from "@/lib/content-options";
import type { DocumentAssetRelationType, DocumentCategory, DocumentRelatedType } from "@/lib/content-types";
import { WORKSPACE_FILES_BUCKET } from "@/lib/storage/documents";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const documentRelatedTypes = ["publication", "project", "knowledge", "skill"] as const;
const documentAssetRelationTypeValues = new Set(documentAssetRelationTypes.map((type) => type.value));

const publicDocumentAttachmentSelect = [
  "id",
  "name",
  "original_name",
  "category",
  "file_size",
  "mime_type",
  "updated_at",
  "storage_bucket",
  "related_type",
  "related_id"
].join(",");

type PublicDocumentAttachmentRow = {
  id: string;
  name: string | null;
  original_name: string | null;
  category: DocumentCategory | null;
  file_size: number | null;
  mime_type: string | null;
  updated_at: string | null;
  storage_bucket: string | null;
  related_type: DocumentRelatedType | null;
  related_id: string | null;
};

type PublicDocumentDownloadRow = {
  id: string;
  name: string | null;
  mime_type: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  visibility: string | null;
  related_type: DocumentRelatedType | null;
  related_id: string | null;
};

export type PublicDocumentAttachment = {
  id: string;
  name: string;
  original_name: string | null;
  category: DocumentCategory;
  category_label: string;
  file_size: number;
  mime_type: string;
  updated_at: string;
  relation_label: string | null;
  download_href: string;
};

export type PublicDocumentAssetContext = {
  assetType: DocumentRelatedType;
  assetId: string;
};

export type PublicDocumentDownloadRecord = {
  id: string;
  name: string;
  mime_type: string;
  storage_path: string;
};

export function isDocumentRelatedType(value: string | null | undefined): value is DocumentRelatedType {
  return documentRelatedTypes.includes(value as DocumentRelatedType);
}

function isDocumentAssetRelationType(value: string | null | undefined): value is DocumentAssetRelationType {
  return documentAssetRelationTypeValues.has(value as DocumentAssetRelationType);
}

function getAssetTable(assetType: DocumentRelatedType) {
  if (assetType === "publication") {
    return "publications";
  }

  if (assetType === "project") {
    return "projects";
  }

  if (assetType === "knowledge") {
    return "knowledge_notes";
  }

  return "skills";
}

async function isPublicAsset(
  supabase: SupabaseClient,
  assetType: DocumentRelatedType,
  assetId: string | null | undefined
) {
  if (!assetId) {
    return false;
  }

  const { data, error } = await supabase
    .from(getAssetTable(assetType))
    .select("id")
    .eq("id", assetId)
    .eq("visibility", "public")
    .maybeSingle();

  if (error) {
    console.error("isPublicAsset failed", { assetType, code: error.code, message: error.message });
    return false;
  }

  return Boolean(data);
}

function normalizeDocumentAssetRelationLabels(relationTypes: Array<string | null | undefined>) {
  const uniqueRelationTypes = Array.from(new Set(
    relationTypes.filter(isDocumentAssetRelationType)
  ));
  const specificRelationTypes = uniqueRelationTypes.filter((relationType) => relationType !== "related");
  const effectiveRelationTypes = specificRelationTypes.length > 0
    ? specificRelationTypes
    : uniqueRelationTypes.length > 0
      ? uniqueRelationTypes
      : ["related" as const];

  return effectiveRelationTypes.map(getDocumentAssetRelationTypeLabel).join("、");
}

async function getDocumentRelationTypesForAsset(
  supabase: SupabaseClient,
  assetType: DocumentRelatedType,
  assetId: string
) {
  const { data, error } = await supabase
    .from("document_asset_links")
    .select("document_id,relation_type")
    .eq("asset_type", assetType)
    .eq("asset_id", assetId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getDocumentRelationTypesForAsset failed", { assetType, code: error.code, message: error.message });
    return new Map<string, DocumentAssetRelationType[]>();
  }

  return ((data ?? []) as Array<{ document_id: string; relation_type: DocumentAssetRelationType }>).reduce((map, row) => {
    const current = map.get(row.document_id) ?? [];
    current.push(row.relation_type);
    map.set(row.document_id, current);
    return map;
  }, new Map<string, DocumentAssetRelationType[]>());
}

function buildPublicDocumentDownloadHref(documentId: string, assetType: DocumentRelatedType, assetId: string) {
  const params = new URLSearchParams({
    asset_type: assetType,
    asset_id: assetId
  });

  return `/public-files/${documentId}/download?${params.toString()}`;
}

function toPublicDocumentAttachment(
  row: PublicDocumentAttachmentRow,
  relationLabel: string | null,
  context: PublicDocumentAssetContext
): PublicDocumentAttachment | null {
  if (row.storage_bucket !== WORKSPACE_FILES_BUCKET) {
    return null;
  }

  const category = row.category ?? "other";

  return {
    id: row.id,
    name: row.name ?? row.original_name ?? "公开附件",
    original_name: row.original_name,
    category,
    category_label: getDocumentCategoryLabel(category),
    file_size: row.file_size ?? 0,
    mime_type: row.mime_type ?? "application/octet-stream",
    updated_at: row.updated_at ?? "",
    relation_label: relationLabel,
    download_href: buildPublicDocumentDownloadHref(row.id, context.assetType, context.assetId)
  };
}

export async function getPublicDocumentsForAsset(assetType: DocumentRelatedType, assetId: string) {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return [];
  }

  const context = { assetType, assetId };
  const assetIsPublic = await isPublicAsset(supabase, assetType, assetId);

  if (!assetIsPublic) {
    return [];
  }

  const relationTypesByDocumentId = await getDocumentRelationTypesForAsset(supabase, assetType, assetId);
  const linkedDocumentIds = Array.from(relationTypesByDocumentId.keys());
  const linkedDocumentsPromise = linkedDocumentIds.length > 0
    ? supabase
        .from("documents")
        .select(publicDocumentAttachmentSelect)
        .eq("visibility", "public")
        .eq("storage_bucket", WORKSPACE_FILES_BUCKET)
        .in("id", linkedDocumentIds)
    : Promise.resolve({ data: [], error: null });
  const legacyDocumentsPromise = supabase
    .from("documents")
    .select(publicDocumentAttachmentSelect)
    .eq("visibility", "public")
    .eq("storage_bucket", WORKSPACE_FILES_BUCKET)
    .eq("related_type", assetType)
    .eq("related_id", assetId);

  const [linkedDocumentsResult, legacyDocumentsResult] = await Promise.all([
    linkedDocumentsPromise,
    legacyDocumentsPromise
  ]);

  if (linkedDocumentsResult.error || legacyDocumentsResult.error) {
    console.error("getPublicDocumentsForAsset failed", {
      assetType,
      linked: linkedDocumentsResult.error ? { code: linkedDocumentsResult.error.code, message: linkedDocumentsResult.error.message } : null,
      legacy: legacyDocumentsResult.error ? { code: legacyDocumentsResult.error.code, message: legacyDocumentsResult.error.message } : null
    });
  }

  const attachmentsByDocumentId = new Map<string, { row: PublicDocumentAttachmentRow; relationLabel: string | null }>();

  const linkedDocumentRows = (linkedDocumentsResult.data ?? []) as unknown as PublicDocumentAttachmentRow[];
  const legacyDocumentRows = (legacyDocumentsResult.data ?? []) as unknown as PublicDocumentAttachmentRow[];

  for (const row of linkedDocumentRows) {
    attachmentsByDocumentId.set(row.id, {
      row,
      relationLabel: normalizeDocumentAssetRelationLabels(relationTypesByDocumentId.get(row.id) ?? ["related"])
    });
  }

  for (const row of legacyDocumentRows) {
    if (attachmentsByDocumentId.has(row.id)) {
      continue;
    }

    attachmentsByDocumentId.set(row.id, {
      row,
      relationLabel: getDocumentAssetRelationTypeLabel("related")
    });
  }

  return Array.from(attachmentsByDocumentId.values())
    .map(({ row, relationLabel }) => toPublicDocumentAttachment(row, relationLabel, context))
    .filter((attachment): attachment is PublicDocumentAttachment => Boolean(attachment))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

async function hasDocumentLinkToAsset(
  supabase: SupabaseClient,
  documentId: string,
  context: PublicDocumentAssetContext
) {
  const { data, error } = await supabase
    .from("document_asset_links")
    .select("id")
    .eq("document_id", documentId)
    .eq("asset_type", context.assetType)
    .eq("asset_id", context.assetId)
    .limit(1);

  if (error) {
    console.error("hasDocumentLinkToAsset failed", { assetType: context.assetType, code: error.code, message: error.message });
    return false;
  }

  return Boolean(data?.length);
}

async function hasPublicDocumentAssetAssociation(
  supabase: SupabaseClient,
  document: Pick<PublicDocumentDownloadRow, "id" | "related_type" | "related_id">,
  context: PublicDocumentAssetContext
) {
  const assetIsPublic = await isPublicAsset(supabase, context.assetType, context.assetId);

  if (!assetIsPublic) {
    return false;
  }

  if (document.related_type === context.assetType && document.related_id === context.assetId) {
    return true;
  }

  return hasDocumentLinkToAsset(supabase, document.id, context);
}

function hasSafeStoragePath(storagePath: string | null | undefined): storagePath is string {
  return (
    typeof storagePath === "string" &&
    storagePath.length > 0 &&
    storagePath.startsWith("documents/") &&
    !storagePath.includes("..") &&
    !storagePath.includes("\\")
  );
}

export async function getPublicDocumentDownloadRecord(
  supabase: SupabaseClient,
  documentId: string,
  context: PublicDocumentAssetContext
): Promise<PublicDocumentDownloadRecord | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("id,name,mime_type,storage_bucket,storage_path,visibility,related_type,related_id")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("getPublicDocumentDownloadRecord failed", { documentId, code: error.code, message: error.message });
    }

    return null;
  }

  const document = data as PublicDocumentDownloadRow;

  if (
    document.visibility !== "public" ||
    document.storage_bucket !== WORKSPACE_FILES_BUCKET ||
    !hasSafeStoragePath(document.storage_path)
  ) {
    return null;
  }

  const hasPublicAssociation = await hasPublicDocumentAssetAssociation(supabase, document, context);

  if (!hasPublicAssociation) {
    return null;
  }

  return {
    id: document.id,
    name: document.name ?? "公开附件",
    mime_type: document.mime_type ?? "application/octet-stream",
    storage_path: document.storage_path
  };
}
