import { getAdminClient } from "@/lib/auth/admin";
import { createAttachmentHeaders, getMarketBriefDownloadFilename } from "@/lib/market-brief-downloads";
import { buildMarketBriefDocx } from "@/lib/market-brief-docx";
import { getMarketBriefById } from "@/lib/queries/market-briefs";

export const runtime = "nodejs";

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

  try {
    const filename = getMarketBriefDownloadFilename(brief, "docx");
    const buffer = await buildMarketBriefDocx(brief);

    return new Response(new Uint8Array(buffer), {
      headers: createAttachmentHeaders(filename, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    });
  } catch (exportError) {
    console.error("market brief docx export failed", {
      briefId: id,
      message: exportError instanceof Error ? exportError.message : "unknown"
    });

    return textResponse("无法导出 Word，请稍后重试。", 500);
  }
}

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "private, no-store" }
  });
}
