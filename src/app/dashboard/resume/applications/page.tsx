import Link from "next/link";
import { BriefcaseBusiness, Columns3, Filter, List, Search, Send, Trophy, UserRoundCheck, XCircle } from "lucide-react";
import { updateResumeJdReviewStatusAction } from "@/actions/resume-jd-reviews";
import { AppShell } from "@/components/app-shell";
import { AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import type { ResumeJdReviewRecord } from "@/lib/content-types";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getResumeVersions } from "@/lib/queries/resume";
import { getResumeApplicationFilterOptions, getResumeApplicationStats, getResumeJdReviews } from "@/lib/queries/resume-jd-reviews";
import { getResumeJdReviewStatusLabel, getResumeJdReviewStatusTone, resumeJdReviewStatusOptions } from "@/lib/resume-jd-review-options";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ResumeApplicationsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const filters = {
    q: getQueryValue(query.q),
    status: getQueryValue(query.status) || "all",
    versionId: getQueryValue(query.versionId) || "all",
    direction: getQueryValue(query.direction) || "all",
    channel: getQueryValue(query.channel) || "all"
  };
  const view = getQueryValue(query.view) === "list" ? "list" : "board";
  const [allReviews, filteredReviews, versions] = await Promise.all([
    getResumeJdReviews(),
    getResumeJdReviews(filters),
    getResumeVersions()
  ]);
  const stats = getResumeApplicationStats(allReviews);
  const filterOptions = getResumeApplicationFilterOptions(allReviews);
  const sourcePath = buildSourcePath(query);
  const error = getFormError(query);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Application Board"
          title="投递看板"
          description="基于已保存的 JD 分析记录，按投递状态管理求职 pipeline。这里只做进度管理，不自动投递、不发送邮件。"
          action={
            <Link href="/dashboard/resume/versions" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
              <BriefcaseBusiness size={16} />
              从简历版本开始分析
            </Link>
          }
        />

        <ResumeTabs active="applications" />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{decodeURIComponent(error)}</div> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <ApplicationMetric label="总投递记录" value={stats.total} icon={<BriefcaseBusiness size={20} />} />
          <ApplicationMetric label="已投递" value={stats.submitted} icon={<Send size={20} />} />
          <ApplicationMetric label="面试中" value={stats.interview} icon={<UserRoundCheck size={20} />} />
          <ApplicationMetric label="Offer" value={stats.offer} icon={<Trophy size={20} />} />
          <ApplicationMetric label="被拒" value={stats.rejected} icon={<XCircle size={20} />} />
          <ApplicationMetric label="本周新增" value={stats.weekNew} icon={<BriefcaseBusiness size={20} />} />
        </div>

        <AdminSection title="筛选和搜索" description="按公司、岗位、状态、简历版本、岗位方向或投递渠道定位记录。">
          <form className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_160px_220px_180px_180px_auto]">
            <input type="hidden" name="view" value={view} />
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="搜索公司 / 岗位"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <FilterSelect name="status" defaultValue={filters.status} label="全部状态">
              {resumeJdReviewStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="versionId" defaultValue={filters.versionId} label="全部简历版本">
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.title}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="direction" defaultValue={filters.direction} label="全部岗位方向">
              {filterOptions.directions.map((direction) => (
                <option key={direction} value={direction}>
                  {direction}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect name="channel" defaultValue={filters.channel} label="全部投递渠道">
              {filterOptions.channels.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </FilterSelect>
            <div className="flex gap-2">
              <button className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">筛选</button>
              <Link href={`/dashboard/resume/applications?view=${view}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                重置
              </Link>
            </div>
          </form>
        </AdminSection>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-2 shadow-soft">
          <div className="px-3 text-sm text-slate-500">当前筛选结果：{filteredReviews.length} 条</div>
          <div className="flex gap-2">
            <Link href={buildViewPath(query, "board")} className={view === "board" ? activeViewClass : inactiveViewClass}>
              <Columns3 size={16} />
              看板视图
            </Link>
            <Link href={buildViewPath(query, "list")} className={view === "list" ? activeViewClass : inactiveViewClass}>
              <List size={16} />
              列表视图
            </Link>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <AdminEmptyState
            title="暂无投递记录"
            description="你可以先从某个简历版本进入 AI JD 优化，保存分析结果后会自动出现在这里。"
            action={<Link href="/dashboard/resume/versions" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">选择简历版本</Link>}
          />
        ) : view === "list" ? (
          <ApplicationList reviews={filteredReviews} sourcePath={sourcePath} />
        ) : (
          <ApplicationBoard reviews={filteredReviews} sourcePath={sourcePath} />
        )}
      </AdminPageSurface>
    </AppShell>
  );
}

function ResumeTabs({ active }: { active: "items" | "versions" | "applications" | "jdReviews" }) {
  const tabs = [
    { label: "素材库", href: "/dashboard/resume", key: "items" },
    { label: "简历版本", href: "/dashboard/resume/versions", key: "versions" },
    { label: "投递看板", href: "/dashboard/resume/applications", key: "applications" },
    { label: "JD 分析记录", href: "/dashboard/resume/jd-reviews", key: "jdReviews" }
  ] as const;

  return (
    <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-soft">
      {tabs.map((tab) => (
        <Link key={tab.key} href={tab.href} className={active === tab.key ? "rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white" : "rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

function ApplicationBoard({ reviews, sourcePath }: { reviews: ResumeJdReviewRecord[]; sourcePath: string }) {
  return (
    <div className="grid gap-4 xl:grid-cols-4 2xl:grid-cols-8">
      {resumeJdReviewStatusOptions.map((status) => {
        const columnReviews = reviews
          .filter((review) => review.application_status === status.value)
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

        return (
          <section key={status.value} className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <Badge className={status.tone}>{status.label}</Badge>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{columnReviews.length}</span>
            </div>
            <div className="space-y-3">
              {columnReviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs leading-5 text-slate-400">暂无记录</div>
              ) : (
                columnReviews.map((review) => <ApplicationCard key={review.id} review={review} sourcePath={sourcePath} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ApplicationCard({ review, sourcePath }: { review: ResumeJdReviewRecord; sourcePath: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/dashboard/resume/jd-reviews/${review.id}`} className="line-clamp-2 text-sm font-semibold text-slate-950 hover:text-blue-700">
            {review.job_title || "未命名岗位"}
          </Link>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">{review.company_name || "未填写公司"}</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">{review.missing_keywords.length} 缺口</span>
      </div>
      <div className="mt-3 space-y-1.5 text-xs leading-5 text-slate-500">
        <p className="line-clamp-1">版本：{review.resume_versions?.title || "未知版本"}</p>
        <p className="line-clamp-1">渠道：{review.application_channel || "未填写"}</p>
        <p>更新：{formatRelative(review.updated_at)}</p>
        {review.notes ? <p className="line-clamp-2 rounded-xl bg-slate-50 p-2 text-slate-600">{review.notes}</p> : null}
      </div>
      <QuickStatusForm review={review} sourcePath={sourcePath} compact />
    </article>
  );
}

function ApplicationList({ reviews, sourcePath }: { reviews: ResumeJdReviewRecord[]; sourcePath: string }) {
  return (
    <AdminSection title="投递记录列表" description="列表视图适合筛选、搜索和批量浏览状态。">
      <div className="overflow-x-auto">
        <table className="min-w-[1100px] w-full text-left text-sm">
          <thead className="text-xs text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="py-3 pr-4 font-semibold">公司</th>
              <th className="py-3 pr-4 font-semibold">岗位</th>
              <th className="py-3 pr-4 font-semibold">状态</th>
              <th className="py-3 pr-4 font-semibold">简历版本</th>
              <th className="py-3 pr-4 font-semibold">渠道</th>
              <th className="py-3 pr-4 font-semibold">创建时间</th>
              <th className="py-3 pr-4 font-semibold">更新时间</th>
              <th className="py-3 pr-4 font-semibold">备注摘要</th>
              <th className="py-3 font-semibold">快速状态</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b border-slate-100 align-top last:border-0">
                <td className="py-4 pr-4 font-medium text-slate-900">{review.company_name || "未填写"}</td>
                <td className="py-4 pr-4">
                  <Link href={`/dashboard/resume/jd-reviews/${review.id}`} className="font-semibold text-blue-700 hover:text-blue-800">
                    {review.job_title || "未命名岗位"}
                  </Link>
                </td>
                <td className="py-4 pr-4">
                  <Badge className={getResumeJdReviewStatusTone(review.application_status)}>{getResumeJdReviewStatusLabel(review.application_status)}</Badge>
                </td>
                <td className="py-4 pr-4 text-slate-600">{review.resume_versions?.title || "未知版本"}</td>
                <td className="py-4 pr-4 text-slate-600">{review.application_channel || "未填写"}</td>
                <td className="py-4 pr-4 text-xs leading-5 text-slate-500">{formatDateTime(review.created_at)}</td>
                <td className="py-4 pr-4 text-xs leading-5 text-slate-500">{formatDateTime(review.updated_at)}</td>
                <td className="max-w-[220px] py-4 pr-4 text-slate-600">
                  <span className="line-clamp-2">{review.notes || "暂无备注"}</span>
                </td>
                <td className="py-4">
                  <QuickStatusForm review={review} sourcePath={sourcePath} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSection>
  );
}

function QuickStatusForm({ review, sourcePath, compact = false }: { review: ResumeJdReviewRecord; sourcePath: string; compact?: boolean }) {
  const action = updateResumeJdReviewStatusAction.bind(null, review.id);

  return (
    <form action={action} className={compact ? "mt-3 grid grid-cols-[1fr_auto] gap-2" : "flex min-w-[190px] gap-2"}>
      <input type="hidden" name="source_path" value={sourcePath} />
      <select
        name="application_status"
        defaultValue={review.application_status}
        className="h-9 min-w-0 rounded-xl border border-slate-200 bg-white px-2 text-xs outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
      >
        {resumeJdReviewStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button className="h-9 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700">更新</button>
    </form>
  );
}

function FilterSelect({ name, defaultValue, label, children }: { name: string; defaultValue: string; label: string; children: React.ReactNode }) {
  return (
    <label className="relative block">
      <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
      >
        <option value="all">{label}</option>
        {children}
      </select>
    </label>
  );
}

function ApplicationMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">{icon}</div>
      <p className="mt-5 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function buildSourcePath(query: SearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const current = Array.isArray(value) ? value[0] : value;
    if (current && key !== "error") {
      params.set(key, current);
    }
  }
  const suffix = params.toString();
  return suffix ? `/dashboard/resume/applications?${suffix}` : "/dashboard/resume/applications";
}

function buildViewPath(query: SearchParams, view: "board" | "list") {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const current = Array.isArray(value) ? value[0] : value;
    if (current && key !== "error") {
      params.set(key, current);
    }
  }
  params.set("view", view);
  return `/dashboard/resume/applications?${params.toString()}`;
}

const activeViewClass = "inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white";
const inactiveViewClass = "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700";
