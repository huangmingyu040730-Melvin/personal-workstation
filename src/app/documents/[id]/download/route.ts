import { NextResponse } from "next/server";
import { getAdminClient, writeActivityLog } from "@/lib/auth/admin";
import { createDocumentSignedUrl } from "@/lib/storage/documents";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, isAdmin } = await getAdminClient();

  if (!supabase || !isAdmin) {
    return NextResponse.redirect(new URL("/login", _request.url));
  }

  const { data: document, error } = await supabase
    .from("documents")
    .select("id,name,storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !document) {
    return NextResponse.redirect(new URL(`/documents/${id}?error=${encodeURIComponent("文件不存在或当前账号无权下载。")}`, _request.url));
  }

  const { data, error: signedUrlError } = await createDocumentSignedUrl(supabase, document.storage_path);

  if (signedUrlError || !data?.signedUrl) {
    return NextResponse.redirect(new URL(`/documents/${id}?error=${encodeURIComponent("生成临时下载链接失败，请稍后重试。")}`, _request.url));
  }

  await writeActivityLog({
    action: "document.download",
    entityType: "document",
    entityId: document.id,
    metadata: { name: document.name }
  });

  return NextResponse.redirect(data.signedUrl);
}
