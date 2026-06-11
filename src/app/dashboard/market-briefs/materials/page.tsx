import Link from "next/link";
import { ArrowLeft, Eye, FileSearch, ListChecks } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { MarketBriefMaterialPackageCollectForm } from "@/components/forms/market-brief-material-package-collect-form";
import { Select, TextInput } from "@/components/forms/form-fields";
import { PageHeader } from "@/components/page-header";
import type { MarketBriefMaterialPackageRecord, MarketBriefMaterialPackageStatus } from "@/lib/content-types";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import {
  getMarketBriefMaterialPackageStatusLabel,
  getMarketBriefMaterialPackageStatusTone
} from "@/lib/market-brief-material-packages";
import { getTodayDateInShanghai } from "@/lib/market-brief-runner";
import {
  getMarketBriefMaterialPackageFilterOptions,
  getMarketBriefMaterialPackages
} from "@/lib/queries/market-brief-material-packages";

const materialPackageStatuses: MarketBriefMaterialPackageStatus[] = ["collecting", "ready", "partial", "failed", "reviewed", "archived"];

export default async function MarketBriefMaterialPackagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = {
    status: getSearchValue(params.status) ?? "all",
    market: getSearchValue(params.market) ?? "all",
    packageDate: getSearchValue(params.package_date) ?? ""
  };
  const today = getTodayDateInShanghai();
  const [packages, filterOptions] = await Promise.all([
    getMarketBriefMaterialPackages(filters),
    getMarketBriefMaterialPackageFilterOptions()
  ]);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Market Materials"
          title="市场素材包"
          description="按日期沉淀公开市场来源，作为后续 AI 简报和人工复核的前置材料。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/market-briefs" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <ArrowLeft size={16} />
                返回市场简报
              </Link>
              <Link href="/dashboard/market-briefs/jobs" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <ListChecks size={16} />
                生成任务
              </Link>
            </div>
          }
        />

        <AdminSection title="手动采集" description="当前只采集并保存素材包，不生成正式 market_brief，也不会触发 AI 简报主链路。">
          <MarketBriefMaterialPackageCollectForm today={today} />
        </AdminSection>

        <AdminSection title="筛选" description="按素材日期倒序展示，可按状态、市场和日期过滤。">
          <form className="grid gap-3 md:grid-cols-[180px_180px_180px_auto]">
            <Select name="status" defaultValue={filters.status}>
              <option value="all">全部状态</option>
              {materialPackageStatuses.map((status) => (
                <option key={status} value={status}>
                  {getMarketBriefMaterialPackageStatusLabel(status)}
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
            <TextInput type="date" name="package_date" defaultValue={filters.packageDate} />
            <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
          </form>
        </AdminSection>

        {packages.length > 0 ? (
          <AdminSection title="素材包记录" description="素材包仅供后台研究流程使用，不进入公开页面、sitemap 或 viewer 访问链路。">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-3 font-semibold">日期</th>
                    <th className="px-3 py-3 font-semibold">市场</th>
                    <th className="px-3 py-3 font-semibold">状态</th>
                    <th className="px-3 py-3 font-semibold">来源</th>
                    <th className="px-3 py-3 font-semibold">Provider</th>
                    <th className="px-3 py-3 font-semibold">质量</th>
                    <th className="px-3 py-3 font-semibold">采集时间</th>
                    <th className="px-3 py-3 font-semibold">更新</th>
                    <th className="px-3 py-3 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {packages.map((item) => (
                    <MarketBriefMaterialPackageRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </AdminSection>
        ) : (
          <AdminEmptyState
            title="暂无市场素材包"
            description="先采集今日或指定日期素材包，后续再基于素材包生成正式市场简报。"
            action={<FileSearch className="mx-auto text-blue-700" size={24} />}
          />
        )}
      </AdminPageSurface>
    </AppShell>
  );
}

function MarketBriefMaterialPackageRow({ item }: { item: MarketBriefMaterialPackageRecord }) {
  return (
    <tr className="align-top text-slate-700">
      <td className="whitespace-nowrap px-3 py-4">{formatDate(item.package_date)}</td>
      <td className="whitespace-nowrap px-3 py-4">{item.market}</td>
      <td className="whitespace-nowrap px-3 py-4">
        <Badge className={getMarketBriefMaterialPackageStatusTone(item.status)}>{getMarketBriefMaterialPackageStatusLabel(item.status)}</Badge>
      </td>
      <td className="whitespace-nowrap px-3 py-4">{item.sources.length} 条</td>
      <td className="whitespace-nowrap px-3 py-4 text-slate-500">{item.provider_label ?? item.provider ?? "未配置"}</td>
      <td className="whitespace-nowrap px-3 py-4 text-slate-500">{item.quality_score === null ? "暂无" : item.quality_score.toFixed(2)}</td>
      <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500">{item.collected_at ? formatDateTime(item.collected_at) : "未采集"}</td>
      <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500">{formatRelative(item.updated_at)}</td>
      <td className="whitespace-nowrap px-3 py-4">
        <Link href={`/dashboard/market-briefs/materials/${item.id}`} className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-100">
          <Eye size={14} />
          查看
        </Link>
      </td>
    </tr>
  );
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
