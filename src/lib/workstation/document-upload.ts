import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentRelatedType } from "@/lib/content-types";
import { WORKSPACE_FILES_BUCKET } from "@/lib/storage/documents";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { WorkstationQueryResult } from "./query";
import {
  getAllowedWorkstationDocumentMimeType,
  getWorkstationDocumentExtension,
  WORKSTATION_DOCUMENT_UPLOAD_MAX_SIZE_BYTES,
  type WorkstationDocumentFinalizeInput,
  type WorkstationDocumentUploadIntentInput
} from "./document-upload-schemas";

type WorkstationSupabaseClient = SupabaseClient;

type DocumentCollectionForUpload = {
  id: string;
  related_type: string | null;
  related_id: string | null;
};

type ExistingDocumentForPath = {
  id: string;
  name: string;
  visibility: "private" | "public" | "unlisted";
  collection_id: string | null;
};

type StorageObjectInspection = {
  exists: boolean;
  sizeBytes: number | null;
  mimeType: string | null;
};

const WORKSTATION_UPLOAD_ROOT = "workstation-uploads";

function getSupabase(): WorkstationQueryResult<WorkstationSupabaseClient> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Workstation API data access is not configured.",
        status: 503
      }
    };
  }

  return { ok: true, data: supabase };
}

function createUploadId() {
  return `wup_${randomBytes(16).toString("base64url")}`;
}

export function buildWorkstationDocumentStoragePath(input: {
  collectionId: string;
  uploadId: string;
  filename: string;
}) {
  const extension = getWorkstationDocumentExtension(input.filename);
  return `${WORKSTATION_UPLOAD_ROOT}/collections/${input.collectionId}/uploads/${input.uploadId}/file.${extension}`;
}

function parseStoragePath(storagePath: string) {
  const pathParts = storagePath.split("/");
  const fileName = pathParts.pop();
  const directory = pathParts.join("/");

  if (!fileName || !directory || storagePath.includes("..") || storagePath.includes("\\") || storagePath.startsWith("/")) {
    return null;
  }

  return { directory, fileName };
}

function normalizeMimeType(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase().split(";")[0]?.trim();
  return normalized || null;
}

function readStorageObjectSize(metadata: Record<string, unknown> | null | undefined) {
  const candidates = [
    metadata?.size,
    metadata?.contentLength,
    metadata?.content_length
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === "string") {
      const parsed = Number(candidate);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readStorageObjectMimeType(metadata: Record<string, unknown> | null | undefined) {
  const candidates = [
    metadata?.mimetype,
    metadata?.mimeType,
    metadata?.contentType,
    metadata?.content_type
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return normalizeMimeType(candidate);
    }
  }

  return null;
}

async function getDocumentCollection(
  supabase: WorkstationSupabaseClient,
  collectionId: string
): Promise<WorkstationQueryResult<DocumentCollectionForUpload>> {
  const { data, error } = await supabase
    .from("document_collections")
    .select("id,related_type,related_id")
    .eq("id", collectionId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to validate document collection.",
        status: 500
      }
    };
  }

  if (!data) {
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Document collection not found.",
        status: 404
      }
    };
  }

  return { ok: true, data: data as DocumentCollectionForUpload };
}

async function inspectStorageObject(
  supabase: WorkstationSupabaseClient,
  storagePath: string
): Promise<WorkstationQueryResult<StorageObjectInspection>> {
  const parsedPath = parseStoragePath(storagePath);

  if (!parsedPath) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "storage_path is invalid.",
        status: 400
      }
    };
  }

  const { data, error } = await supabase.storage.from(WORKSPACE_FILES_BUCKET).list(parsedPath.directory, {
    limit: 100,
    search: parsedPath.fileName
  });

  if (error) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to verify uploaded object.",
        status: 500
      }
    };
  }

  const object = data?.find((item) => item.name === parsedPath.fileName);
  const metadata = object?.metadata && typeof object.metadata === "object"
    ? object.metadata as Record<string, unknown>
    : null;

  return {
    ok: true,
    data: {
      exists: Boolean(object),
      sizeBytes: readStorageObjectSize(metadata),
      mimeType: readStorageObjectMimeType(metadata)
    }
  };
}

async function findExistingDocumentByStoragePath(
  supabase: WorkstationSupabaseClient,
  storagePath: string
): Promise<WorkstationQueryResult<ExistingDocumentForPath | null>> {
  const { data, error } = await supabase
    .from("documents")
    .select("id,name,visibility,collection_id")
    .eq("storage_bucket", WORKSPACE_FILES_BUCKET)
    .eq("storage_path", storagePath)
    .limit(1);

  if (error) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to validate existing document metadata.",
        status: 500
      }
    };
  }

  return { ok: true, data: (data?.[0] ?? null) as ExistingDocumentForPath | null };
}

async function refreshCollectionStats(
  supabase: WorkstationSupabaseClient,
  collectionId: string
): Promise<WorkstationQueryResult<null>> {
  const { data, error } = await supabase
    .from("documents")
    .select("file_size")
    .eq("collection_id", collectionId);

  if (error) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error.message || "Failed to recalculate document collection stats.",
        status: 500
      }
    };
  }

  const fileSizes = (data ?? []).map((item) => Number(item.file_size ?? 0));
  const { error: updateError } = await supabase
    .from("document_collections")
    .update({
      file_count: fileSizes.length,
      total_size: fileSizes.reduce((sum, size) => sum + size, 0),
      updated_at: new Date().toISOString()
    })
    .eq("id", collectionId);

  if (updateError) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: updateError.message || "Failed to refresh document collection stats.",
        status: 500
      }
    };
  }

  return { ok: true, data: null };
}

function revalidateDocumentUploadPaths(collectionId: string, documentId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/documents");
  revalidatePath(`/dashboard/documents/collections/${collectionId}`);

  if (documentId) {
    revalidatePath(`/dashboard/documents/${documentId}`);
  }
}

export async function createWorkstationDocumentUploadIntent(
  input: WorkstationDocumentUploadIntentInput
) {
  const supabaseResult = getSupabase();

  if (!supabaseResult.ok) {
    return supabaseResult;
  }

  const collection = await getDocumentCollection(supabaseResult.data, input.collection_id);

  if (!collection.ok) {
    return collection;
  }

  const uploadId = createUploadId();
  const extension = getWorkstationDocumentExtension(input.filename);
  const storagePath = buildWorkstationDocumentStoragePath({
    collectionId: collection.data.id,
    uploadId,
    filename: input.filename
  });

  return {
    ok: true as const,
    data: {
      upload_id: uploadId,
      collection_id: collection.data.id,
      storage_path: storagePath,
      max_size_bytes: WORKSTATION_DOCUMENT_UPLOAD_MAX_SIZE_BYTES,
      allowed_mime_type: getAllowedWorkstationDocumentMimeType(extension, input.mime_type)
    }
  };
}

export async function finalizeWorkstationDocumentUpload(
  input: WorkstationDocumentFinalizeInput
) {
  const supabaseResult = getSupabase();

  if (!supabaseResult.ok) {
    return supabaseResult;
  }

  const supabase = supabaseResult.data;
  const expectedStoragePath = buildWorkstationDocumentStoragePath({
    collectionId: input.collection_id,
    uploadId: input.upload_id,
    filename: input.filename
  });

  if (input.storage_path !== expectedStoragePath) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: "storage_path does not match the server-controlled upload path.",
        status: 400
      }
    };
  }

  const collection = await getDocumentCollection(supabase, input.collection_id);

  if (!collection.ok) {
    return collection;
  }

  const existingDocument = await findExistingDocumentByStoragePath(supabase, input.storage_path);

  if (!existingDocument.ok) {
    return existingDocument;
  }

  if (existingDocument.data) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: "Document upload has already been finalized.",
        status: 409
      }
    };
  }

  const inspectedObject = await inspectStorageObject(supabase, input.storage_path);

  if (!inspectedObject.ok) {
    return inspectedObject;
  }

  if (!inspectedObject.data.exists) {
    return {
      ok: false as const,
      error: {
        code: "NOT_FOUND" as const,
        message: "Uploaded storage object was not found. Metadata was not written.",
        status: 404
      }
    };
  }

  if (inspectedObject.data.sizeBytes !== null && inspectedObject.data.sizeBytes !== input.size_bytes) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: "Uploaded object size does not match size_bytes.",
        status: 400
      }
    };
  }

  if (inspectedObject.data.mimeType !== null && inspectedObject.data.mimeType !== normalizeMimeType(input.mime_type)) {
    return {
      ok: false as const,
      error: {
        code: "VALIDATION_ERROR" as const,
        message: "Uploaded object MIME type does not match mime_type.",
        status: 400
      }
    };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      name: input.title,
      category: input.category,
      storage_bucket: WORKSPACE_FILES_BUCKET,
      storage_path: input.storage_path,
      file_size: input.size_bytes,
      mime_type: input.mime_type,
      collection_id: collection.data.id,
      original_name: input.filename,
      relative_path: null,
      folder_path: null,
      related_type: collection.data.related_type as DocumentRelatedType | null,
      related_id: collection.data.related_id,
      visibility: "private"
    })
    .select("id,name,visibility,collection_id")
    .single();

  if (error) {
    return {
      ok: false as const,
      error: {
        code: "INTERNAL_ERROR" as const,
        message: error.message || "Failed to write document metadata.",
        status: 500
      }
    };
  }

  const stats = await refreshCollectionStats(supabase, collection.data.id);

  if (!stats.ok) {
    return stats;
  }

  revalidateDocumentUploadPaths(collection.data.id, data.id);

  return {
    ok: true as const,
    data: {
      id: data.id,
      title: data.name,
      visibility: data.visibility,
      collection_id: data.collection_id
    }
  };
}
