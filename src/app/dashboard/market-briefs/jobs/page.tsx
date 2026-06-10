import Link from "next/link";
import { ArrowLeft, FileText, ListChecks } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { Select, TextInput } from "@/components/forms/form-fields";
import { PageHeader } from "@/components/page-header";
import { getMarketBriefJobStatusLabel, marketBriefJobStatuses } from "@/lib/content-options";
import type { MarketBriefGenerationJobRecord } from "@/lib/content-types";
import { formatDate, formatDateTime, formatRelative } from "@/lib/format";
import { getFormError } from "@/lib/forms";
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
          description="查看“获取今日市场动态”和外部 Skill Runner 回写产生的任务记录。"
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
                    <th className="px-3 py-3 font-semibold">市场</th>
                    <th className="px-3 py-3 font-semibold">状态</th>
                    <th className="px-3 py-3 font-semibold">Runner</th>
                    <th className="px-3 py-3 font-semibold">生成简报</th>
                    <th className="px-3 py-3 font-semibold">错误</th>
                    <th className="px-3 py-3 font-semibold">运行时间</th>
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
  return (
    <tr className="align-top text-slate-700">
      <td className="whitespace-nowrap px-3 py-4">{formatDate(job.brief_date)}</td>
      <td className="whitespace-nowrap px-3 py-4">{job.market}</td>
      <td className="whitespace-nowrap px-3 py-4">
        <Badge className={getMarketBriefJobStatusTone(job.status)}>{getMarketBriefJobStatusLabel(job.status)}</Badge>
      </td>
      <td className="whitespace-nowrap px-3 py-4 text-slate-500">{job.runner_name}</td>
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
        <Link href={`/dashboard/market-briefs/jobs/${job.id}`} className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          <ListChecks size={14} />
          详情
        </Link>
      </td>
    </tr>
  );
}

function NoticeBanner({ message }: { message: string }) {
  return <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>;
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
