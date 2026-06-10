import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminContentCard, AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { Select, TextInput } from "@/components/forms/form-fields";
import { PageHeader } from "@/components/page-header";
import { getMarketBriefStatusLabel, marketBriefStatuses } from "@/lib/content-options";
import type { MarketBriefRecord } from "@/lib/content-types";
import { formatDate, formatRelative } from "@/lib/format";
import { getMarketBriefStatusTone } from "@/lib/market-briefs";
import { getMarketBriefFilterOptions, getMarketBriefs } from "@/lib/queries/market-briefs";

export default async function MarketBriefsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const filters = {
    q: params.q ?? "",
    status: params.status ?? "all",
    market: params.market ?? "all",
    tag: params.tag ?? "all"
  };
  const [briefs, filterOptions] = await Promise.all([
    getMarketBriefs(filters),
    getMarketBriefFilterOptions()
  ]);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Market Briefs"
          title="市场简报"
          description="手工维护每日市场收评和研究简报。当前阶段不自动抓取行情、不调用 AI、不发送邮件。"
          action={
            <Link href="/dashboard/market-briefs/new" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800">
              <Plus size={16} />
              新建简报
            </Link>
          }
        />

        <AdminSection title="筛选" description="按日期倒序展示；可搜索标题 / 摘要，并按状态、市场和标签过滤。">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px_160px_auto]">
            <TextInput name="q" defaultValue={filters.q} placeholder="搜索标题 / 摘要" />
            <Select name="status" defaultValue={filters.status}>
              <option value="all">全部状态</option>
              {marketBriefStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
            <Select name="market" defaultValue={filters.market}>
              <option value="all">全部市场</option>
              {filterOptions.markets.map((market) => (
                <option key={market} value={market}>
                  {market}
                </option>
              ))}
            </Select>
            <Select name="tag" defaultValue={filters.tag}>
              <option value="all">全部标签</option>
              {filterOptions.tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Select>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
          </form>
        </AdminSection>

        {briefs.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {briefs.map((brief) => (
              <MarketBriefCard key={brief.id} brief={brief} />
            ))}
          </div>
        ) : (
          <AdminEmptyState
            title="暂无市场简报"
            description="暂无市场简报。你可以先手动新建一篇每日市场收评，后续再接入自动生成。"
            action={<Link href="/dashboard/market-briefs/new" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建市场简报</Link>}
          />
        )}
      </AdminPageSurface>
    </AppShell>
  );
}

function MarketBriefCard({ brief }: { brief: MarketBriefRecord }) {
  return (
    <AdminContentCard href={`/dashboard/market-briefs/${brief.id}`} className="hover:border-blue-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className={getMarketBriefStatusTone(brief.status)}>{getMarketBriefStatusLabel(brief.status)}</Badge>
            <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{brief.market}</Badge>
            {brief.is_featured ? <Badge className="bg-amber-50 text-amber-700 ring-amber-100">精选</Badge> : null}
          </div>
          <h2 className="text-lg font-semibold text-slate-950">{brief.title}</h2>
          {brief.summary ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{brief.summary}</p> : null}
        </div>
        <BarChart3 className="shrink-0 text-blue-700" size={22} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {brief.tags.length > 0 ? brief.tags.slice(0, 5).map((tag) => <Badge key={tag} className="bg-slate-50 text-slate-600 ring-slate-200">{tag}</Badge>) : <span className="text-xs text-slate-400">暂无标签</span>}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span>{formatDate(brief.brief_date)}</span>
        <span>更新于 {formatRelative(brief.updated_at)}</span>
      </div>
    </AdminContentCard>
  );
}
