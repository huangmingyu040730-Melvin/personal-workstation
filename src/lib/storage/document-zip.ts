import JSZip from "jszip";
import type { SupabaseClient } from "@supabase/supabase-js";
import { WORKSPACE_FILES_BUCKET } from "@/lib/storage/documents";

export const MAX_ZIP_FILES = 50;
export const MAX_ZIP_TOTAL_BYTES = 100 * 1024 * 1024;
export const DOCUMENT_ZIP_LIMIT_MESSAGE = "文件数量或总大小超过当前 zip 下载限制，请减少文件数量后重试。";

export type DocumentZipRecord = {
  id: string;
  name: string | null;
  storage_bucket: string;
  storage_path: string;
  file_size: number | null;
  original_name: string | null;
  relative_path: string | null;
  collection_id?: string | null;
};

export type DocumentZipResult =
  | { ok: true; data: Uint8Array; totalSize: number }
  | { ok: false; message: string; status: number };

function getZipTimestamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";

  return `${value("year")}${value("month")}${value("day")}-${value("hour")}${value("minute")}`;
}

export function getDocumentsZipFileName(date = new Date()) {
  return `documents-${getZipTimestamp(date)}.zip`;
}

export function getCollectionZipFileName(title: string, date = new Date()) {
  const day = getZipTimestamp(date).slice(0, 8);
  return `${sanitizeDownloadFileName(`collection-${title}-${day}`, "collection")}.zip`;
}

export function buildZipContentDisposition(fileName: string) {
  const fallback = sanitizeAsciiFileName(fileName, "documents.zip");
  const encoded = encodeURIComponent(fileName).replace(/['()]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function buildDocumentZipArchive(
  supabase: SupabaseClient,
  documents: DocumentZipRecord[],
  options: { collectionId?: string | null } = {}
): Promise<DocumentZipResult> {
  const declaredTotalSize = documents.reduce((sum, document) => sum + Number(document.file_size ?? 0), 0);

  if (documents.length === 0) {
    return { ok: false, status: 400, message: "请至少选择一个文件。" };
  }

  if (documents.length > MAX_ZIP_FILES || declaredTotalSize > MAX_ZIP_TOTAL_BYTES) {
    return { ok: false, status: 400, message: DOCUMENT_ZIP_LIMIT_MESSAGE };
  }

  const invalidStorageRecord = documents.find((document) => (
    document.storage_bucket !== WORKSPACE_FILES_BUCKET || !document.storage_path
  ));

  if (invalidStorageRecord) {
    console.error("document zip blocked by invalid storage bucket", {
      documentId: invalidStorageRecord.id,
      collectionId: options.collectionId ?? invalidStorageRecord.collection_id ?? null
    });
    return { ok: false, status: 400, message: "文件存储位置无效，未生成 zip。" };
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();
  let totalSize = 0;

  for (const document of documents) {
    const { data, error } = await supabase.storage.from(WORKSPACE_FILES_BUCKET).download(document.storage_path);

    if (error || !data) {
      console.error("document zip storage download failed", {
        documentId: document.id,
        collectionId: options.collectionId ?? document.collection_id ?? null,
        message: error?.message ?? "Storage object missing"
      });
      return { ok: false, status: 500, message: "文件对象下载失败，未生成 zip，请稍后重试。" };
    }

    const arrayBuffer = await data.arrayBuffer();
    totalSize += document.file_size ?? arrayBuffer.byteLength;

    if (totalSize > MAX_ZIP_TOTAL_BYTES) {
      return { ok: false, status: 400, message: DOCUMENT_ZIP_LIMIT_MESSAGE };
    }

    const entryName = getUniqueZipEntryName(getDocumentEntryName(document), usedNames);
    zip.file(entryName, arrayBuffer);
  }

  try {
    const data = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    return { ok: true, data, totalSize };
  } catch (error) {
    console.error("document zip generation failed", {
      collectionId: options.collectionId ?? null,
      message: error instanceof Error ? error.message : "Unknown zip generation error"
    });
    return { ok: false, status: 500, message: "zip 生成失败，请稍后重试。" };
  }
}

function getDocumentEntryName(document: DocumentZipRecord) {
  return sanitizeZipEntryName(
    document.relative_path ?? document.original_name ?? document.name ?? document.id,
    document.id
  );
}

function sanitizeZipEntryName(value: string, fallback: string) {
  const segments = value
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => sanitizeZipSegment(segment))
    .filter(Boolean);

  return segments.join("/") || sanitizeZipSegment(fallback) || "document";
}

function sanitizeZipSegment(segment: string) {
  const safeSegment = segment
    .trim()
    .replace(/\.\.+/g, "_")
    .replace(/[<>:"|?*\u0000-\u001F\u007F]+/g, "_")
    .replace(/\s+/g, " ")
    .replace(/_+/g, "_")
    .replace(/^\.+$/, "")
    .slice(0, 120)
    .trim();

  return safeSegment === "." || safeSegment === ".." ? "" : safeSegment;
}

function getUniqueZipEntryName(entryName: string, usedNames: Set<string>) {
  const normalizedName = entryName || "document";

  if (!usedNames.has(normalizedName)) {
    usedNames.add(normalizedName);
    return normalizedName;
  }

  const pathParts = normalizedName.split("/");
  const fileName = pathParts.pop() || "document";
  const extensionIndex = fileName.lastIndexOf(".");
  const hasExtension = extensionIndex > 0 && extensionIndex < fileName.length - 1;
  const baseName = hasExtension ? fileName.slice(0, extensionIndex) : fileName;
  const extension = hasExtension ? fileName.slice(extensionIndex) : "";

  let count = 2;
  let candidate = "";

  do {
    candidate = [...pathParts, `${baseName} (${count})${extension}`].filter(Boolean).join("/");
    count += 1;
  } while (usedNames.has(candidate));

  usedNames.add(candidate);
  return candidate;
}

function sanitizeDownloadFileName(value: string, fallback: string) {
  return value
    .replace(/[/\\]+/g, "-")
    .replace(/\.\.+/g, "-")
    .replace(/[<>:"|?*\u0000-\u001F\u007F]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || fallback;
}

function sanitizeAsciiFileName(value: string, fallback: string) {
  const safeName = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

  return safeName || fallback;
}
