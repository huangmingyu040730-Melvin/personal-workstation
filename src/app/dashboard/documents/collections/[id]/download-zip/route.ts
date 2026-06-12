import { NextResponse } from "next/server";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import {
  buildDocumentZipArchive,
  buildZipContentDisposition,
  getCollectionZipFileName,
  type DocumentZipRecord
} from "@/lib/storage/document-zip";

export const dynamic = "force-dynamic";

function zipError(message: string, status = 400) {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, isAdmin } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/dashboard/documents/collections/${id}`)}`, request.url));
  }

  const { data: collection, error: collectionError } = await supabase
    .from("document_collections")
    .select("id,title")
    .eq("id", id)
    .maybeSingle();

  if (collectionError) {
    console.error("collection zip fetch collection failed", {
      collectionId: id,
      code: collectionError.code,
      message: collectionError.message
    });
    return zipError(collectionError.message || "读取文档包失败。", 500);
  }

  if (!collection) {
    return zipError("文档包不存在或当前账号无权下载。", 404);
  }

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id,name,storage_bucket,storage_path,file_size,original_name,relative_path,collection_id")
    .eq("collection_id", id)
    .order("relative_path", { ascending: true })
    .order("created_at", { ascending: true });

  if (documentsError) {
    console.error("collection zip fetch documents failed", {
      collectionId: id,
      code: documentsError.code,
      message: documentsError.message
    });
    return zipError(documentsError.message || "读取文档包内文件失败。", 500);
  }

  if (!documents || documents.length === 0) {
    return zipError("当前文档包没有文件可下载。");
  }

  const result = await buildDocumentZipArchive(supabase, documents as DocumentZipRecord[], { collectionId: id });

  if (!result.ok) {
    return zipError(result.message, result.status);
  }

  await writeActivityLog({
    action: "document_collection.download_zip",
    entityType: "document_collection",
    entityId: id,
    metadata: {
      collection_id: id,
      document_count: documents.length,
      total_size: result.totalSize
    }
  });

  const fileName = getCollectionZipFileName(collection.title);
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
