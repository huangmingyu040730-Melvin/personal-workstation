import { getAdminClient } from "@/lib/auth/admin";
import { buildMarketBriefHtml, createAttachmentHeaders, getMarketBriefDownloadFilename } from "@/lib/market-brief-downloads";
import { getMarketBriefById } from "@/lib/queries/market-briefs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isAdmin, error } = await getAdminClient();

  if (!isAdmin) {
    return textResponse(error ?? "请先登录管理员账号。", 403);
  }

  const brief = await getMarketBriefById(id);

  if (!brief) {
    return textResponse("未找到该市场简报。", 404);
  }

  const filename = getMarketBriefDownloadFilename(brief, "html");
  return new Response(buildMarketBriefHtml(brief), {
    headers: createAttachmentHeaders(filename, "text/html; charset=utf-8")
  });
}

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "private, no-store" }
  });
}
