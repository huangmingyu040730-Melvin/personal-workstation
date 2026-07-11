import Link from "next/link";
import {
  Archive,
  BriefcaseBusiness,
  ChevronDown,
  ClipboardCheck,
  Columns3,
  FileSearch,
  Filter,
  List,
  MapPin,
  Search,
  Send,
  SlidersHorizontal,
  Trophy,
  UserRoundCheck,
  XCircle,
  type LucideIcon
} from "lucide-react";
import { updateResumeJdReviewStatusAction } from "@/actions/resume-jd-reviews";
import { AppShell } from "@/components/app-shell";
import { AdminEmptyState, AdminPageSurface } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { CareerTabs } from "@/components/career-tabs";
import { SubmitButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import type { ResumeJdReviewRecord, ResumeJdReviewStatus } from "@/lib/content-types";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getResumeVersions } from "@/lib/queries/resume";
import { getResumeApplicationFilterOptions, getResumeApplicationStats, getResumeJdReviews } from "@/lib/queries/resume-jd-reviews";
import { getResumeJdReviewStatusLabel, getResumeJdReviewStatusTone, resumeJdReviewStatusOptions } from "@/lib/resume-jd-review-options";

type SearchParams = Record<string, string | string[] | undefined>;

const preparationStatuses: ResumeJdReviewStatus[] = ["draft", "reviewed", "ready"];

const activeBoardStages: BoardStage[] = [
  { key: "preparing", label: "准备中", description: "草稿、已分析和待投递", statuses: preparationStatuses, icon: ClipboardCheck, tone: "text-blue-700 bg-blue-50 ring-blue-100" },
  { key: "submitted", label: "已投递", description: "等待后续反馈", statuses: ["submitted"], icon: Send, tone: "text-violet-700 bg-violet-50 ring-violet-100" },
  { key: "interview", label: "面试中", description: "准备与跟进面试", statuses: ["interview"], icon: UserRoundCheck, tone: "text-amber-700 bg-amber-50 ring-amber-100" },
  { key: "offer", label: "Offer", description: "已收到录用结果", statuses: ["offer"], icon: Trophy, tone: "text-emerald-700 bg-emerald-50 ring-emerald-100" },
  { key: "rejected", label: "被拒", description: "复盘后可归档", statuses: ["rejected"], icon: XCircle, tone: "text-rose-700 bg-rose-50 ring-rose-100" }
];

const archivedStage: BoardStage = {
  key: "archived",
  label: "已归档",
  description: "不再占用活跃流程",
  statuses: ["archived"],
  icon: Archive,
  tone: "text-slate-600 bg-slate-100 ring-slate-200"
};

export default async function ResumeApplicationsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const filters = {
    q: getQueryValue(query.q),
    status: getQueryValue(query.status) || "active",
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
  const advancedFilterCount = [filters.versionId, filters.direction, filters.channel].filter((value) => value !== "all").length;
  const boardStages = getBoardStages(filters.status);
  const boardReviews = filteredReviews.filter((review) => boardStages.some((stage) => stage.statuses.includes(review.application_status)));
  const visibleCount = view === "board" ? boardReviews.length : filteredReviews.length;
  const hasFilters = Boolean(filters.q) || filters.status !== "active" || advancedFilterCount > 0;

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          compact
          eyebrow="Career Pipeline"
          title="投递看板"
          description="聚焦当前正在推进的岗位，快速查看所处阶段、简历版本和下一步状态。"
          action={
            <Link href="/dashboard/resume/versions" className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800">
              <FileSearch size={16} aria-hidden="true" />
              分析新岗位
            </Link>
          }
        />

        <CareerTabs active="applications" />

        {error ? <div role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{decodeURIComponent(error)}</div> : null}

        <section aria-label="投递状态摘要" className="grid grid-cols-2 gap-px overflow-hidden border-y border-slate-200 bg-slate-200 md:grid-cols-3 xl:grid-cols-6">
          <ApplicationSummaryMetric label="进行中" value={stats.active} icon={BriefcaseBusiness} tone="blue" href="/dashboard/resume/applications?status=active" active={filters.status === "active"} />
          <ApplicationSummaryMetric label="准备中" value={stats.preparing} icon={ClipboardCheck} tone="slate" />
          <ApplicationSummaryMetric label="已投递" value={stats.submitted} icon={Send} tone="violet" href="/dashboard/resume/applications?status=submitted" active={filters.status === "submitted"} />
          <ApplicationSummaryMetric label="面试中" value={stats.interview} icon={UserRoundCheck} tone="amber" href="/dashboard/resume/applications?status=interview" active={filters.status === "interview"} />
          <ApplicationSummaryMetric label="Offer" value={stats.offer} icon={Trophy} tone="emerald" href="/dashboard/resume/applications?status=offer" active={filters.status === "offer"} />
          <ApplicationSummaryMetric label="已归档" value={stats.archived} icon={Archive} tone="slate" href="/dashboard/resume/applications?status=archived" active={filters.status === "archived"} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-950">查找投递记录</h2>
                {stats.weekNew > 0 ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">本周新增 {stats.weekNew}</span> : null}
              </div>
              <p className="mt-1 text-sm text-slate-500">当前显示 {visibleCount} 条；公司、岗位和状态是最高频筛选。</p>
            </div>
            <ViewToggle query={query} view={view} />
          </div>

          <form className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_210px_auto]">
            <input type="hidden" name="view" value={view} />
            <label className="relative">
              <span className="sr-only">搜索公司或岗位</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
              <input
                key={filters.q}
                name="q"
                defaultValue={filters.q}
                placeholder="搜索公司 / 岗位"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="relative block">
              <span className="sr-only">投递状态</span>
              <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
              <select
                key={filters.status}
                name="status"
                defaultValue={filters.status}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              >
                <option value="active">进行中的记录</option>
                <option value="all">全部状态</option>
                {resumeJdReviewStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <button className="h-11 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700">应用筛选</button>
              {hasFilters ? (
                <Link href={`/dashboard/resume/applications?view=${view}`} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700">
                  重置
                </Link>
              ) : null}
            </div>

            <details open={advancedFilterCount > 0} className="group lg:col-span-full">
              <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-sm font-semibold text-slate-600 hover:text-blue-700">
                <SlidersHorizontal size={16} aria-hidden="true" />
                更多筛选
                {advancedFilterCount > 0 ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">已选 {advancedFilterCount}</span> : null}
                <ChevronDown size={15} className="transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-3">
                <FilterSelect name="versionId" defaultValue={filters.versionId} label="全部简历版本">
                  {versions.map((version) => <option key={version.id} value={version.id}>{version.title}</option>)}
                </FilterSelect>
                <FilterSelect name="direction" defaultValue={filters.direction} label="全部岗位方向">
                  {filterOptions.directions.map((direction) => <option key={direction} value={direction}>{direction}</option>)}
                </FilterSelect>
                <FilterSelect name="channel" defaultValue={filters.channel} label="全部投递渠道">
                  {filterOptions.channels.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
                </FilterSelect>
              </div>
            </details>
          </form>
        </section>

        <section aria-labelledby="application-results-title" className="min-w-0 max-w-full space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="application-results-title" className="text-lg font-semibold text-slate-950">{view === "board" ? "当前流程" : "投递记录"}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {filters.status === "active" ? "默认隐藏已归档记录，让活跃岗位保持清晰。" : `正在查看「${getStatusFilterLabel(filters.status)}」筛选结果。`}
              </p>
            </div>
            {filters.status !== "archived" && stats.archived > 0 ? (
              <Link href={`/dashboard/resume/applications?status=archived&view=${view}`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700">
                <Archive size={15} aria-hidden="true" />
                查看 {stats.archived} 条归档记录
              </Link>
            ) : null}
          </div>

          {visibleCount === 0 ? (
            <AdminEmptyState
              title={filters.status === "active" && stats.archived > 0 ? "当前没有进行中的投递" : "没有匹配的投递记录"}
              description={filters.status === "active" && stats.archived > 0 ? "历史记录已经归档。开始分析新岗位，或切换到归档记录进行回顾。" : "调整搜索或筛选条件，也可以从一个简历版本开始新的 JD 分析。"}
              action={
                filters.status === "active" && stats.archived > 0
                  ? <Link href="/dashboard/resume/applications?status=archived" className="inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">查看归档</Link>
                  : <Link href="/dashboard/resume/versions" className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">选择简历版本</Link>
              }
            />
          ) : view === "list" ? (
            <ApplicationList reviews={filteredReviews} sourcePath={sourcePath} />
          ) : (
            <ApplicationBoard reviews={boardReviews} sourcePath={sourcePath} stages={boardStages} />
          )}
        </section>
      </AdminPageSurface>
    </AppShell>
  );
}

type BoardStage = {
  key: string;
  label: string;
  description: string;
  statuses: ResumeJdReviewStatus[];
  icon: LucideIcon;
  tone: string;
};

function ApplicationBoard({ reviews, sourcePath, stages }: { reviews: ResumeJdReviewRecord[]; sourcePath: string; stages: BoardStage[] }) {
  const desktopGridClass = stages.length === 1 ? "2xl:max-w-xl 2xl:grid-cols-1" : stages.length === 6 ? "2xl:grid-cols-6" : "2xl:grid-cols-5";

  return (
    <div className={`grid w-full max-w-full auto-cols-[minmax(270px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-3 [scrollbar-width:thin] 2xl:auto-cols-auto 2xl:grid-flow-row ${desktopGridClass}`}>
      {stages.map((stage) => {
        const columnReviews = reviews
          .filter((review) => stage.statuses.includes(review.application_status))
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        const Icon = stage.icon;

        return (
          <section key={stage.key} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex min-w-0 gap-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${stage.tone}`}>
                  <Icon size={16} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-950">{stage.label}</h3>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{stage.description}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{columnReviews.length}</span>
            </div>
            <div className="space-y-3">
              {columnReviews.length === 0 ? (
                <div className="border border-dashed border-slate-200 bg-white px-3 py-5 text-center text-xs leading-5 text-slate-400">暂无记录</div>
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
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-500">{review.company_name || "未填写公司"}</p>
          <Link href={`/dashboard/resume/jd-reviews/${review.id}`} className="mt-1 line-clamp-2 block text-sm font-semibold leading-5 text-slate-950 hover:text-blue-700">
            {review.job_title || "未命名岗位"}
          </Link>
        </div>
        <Badge className={getResumeJdReviewStatusTone(review.application_status)}>{getResumeJdReviewStatusLabel(review.application_status)}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {review.job_direction ? <span className="rounded-full bg-slate-100 px-2.5 py-1">{review.job_direction}</span> : null}
        {review.job_location ? <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><MapPin size={12} aria-hidden="true" />{review.job_location}</span> : null}
        {review.missing_keywords.length > 0 ? <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">{review.missing_keywords.length} 个缺口</span> : null}
      </div>

      <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
        <div className="flex gap-2"><dt className="shrink-0">版本</dt><dd className="min-w-0 truncate text-slate-700">{review.resume_versions?.title || "未知版本"}</dd></div>
        <div className="flex gap-2"><dt className="shrink-0">渠道</dt><dd className="min-w-0 truncate text-slate-700">{review.application_channel || "未填写"}</dd></div>
        <div className="flex gap-2"><dt className="shrink-0">更新</dt><dd className="text-slate-700">{formatRelative(review.updated_at)}</dd></div>
      </dl>

      {review.notes ? <p className="mt-3 line-clamp-2 border-l-2 border-blue-200 pl-2 text-xs leading-5 text-slate-600">{review.notes}</p> : null}
      <QuickStatusForm review={review} sourcePath={sourcePath} compact />
    </article>
  );
}

function ApplicationList({ reviews, sourcePath }: { reviews: ResumeJdReviewRecord[]; sourcePath: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="space-y-3 p-3 lg:hidden">
        {reviews.map((review) => <ApplicationCard key={review.id} review={review} sourcePath={sourcePath} />)}
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 font-semibold">公司 / 岗位</th>
              <th className="px-4 py-3 font-semibold">状态</th>
              <th className="px-4 py-3 font-semibold">简历版本</th>
              <th className="px-4 py-3 font-semibold">方向 / 渠道</th>
              <th className="px-4 py-3 font-semibold">更新时间</th>
              <th className="px-4 py-3 font-semibold">快速更新</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/70">
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-900">{review.company_name || "未填写公司"}</p>
                  <Link href={`/dashboard/resume/jd-reviews/${review.id}`} className="mt-1 block font-semibold text-blue-700 hover:text-blue-800">{review.job_title || "未命名岗位"}</Link>
                </td>
                <td className="px-4 py-4"><Badge className={getResumeJdReviewStatusTone(review.application_status)}>{getResumeJdReviewStatusLabel(review.application_status)}</Badge></td>
                <td className="max-w-[220px] px-4 py-4 text-slate-600"><span className="line-clamp-2">{review.resume_versions?.title || "未知版本"}</span></td>
                <td className="px-4 py-4 text-slate-600">
                  <p>{review.job_direction || "未填写方向"}</p>
                  <p className="mt-1 text-xs text-slate-500">{review.application_channel || "未填写渠道"}</p>
                </td>
                <td className="px-4 py-4 text-xs leading-5 text-slate-500">{formatDateTime(review.updated_at)}<br />{formatRelative(review.updated_at)}</td>
                <td className="px-4 py-4"><QuickStatusForm review={review} sourcePath={sourcePath} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuickStatusForm({ review, sourcePath, compact = false }: { review: ResumeJdReviewRecord; sourcePath: string; compact?: boolean }) {
  const action = updateResumeJdReviewStatusAction.bind(null, review.id);

  return (
    <form action={action} className={compact ? "mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2" : "flex min-w-[210px] gap-2"}>
      <input type="hidden" name="source_path" value={sourcePath} />
      <label className="min-w-0 flex-1">
        <span className="sr-only">更新 {review.company_name || "当前公司"} {review.job_title || "当前岗位"} 的状态</span>
        <select
          name="application_status"
          defaultValue={review.application_status}
          className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        >
          {resumeJdReviewStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <SubmitButton pendingLabel="更新中" className="h-9 rounded-lg px-3 py-0 text-xs">更新</SubmitButton>
    </form>
  );
}

function ViewToggle({ query, view }: { query: SearchParams; view: "board" | "list" }) {
  return (
    <div role="group" aria-label="切换投递记录视图" className="inline-flex w-fit rounded-lg bg-slate-100 p-1">
      <Link href={buildViewPath(query, "board")} aria-current={view === "board" ? "page" : undefined} className={view === "board" ? activeViewClass : inactiveViewClass}>
        <Columns3 size={15} aria-hidden="true" />看板
      </Link>
      <Link href={buildViewPath(query, "list")} aria-current={view === "list" ? "page" : undefined} className={view === "list" ? activeViewClass : inactiveViewClass}>
        <List size={15} aria-hidden="true" />列表
      </Link>
    </div>
  );
}

function FilterSelect({ name, defaultValue, label, children }: { name: string; defaultValue: string; label: string; children: React.ReactNode }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
      <select key={`${name}-${defaultValue}`} name={name} defaultValue={defaultValue} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
        <option value="all">{label}</option>
        {children}
      </select>
    </label>
  );
}

function ApplicationSummaryMetric({
  label,
  value,
  icon: Icon,
  tone,
  href,
  active = false
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "blue" | "slate" | "violet" | "amber" | "emerald";
  href?: string;
  active?: boolean;
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-100 text-slate-600",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700"
  };
  const content = (
    <>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}><Icon size={17} aria-hidden="true" /></div>
      <div className="min-w-0"><p className="text-xl font-semibold text-slate-950">{value}</p><p className="truncate text-xs text-slate-500">{label}</p></div>
    </>
  );
  const className = `flex items-center gap-3 bg-white p-4 transition ${active ? "shadow-[inset_0_-2px_0_#2563eb]" : ""} ${href ? "hover:bg-slate-50" : ""}`;

  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

function getBoardStages(statusFilter: string) {
  if (statusFilter === "all") {
    return [...activeBoardStages, archivedStage];
  }

  if (statusFilter === "active") {
    return activeBoardStages;
  }

  const status = statusFilter as ResumeJdReviewStatus;
  if (preparationStatuses.includes(status)) {
    return [{ ...activeBoardStages[0], key: status, label: getResumeJdReviewStatusLabel(status), statuses: [status] }];
  }

  if (status === "archived") {
    return [archivedStage];
  }

  return activeBoardStages.filter((stage) => stage.statuses.includes(status));
}

function getStatusFilterLabel(status: string) {
  if (status === "active") return "进行中";
  if (status === "all") return "全部状态";
  return getResumeJdReviewStatusLabel(status);
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function buildSourcePath(query: SearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const current = Array.isArray(value) ? value[0] : value;
    if (current && key !== "error") params.set(key, current);
  }
  const suffix = params.toString();
  return suffix ? `/dashboard/resume/applications?${suffix}` : "/dashboard/resume/applications";
}

function buildViewPath(query: SearchParams, view: "board" | "list") {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const current = Array.isArray(value) ? value[0] : value;
    if (current && key !== "error") params.set(key, current);
  }
  params.set("view", view);
  return `/dashboard/resume/applications?${params.toString()}`;
}

const activeViewClass = "inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-slate-950 shadow-sm";
const inactiveViewClass = "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-950";
