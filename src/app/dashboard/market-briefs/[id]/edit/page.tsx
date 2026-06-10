import { notFound } from "next/navigation";
import { updateMarketBriefAction } from "@/actions/market-briefs";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { MarketBriefForm } from "@/components/forms/market-brief-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";
import { getMarketBriefById } from "@/lib/queries/market-briefs";

export default async function EditMarketBriefPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const brief = await getMarketBriefById(id);

  if (!brief) {
    notFound();
  }

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Market Briefs" title="编辑市场简报" description="保存后会刷新市场简报详情、列表和 Dashboard 最近市场简报。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="编辑检查"
                description="更新简报前，确认日期、市场、状态和数据来源仍然准确。"
                items={["同一市场同一日期只能保留一篇简报。", "published 只是内部状态，不会生成公开页面。", "精选只影响后台标记，当前不公开展示。"]}
              />
              <AdminFormHelpCard
                title="安全边界"
                tone="slate"
                items={["不要粘贴 API Key 或私密数据源凭证。", "不要写入 signed URL 或文件路径。", "风险提示保持研究记录性质，不写成投资建议。"]}
              />
            </>
          }
        >
          <MarketBriefForm action={updateMarketBriefAction.bind(null, brief.id)} brief={brief} error={getFormError(query)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
