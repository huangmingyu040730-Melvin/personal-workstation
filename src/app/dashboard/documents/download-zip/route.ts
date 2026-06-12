import { NextResponse } from "next/server";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import {
  buildDocumentZipArchive,
  buildZipContentDisposition,
  DOCUMENT_ZIP_LIMIT_MESSAGE,
  getDocumentsZipFileName,
  MAX_ZIP_FILES,
  type DocumentZipRecord
} from "@/lib/storage/document-zip";

export const dynamic = "force-dynamic";

function getDocumentIdsFromForm(formData: FormData) {
  return Array.from(new Set(
    formData
      .getAll("document_ids")
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
  ));
}

function zipError(message: string, status = 400) {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request: Request) {
  const { supabase, isAdmin } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent("/dashboard/documents")}`, request.url));
  }

  const formData = await request.formData();
  const documentIds = getDocumentIdsFromForm(formData);

  if (documentIds.length === 0) {
    return zipError("请至少选择一个文件。");
  }

  if (documentIds.length > MAX_ZIP_FILES) {
    return zipError(DOCUMENT_ZIP_LIMIT_MESSAGE);
  }

  const { data, error: fetchError } = await supabase
    .from("documents")
    .select("id,name,storage_bucket,storage_path,file_size,original_name,relative_path,collection_id")
    .in("id", documentIds);

  if (fetchError) {
    console.error("bulk document zip fetch failed", {
      documentIds,
      code: fetchError.code,
      message: fetchError.message
    });
    return zipError(fetchError.message || "读取文件记录失败。", 500);
  }

  if (!data || data.length !== documentIds.length) {
    return zipError("部分文件不存在或当前账号无权下载。", 404);
  }

  const documents = data as DocumentZipRecord[];
  const result = await buildDocumentZipArchive(supabase, documents);

  if (!result.ok) {
    return zipError(result.message, result.status);
  }

  await writeActivityLog({
    action: "document.bulk_download_zip",
    entityType: "document",
    entityId: documentIds[0] ?? "bulk",
    metadata: {
      document_ids: documentIds,
      document_count: documentIds.length,
      total_size: result.totalSize
    }
  });

  const fileName = getDocumentsZipFileName();
  const body = result.data.buffer.slice(
    result.data.byteOffset,
    result.data.byteOffset + result.data.byteLength
  ) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": buildZipContentDisposition(fileName),
      "Cache-Control": "no-store"
    }
  });
}
