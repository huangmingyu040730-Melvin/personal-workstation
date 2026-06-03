import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentRelatedType } from "@/lib/content-types";

export const WORKSPACE_FILES_BUCKET = "workspace-files";
export const MAX_DOCUMENT_FILE_SIZE = 20 * 1024 * 1024;
export const DOCUMENT_SIGNED_URL_EXPIRES_IN = 60;

const allowedFileTypes: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ppt: ["application/vnd.ms-powerpoint"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  md: ["text/markdown", "text/plain"],
  txt: ["text/plain"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  csv: ["text/csv", "application/csv"]
};

export const allowedDocumentExtensions = Object.keys(allowedFileTypes);

export function getDocumentAcceptAttribute() {
  return allowedDocumentExtensions.map((extension) => `.${extension}`).join(",");
}

function getExtension(fileName: string) {
  const cleanName = fileName.split(/[\\/]/).pop() ?? "";
  const extension = cleanName.includes(".") ? cleanName.split(".").pop()?.toLowerCase() : "";
  return extension ?? "";
}

export function sanitizeFileName(fileName: string) {
  const cleanName = (fileName.split(/[\\/]/).pop() ?? "document").replace(/\.\.+/g, ".").trim();
  const extension = getExtension(cleanName);
  const baseName = extension ? cleanName.slice(0, -(extension.length + 1)) : cleanName;
  const safeBase = baseName
    .normalize("NFKD")
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "document";

  return extension ? `${safeBase}.${extension}` : safeBase;
}

export function validateDocumentFileDescriptor(file: { name: string; type: string; size: number } | null | undefined) {
  if (!file || file.size === 0) {
    return { ok: false as const, message: "请选择需要上传的文件。" };
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return { ok: false as const, message: "文件大小不能超过 20 MB。" };
  }

  const extension = getExtension(file.name);
  const allowedMimeTypes = allowedFileTypes[extension];

  if (!extension || !allowedMimeTypes) {
    return { ok: false as const, message: "文件类型不支持，请上传 PDF、Office、Markdown、文本、图片或 CSV 文件。" };
  }

  if (!file.type || !allowedMimeTypes.includes(file.type)) {
    return { ok: false as const, message: "文件 MIME 类型与扩展名不匹配，已拒绝上传。" };
  }

  return {
    ok: true as const,
    extension,
    mimeType: file.type,
    safeFileName: sanitizeFileName(file.name)
  };
}

export function validateDocumentFile(file: File | null | undefined) {
  return validateDocumentFileDescriptor(file);
}

export function buildDocumentStoragePath({
  documentId,
  fileName,
  relatedType,
  relatedId
}: {
  documentId: string;
  fileName: string;
  relatedType?: DocumentRelatedType | null;
  relatedId?: string | null;
}) {
  if (relatedType === "publication" && relatedId) {
    return `publications/${relatedId}/${documentId}/${fileName}`;
  }

  return `documents/${documentId}/${fileName}`;
}

export async function createDocumentSignedUrl(supabase: SupabaseClient, storagePath: string) {
  return supabase.storage.from(WORKSPACE_FILES_BUCKET).createSignedUrl(storagePath, DOCUMENT_SIGNED_URL_EXPIRES_IN);
}
