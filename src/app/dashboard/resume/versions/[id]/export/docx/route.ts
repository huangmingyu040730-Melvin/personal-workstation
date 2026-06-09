import { getAdminClient } from "@/lib/auth/admin";
import { getProfileFallback, getPublicProfile } from "@/lib/queries/profile";
import { getResumeItems, getResumeVersionWithItems } from "@/lib/queries/resume";
import { buildResumeDocx, getExportableResumeItems, getResumeDocxFilename } from "@/lib/resume-docx";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { isAdmin, error } = await getAdminClient();

  if (!isAdmin) {
    return new Response(error ?? "请先登录管理员账号。", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  const [version, publicProfile, basicItems] = await Promise.all([
    getResumeVersionWithItems(id),
    getPublicProfile(),
    getResumeItems({ itemType: "basic", visibility: "all" })
  ]);

  if (!version) {
    return new Response("未找到该简历版本。", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  if (getExportableResumeItems(version).length === 0) {
    return new Response("当前简历版本暂无可导出内容，请先选择简历素材。", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }

  try {
    const profile = publicProfile ?? getProfileFallback();
    const visibleItems = version.resume_version_items.filter((item) => item.is_visible && item.resume_items);
    const selectedBasicItem = visibleItems.find((item) => item.resume_items?.item_type === "basic")?.resume_items ?? null;
    const latestBasicItem = [...basicItems].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null;
    const basicItem = selectedBasicItem ?? latestBasicItem;
    const filename = getResumeDocxFilename({ version, profile, basicItem });
    const buffer = await buildResumeDocx({ version, profile, basicItem });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${encodeAsciiFilename(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "cache-control": "private, no-store"
      }
    });
  } catch (exportError) {
    console.error("resume docx export failed", {
      versionId: id,
      message: exportError instanceof Error ? exportError.message : "unknown"
    });
    return new Response("无法导出 Word，请稍后重试。", {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
}

function encodeAsciiFilename(filename: string) {
  return filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
}
