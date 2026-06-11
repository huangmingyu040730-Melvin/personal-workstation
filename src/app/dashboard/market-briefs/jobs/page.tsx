import Link from "next/link";
import { ArrowLeft, Eye, FileText, ListChecks, RotateCcw, XCircle } from "lucide-react";
import { cancelMarketBriefGenerationJobAction, requeueMarketBriefGenerationJobAction } from "@/actions/market-briefs";
import { AppShell } from "@/components/app-shell";
import { AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { Select, TextInput } from "@/components/forms/form-fields";
import { PageHeader } from "@/components/page-header";
import { getMarketBriefJobStatusLabel, marketBriefJobStatuses } from "@/lib/content-options";
import type { MarketBriefGenerationJobRecord } from "@/lib/content-types";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import type { MarketBriefJobProgressStage } from "@/lib/market-brief-job-progress";
import { getMarketBriefJobProgressFromPayload } from "@/lib/market-brief-job-progress";
import { getMarketBriefJobStatusTone } from "@/lib/market-briefs";
import { getMarketBriefGenerationJobFilterOptions, getMarketBriefGenerationJobs } from "@/lib/queries/market-brief-jobs";

export default async function MarketBriefJobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = {
    status: getSearchValue(params.status) ?? "all",
    market: getSearchValue(params.market) ?? "all",
    briefDate: getSearchValue(params.brief_date) ?? ""
  };
  const [jobs, filterOptions] = await Promise.all([
    getMarketBriefGenerationJobs(filters),
    getMarketBriefGenerationJobFilterOptions()
  ]);
  const error = getFormError(params);
  const notice = getSearchValue(params.notice);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Market Brief Jobs"
          title="市场简报生成任务"
          description="查看市场简报草稿生成任务、状态、错误信息和关联简报。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/market-briefs" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <ArrowLeft size={16} />
                返回市场简报
              </Link>
            </div>
          }
        />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {notice === "active" ? <NoticeBanner message="今日同市场已有排队中或运行中的生成任务，已跳转到任务记录。" /> : null}
        {notice === "cancelled" ? <NoticeBanner message="任务已取消。" /> : null}
        {notice === "requeued" ? <NoticeBanner message="任务已重置为排队中，可再次生成简报草稿。" /> : null}

        <AdminSection title="筛选" description="按任务创建时间倒序展示；可按状态、市场和简报日期过滤。">
          <form className="grid gap-3 md:grid-cols-[180px_180px_180px_auto]">
            <Select name="status" defaultValue={filters.status}>
              <option value="all">全部状态</option>
              {marketBriefJobStatuses.map((status) => (
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
            <TextInput type="date" name="brief_date" defaultValue={filters.briefDate} />
            <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
          </form>
        </AdminSection>

        {jobs.length > 0 ? (
          <AdminSection title="任务记录" description="任务记录用于追踪生成链路，不公开展示，也不会进入 sitemap。">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-3 py-3 font-semibold">日期</th>
                    <th className="px-3 py-3 font-semibold">类型</th>
                    <th className="px-3 py-3 font-semibold">市场</th>
                    <th className="px-3 py-3 font-semibold">状态</th>
                    <th className="px-3 py-3 font-semibold">生成器</th>
                    <th className="px-3 py-3 font-semibold">来源模式</th>
                    <th className="px-3 py-3 font-semibold">生成草稿</th>
                    <th className="px-3 py-3 font-semibold">错误</th>
                    <th className="px-3 py-3 font-semibold">运行时间（北京时间）</th>
                    <th className="px-3 py-3 font-semibold">创建</th>
                    <th className="px-3 py-3 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <MarketBriefJobRow key={job.id} job={job} />
                  ))}
                </tbody>
              </table>
            </div>
          </AdminSection>
        ) : (
          <AdminEmptyState
            title="暂无生成任务"
            description="点击市场简报列表页的“获取今日市场动态”后，会先创建一条生成任务记录。"
            action={<Link href="/dashboard/market-briefs" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">返回市场简报</Link>}
          />
        )}
      </AdminPageSurface>
    </AppShell>
  );
}

function MarketBriefJobRow({ job }: { job: MarketBriefGenerationJobRecord }) {
  const progress = getMarketBriefJobProgressFromPayload(job.request_payload, getFallbackProgressStage(job.status));

  return (
    <tr className="align-top text-slate-700">
      <td className="whitespace-nowrap px-3 py-4">{formatDate(job.brief_date)}</td>
      <td className="whitespace-nowrap px-3 py-4">
        {isHistoricalJob(job) ? (
          <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-100">历史补生成</Badge>
        ) : (
          <Badge className="bg-slate-50 text-slate-600 ring-slate-200">今日生成</Badge>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-4">{job.market}</td>
      <td className="whitespace-nowrap px-3 py-4">
        <div className="space-y-2">
          <Badge className={getMarketBriefJobStatusTone(job.status)}>{getMarketBriefJobStatusLabel(job.status)}</Badge>
          <div className="min-w-36">
            <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>{progress.message}</span>
              <span className="tabular-nums">{progress.percent}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${getProgressBarClassName(job.status)}`} style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
          {job.status === "running" || job.status === "queued" ? (
            <Link href={`/dashboard/market-briefs/jobs/${job.id}${job.status === "queued" ? "?auto_generate=1" : ""}`} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              查看进度
            </Link>
          ) : null}
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-slate-500">{getGeneratorDisplayName(job)}</td>
      <td className="whitespace-nowrap px-3 py-4">
        <GroundingModeCell job={job} />
      </td>
      <td className="px-3 py-4">
        {job.market_briefs ? (
          <Link href={`/dashboard/market-briefs/${job.market_briefs.id}/preview`} className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800">
            <FileText size={14} />
            {job.market_briefs.title}
          </Link>
        ) : (
          <span className="text-slate-400">暂无</span>
        )}
      </td>
      <td className="max-w-xs px-3 py-4 text-xs leading-5 text-rose-700">{job.error_message ?? "无"}</td>
      <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500">
        <div>开始：{job.started_at ? formatDateTime(job.started_at) : "未开始"}</div>
        <div>完成：{job.completed_at ? formatDateTime(job.completed_at) : "未完成"}</div>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500">{formatRelative(job.created_at)}</td>
      <td className="whitespace-nowrap px-3 py-4">
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/market-briefs/jobs/${job.id}`} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
            <ListChecks size={14} />
            详情
          </Link>
          <MarketBriefJobQuickActions job={job} />
        </div>
      </td>
    </tr>
  );
}

function GroundingModeCell({ job }: { job: MarketBriefGenerationJobRecord }) {
  const groundingMode = getPayloadText(job.request_payload.grounding_mode);
  const materialPackageId = getPayloadText(job.request_payload.material_package_id);

  if (groundingMode === "material_package") {
    return (
      <div className="space-y-2">
        <Badge className="bg-blue-50 text-blue-700 ring-blue-100">素材包</Badge>
        {materialPackageId ? (
          <Link href={`/dashboard/market-briefs/materials/${materialPackageId}`} className="block text-xs font-semibold text-blue-700 hover:text-blue-800">
            查看素材包
          </Link>
        ) : null}
      </div>
    );
  }

  if (groundingMode === "live_fallback" || groundingMode === "live_search") {
    return <Badge className="bg-amber-50 text-amber-700 ring-amber-100">历史实时检索</Badge>;
  }

  return <span className="text-xs text-slate-400">旧任务</span>;
}

function MarketBriefJobQuickActions({ job }: { job: MarketBriefGenerationJobRecord }) {
  const returnTo = "/dashboard/market-briefs/jobs";

  if (job.status === "succeeded") {
    return job.market_briefs ? (
      <Link href={`/dashboard/market-briefs/${job.market_briefs.id}/preview`} className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-100">
        <Eye size={14} />
        查看草稿
      </Link>
    ) : null;
  }

  return (
    <>
      {job.status === "queued" || job.status === "running" ? (
        <form action={cancelMarketBriefGenerationJobAction.bind(null, job.id)}>
          <input type="hidden" name="return_to" value={returnTo} />
          <button className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:border-rose-300 hover:bg-rose-50">
            <XCircle size={14} />
            取消
          </button>
        </form>
      ) : null}
      {job.status === "running" || job.status === "failed" || job.status === "cancelled" ? (
        <form action={requeueMarketBriefGenerationJobAction.bind(null, job.id)}>
          <input type="hidden" name="return_to" value={returnTo} />
          <button className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-50">
            <RotateCcw size={14} />
            {job.status === "running" ? "重置" : "重新排队"}
          </button>
        </form>
      ) : null}
    </>
  );
}

function NoticeBanner({ message }: { message: string }) {
  return <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>;
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getFallbackProgressStage(status: string): MarketBriefJobProgressStage {
  if (status === "running") return "preparing";
  if (status === "succeeded") return "succeeded";
  if (status === "failed") return "failed";
  if (status === "cancelled") return "cancelled";
  return "queued";
}

function getProgressBarClassName(status: string) {
  if (status === "failed") return "bg-rose-500";
  if (status === "cancelled") return "bg-slate-400";
  if (status === "succeeded") return "bg-emerald-500";
  return "bg-blue-600";
}

function isHistoricalJob(job: MarketBriefGenerationJobRecord) {
  return job.request_payload?.is_historical === true;
}

function getGeneratorDisplayName(job: MarketBriefGenerationJobRecord) {
  if (job.request_payload.generator_mode === "ai" || job.runner_name === "ai-market-brief-generator") {
    return "AI 辅助简报草稿生成器";
  }

  if (job.request_payload.generator_mode === "external" || job.runner_name.includes("external")) {
    return "历史任务：旧外部生成器";
  }

  if (job.runner_name === "manual-skill-mock") {
    return "历史任务：mock 生成器";
  }

  return "历史任务：旧生成器";
}

function getPayloadText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
