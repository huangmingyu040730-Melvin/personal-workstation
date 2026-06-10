import { createMarketBriefAction } from "@/actions/market-briefs";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { MarketBriefForm } from "@/components/forms/market-brief-form";
import { PageHeader } from "@/components/page-header";
import { getFormError } from "@/lib/forms";

export default async function NewMarketBriefPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader eyebrow="Market Briefs" title="新建市场简报" description="手工创建每日市场收评。保存后写入 Supabase market_briefs 表。" />
        <AdminFormSurface
          sidebar={
            <>
              <AdminFormHelpCard
                title="本阶段边界"
                description="当前只做后台手工录入和管理。"
                items={["不自动抓取行情。", "不调用 AI 生成。", "不发送邮件或同步 Notion。", "不提供公开简报页。"]}
              />
              <AdminFormHelpCard
                title="录入建议"
                tone="slate"
                items={["标题建议包含日期和市场。", "数据来源只记录来源名称或公开说明。", "风险提示避免写成投资建议或个股推荐。"]}
              />
            </>
          }
        >
          <MarketBriefForm action={createMarketBriefAction} error={getFormError(params)} />
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}
