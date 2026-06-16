import { NextResponse, type NextRequest } from "next/server";
import { getPublicDocumentDownloadRecord, isDocumentRelatedType, type PublicDocumentAssetContext } from "@/lib/queries/public-document-attachments";
import { createDocumentSignedUrl } from "@/lib/storage/documents";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

function notFoundResponse() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

function getAssetContext(request: NextRequest): PublicDocumentAssetContext | false {
  const assetType = request.nextUrl.searchParams.get("asset_type");
  const assetId = request.nextUrl.searchParams.get("asset_id");

  if (!isDocumentRelatedType(assetType) || !assetId) {
    return false;
  }

  return {
    assetType,
    assetId
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assetContext = getAssetContext(request);

  if (assetContext === false) {
    return notFoundResponse();
  }

  const supabase = createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json({ error: "Public downloads are not configured" }, { status: 503 });
  }

  const document = await getPublicDocumentDownloadRecord(supabase, id, assetContext);

  if (!document) {
    return notFoundResponse();
  }

  const { data, error } = await createDocumentSignedUrl(supabase, document.storage_path);

  if (error || !data?.signedUrl) {
    console.error("public document signed url creation failed", { documentId: document.id, message: error?.message });
    return NextResponse.json({ error: "Download unavailable" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
