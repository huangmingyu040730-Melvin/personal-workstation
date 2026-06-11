import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocumentRelatedType } from "@/lib/content-types";

export const WORKSPACE_FILES_BUCKET = "workspace-files";
export const MAX_DOCUMENT_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_DOCUMENT_BATCH_TOTAL_SIZE = 200 * 1024 * 1024;
export const MAX_DOCUMENT_BATCH_FILE_COUNT = 100;
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
  csv: ["text/csv", "application/csv", "text/plain"],
  tsv: ["text/tab-separated-values", "text/plain"],
  json: ["application/json", "text/json", "text/plain"],
  yaml: ["application/yaml", "application/x-yaml", "text/yaml", "text/x-yaml", "text/plain"],
  yml: ["application/yaml", "application/x-yaml", "text/yaml", "text/x-yaml", "text/plain"],
  ipynb: ["application/x-ipynb+json", "application/json"],
  py: ["text/x-python", "text/plain"],
  r: ["text/x-r-source", "text/plain"],
  js: ["text/javascript", "application/javascript", "text/plain"],
  ts: ["application/typescript", "text/plain", "video/mp2t"],
  sql: ["application/sql", "text/plain"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  svg: ["image/svg+xml", "text/plain"],
  zip: ["application/zip", "application/x-zip-compressed"],
  tar: ["application/x-tar"],
  gz: ["application/gzip", "application/x-gzip"],
  "7z": ["application/x-7z-compressed"]
};

const blockedDocumentExtensions = new Set(["exe", "dmg", "app", "msi", "bat", "cmd"]);

export const allowedDocumentExtensions = Object.keys(allowedFileTypes);

export function getDocumentAcceptAttribute() {
  return allowedDocumentExtensions.map((extension) => `.${extension}`).join(",");
}

function getExtension(fileName: string) {
  const cleanName = fileName.split(/[\\/]/).pop() ?? "";
  const extension = cleanName.includes(".") ? cleanName.split(".").pop()?.toLowerCase() : "";
  return extension ?? "";
}

export function hasBlockedDocumentPath(path: string) {
  return path
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .some((segment) => blockedDocumentExtensions.has(getExtension(segment)));
}

export function sanitizeFileName(fileName: string) {
  const cleanName = (fileName.split(/[\\/]/).pop() ?? "document").replace(/\.\.+/g, ".").trim();
  const extension = getExtension(cleanName);
  const baseName = extension ? cleanName.slice(0, -(extension.length + 1)) : cleanName;
  const safeBase = baseName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"|?*\u0000-\u001F]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "document";

  return extension ? `${safeBase}.${extension.toLowerCase()}` : safeBase;
}

export function sanitizePathSegment(segment: string) {
  const cleanSegment = segment
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .pop() ?? "";
  const safeSegment = cleanSegment
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.\.+/g, ".")
    .replace(/[<>:"|?*\u0000-\u001F]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/^\.+$/, "")
    .slice(0, 90);

  return safeSegment || "folder";
}

function sanitizeStoragePathSegmentWithMetadata(segment: string, fallback = "folder") {
  const cleanSegment = segment
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .pop() ?? "";
  const safeSegment = cleanSegment
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.\.+/g, ".")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .replace(/^\.+$/, "")
    .slice(0, 90);

  return safeSegment
    ? { segment: safeSegment, usedFallback: false }
    : { segment: fallback, usedFallback: true };
}

export function sanitizeStoragePathSegment(segment: string, fallback = "folder") {
  return sanitizeStoragePathSegmentWithMetadata(segment, fallback).segment;
}

export function sanitizeStorageFileName(documentId: string, fileName: string) {
  const safeDocumentId = sanitizeStoragePathSegment(documentId, "document");
  const extension = getExtension(fileName).replace(/[^a-z0-9]/g, "");

  return extension ? `${safeDocumentId}.${extension}` : safeDocumentId;
}

function sanitizeStorageFolderPath(relativePath: string) {
  const folderSegments = relativePath
    .replace(/\\/g, "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .slice(0, -1);
  const fallbackCounts = new Map<string, number>();

  return folderSegments.map((segment) => {
    const sanitized = sanitizeStoragePathSegmentWithMetadata(segment, "folder");

    if (!sanitized.usedFallback) {
      return sanitized.segment;
    }

    const nextCount = fallbackCounts.get(sanitized.segment) ?? 0;
    fallbackCounts.set(sanitized.segment, nextCount + 1);

    return nextCount === 0 ? sanitized.segment : `${sanitized.segment}-${nextCount}`;
  });
}

export function sanitizeRelativePath(relativePath: string, fallbackName = "document") {
  const normalizedPath = relativePath.replace(/\\/g, "/");
  const segments = normalizedPath
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .map((segment, index, array) => (index === array.length - 1 ? sanitizeFileName(segment) : sanitizePathSegment(segment)));

  if (segments.length === 0) {
    return sanitizeFileName(fallbackName);
  }

  return segments.join("/");
}

export function getFolderPath(relativePath: string) {
  const segments = relativePath.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return null;
  }

  return segments.slice(0, -1).join("/");
}

export function validateDocumentFileDescriptor(file: { name: string; type: string; size: number } | null | undefined) {
  if (!file || file.size === 0) {
    return { ok: false as const, message: "请选择需要上传的文件。" };
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    return { ok: false as const, message: "文件大小不能超过 50 MB。" };
  }

  const extension = getExtension(file.name);

  if (blockedDocumentExtensions.has(extension)) {
    return { ok: false as const, message: "不支持可执行安装包或脚本文件，请不要上传 exe、dmg、app、msi、bat 或 cmd。" };
  }

  const allowedMimeTypes = allowedFileTypes[extension];

  if (!extension || !allowedMimeTypes) {
    return { ok: false as const, message: "文件类型不支持，请上传 PDF、Office、Markdown、文本、CSV/TSV、JSON/YAML、Notebook、代码、图片或压缩包。" };
  }

  if (file.type && !allowedMimeTypes.includes(file.type)) {
    return { ok: false as const, message: "文件 MIME 类型与扩展名不匹配，已拒绝上传。" };
  }

  return {
    ok: true as const,
    extension,
    mimeType: file.type || allowedMimeTypes[0],
    safeFileName: sanitizeFileName(file.name)
  };
}

export function validateDocumentBatch(files: Array<{ name: string; type: string; size: number }>) {
  if (files.length === 0) {
    return { ok: false as const, message: "请选择需要上传的文件。" };
  }

  if (files.length > MAX_DOCUMENT_BATCH_FILE_COUNT) {
    return { ok: false as const, message: `单次最多上传 ${MAX_DOCUMENT_BATCH_FILE_COUNT} 个文件。` };
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > MAX_DOCUMENT_BATCH_TOTAL_SIZE) {
    return { ok: false as const, message: "单次批量上传总大小不能超过 200 MB。" };
  }

  for (const file of files) {
    const validation = validateDocumentFileDescriptor(file);

    if (!validation.ok) {
      return { ok: false as const, message: `${file.name}: ${validation.message}` };
    }
  }

  return { ok: true as const, totalSize, fileCount: files.length };
}

export function validateDocumentFile(file: File | null | undefined) {
  return validateDocumentFileDescriptor(file);
}

export function buildDocumentStoragePath({
  documentId,
  fileName,
  relatedType,
  relatedId,
  collectionId,
  relativePath
}: {
  documentId: string;
  fileName: string;
  relatedType?: DocumentRelatedType | null;
  relatedId?: string | null;
  collectionId?: string | null;
  relativePath?: string | null;
}) {
  const storageFileName = sanitizeStorageFileName(documentId, fileName);

  if (collectionId) {
    const safeFolderPath = sanitizeStorageFolderPath(relativePath || fileName);
    const storageRelativePath = [...safeFolderPath, storageFileName].join("/");

    if (relatedType && relatedId) {
      return `documents/${sanitizeStoragePathSegment(relatedType)}/${sanitizeStoragePathSegment(relatedId, "related")}/${sanitizeStoragePathSegment(collectionId, "collection")}/${storageRelativePath}`;
    }

    return `documents/general/${sanitizeStoragePathSegment(collectionId, "collection")}/${storageRelativePath}`;
  }

  if (relatedType && relatedId) {
    return `documents/${sanitizeStoragePathSegment(relatedType)}/${sanitizeStoragePathSegment(relatedId, "related")}/${sanitizeStoragePathSegment(documentId, "document")}/${storageFileName}`;
  }

  return `documents/${sanitizeStoragePathSegment(documentId, "document")}/${storageFileName}`;
}

export async function createDocumentSignedUrl(supabase: SupabaseClient, storagePath: string) {
  return supabase.storage.from(WORKSPACE_FILES_BUCKET).createSignedUrl(storagePath, DOCUMENT_SIGNED_URL_EXPIRES_IN);
}
