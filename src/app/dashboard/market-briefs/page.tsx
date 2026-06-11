import Link from "next/link";
import { BarChart3, Download, Eye, FileText, ListChecks, Plus, Sparkles } from "lucide-react";
import { generateMarketBriefForDateAction, generateTodayMarketBriefAction } from "@/actions/market-briefs";
import { AppShell } from "@/components/app-shell";
import { AdminContentCard, AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { Select, TextInput } from "@/components/forms/form-fields";
import { SubmitButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { getMarketBriefGenerationStatusLabel, getMarketBriefStatusLabel, marketBriefStatuses } from "@/lib/content-options";
import type { MarketBriefRecord } from "@/lib/content-types";
import { formatDate, formatRelative } from "@/lib/format";
import { getNearestPreviousAShareTradingDay } from "@/lib/a-share-trading-calendar";
import { hasMarketBriefMarkdownContent } from "@/lib/market-brief-markdown";
import { getTodayDateInShanghai } from "@/lib/market-brief-runner";
import { getMarketBriefGenerationStatusTone, getMarketBriefStatusTone } from "@/lib/market-briefs";
import { getMarketBriefSearchPublicInfo } from "@/lib/market-brief-search";
import { getMarketBriefFilterOptions, getMarketBriefs } from "@/lib/queries/market-briefs";

export default async function MarketBriefsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const filters = {
    q: params.q ?? "",
    status: params.status ?? "all",
    market: params.market ?? "all",
    tag: params.tag ?? "all"
  };
  const error = params.error;
  const notice = params.notice;
  const today = getTodayDateInShanghai();
  const nearestTradingDay = getNearestPreviousAShareTradingDay(today);
  const searchInfo = getMarketBriefSearchPublicInfo();
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
          description="系统会先检索公开市场信息，再调用 AI 生成固定模板市场简报，并附带结构化图表数据。生成结果默认需要人工复核，不构成投资建议。"
          action={
            <div className="flex flex-wrap gap-2">
              <form action={generateTodayMarketBriefAction}>
                <input type="hidden" name="market" value="A股" />
                <SubmitButton pendingLabel="生成中...">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={16} />
                    获取今日市场动态
                  </span>
                </SubmitButton>
              </form>
              <Link href="/dashboard/market-briefs/new" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">
                <Plus size={16} />
                新建手工简报
              </Link>
              <Link href="/dashboard/market-briefs/jobs" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">
                <ListChecks size={16} />
                生成任务
              </Link>
            </div>
          }
        />

        <AdminSection title="AI 市场动态生成" description="保留今日生成入口，也支持指定历史交易日补生成。生成前会先检索公开市场信息；若搜索服务未配置，生成任务会失败并提示配置方式。">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <Badge className="bg-blue-50 text-blue-700 ring-blue-100">今日：{today}</Badge>
                <Badge className="bg-slate-50 text-slate-600 ring-slate-200">默认市场：A股</Badge>
                <Badge className="bg-violet-50 text-violet-700 ring-violet-100">生成器：AI-first</Badge>
              </div>
              <p className="mb-4 text-sm leading-6 text-slate-600">仅当今天为 A 股交易日时创建任务；如果已有同日同市场简报或排队 / 运行中任务，会直接跳转到对应记录。</p>
              <form action={generateTodayMarketBriefAction}>
                <input type="hidden" name="market" value="A股" />
                <SubmitButton pendingLabel="生成中...">
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={16} />
                    获取今日市场动态
                  </span>
                </SubmitButton>
              </form>
            </div>

            <form action={generateMarketBriefForDateAction} className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-100">历史补生成</Badge>
                {nearestTradingDay ? <Badge className="bg-slate-50 text-slate-600 ring-slate-200">最近交易日：{nearestTradingDay}</Badge> : null}
              </div>
              <p className="mb-4 text-sm leading-6 text-slate-600">仅支持选择 A 股交易日。周末、节假日、未来日期不可生成；历史日期会提示可能无法完整回溯。</p>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                <TextInput type="date" name="brief_date" defaultValue={nearestTradingDay ?? today} max={today} required />
                <Select name="market" defaultValue="A股">
                  <option value="A股">A股</option>
                </Select>
              </div>
              <div className="mt-4">
                <SubmitButton pendingLabel="创建中...">生成历史市场动态</SubmitButton>
              </div>
            </form>
          </div>
        </AdminSection>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {notice === "exists" ? <NoticeBanner tone="blue" message="该日期市场简报已存在，已保留原记录。" /> : null}
        {!searchInfo.isConfigured ? <NoticeBanner tone="blue" message="市场简报搜索服务未配置，AI 无法生成可靠行情数据；点击生成后任务会失败并提示配置 MARKET_BRIEF_SEARCH_PROVIDER 和 MARKET_BRIEF_SEARCH_API_KEY。" /> : null}

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

function NoticeBanner({ message, tone }: { message: string; tone: "blue" | "emerald" }) {
  const className = tone === "emerald"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-blue-200 bg-blue-50 text-blue-700";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${className}`}>{message}</div>;
}

function MarketBriefCard({ brief }: { brief: MarketBriefRecord }) {
  return (
    <AdminContentCard className="hover:border-blue-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge className={getMarketBriefStatusTone(brief.status)}>{getMarketBriefStatusLabel(brief.status)}</Badge>
            <Badge className={getMarketBriefGenerationStatusTone(brief.generation_status)}>{getMarketBriefGenerationStatusLabel(brief.generation_status)}</Badge>
            <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{brief.market}</Badge>
            {brief.is_featured ? <Badge className="bg-amber-50 text-amber-700 ring-amber-100">精选</Badge> : null}
            {hasMarketBriefMarkdownContent(brief) ? <Badge className="bg-violet-50 text-violet-700 ring-violet-100">有 Markdown</Badge> : <Badge className="bg-slate-50 text-slate-500 ring-slate-200">结构化合成</Badge>}
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
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Link href={`/dashboard/market-briefs/${brief.id}`} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          <FileText size={14} />
          详情
        </Link>
        <Link href={`/dashboard/market-briefs/${brief.id}/preview`} className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-100">
          <Eye size={14} />
          预览
        </Link>
        <Link href={`/dashboard/market-briefs/${brief.id}/download/markdown`} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          <Download size={14} />
          下载 MD
        </Link>
        <Link href={`/dashboard/market-briefs/${brief.id}/download/docx`} className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100">
          <Download size={14} />
          下载 Word
        </Link>
      </div>
    </AdminContentCard>
  );
}
