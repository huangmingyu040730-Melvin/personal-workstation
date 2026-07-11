import Link from "next/link";
import { FileSearch, Filter, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminContentCard, AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { CareerTabs } from "@/components/career-tabs";
import { PageHeader } from "@/components/page-header";
import { getResumeJdReviewStatusLabel, getResumeJdReviewStatusTone, resumeJdReviewStatusOptions } from "@/lib/resume-jd-review-options";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getResumeJdReviews } from "@/lib/queries/resume-jd-reviews";

export default async function ResumeJdReviewsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const status = getQueryValue(query.status) || "all";
  const q = getQueryValue(query.q);
  const versionId = getQueryValue(query.versionId);
  const reviews = await getResumeJdReviews({ status, q, versionId });

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          compact
          eyebrow="JD Review History"
          title="JD 分析记录"
          description="沉淀 AI JD 分析结果、投递岗位和后续行动，避免每次投递重新分析。"
          action={
            <Link href="/dashboard/resume/versions" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
              <FileSearch size={16} />
              选择简历版本分析
            </Link>
          }
        />

        <CareerTabs active="jdReviews" />

        <form className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-[1fr_220px_auto]">
          {versionId ? <input type="hidden" name="versionId" value={versionId} /> : null}
          <label className="relative block">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="搜索公司、岗位、关键词或下一步行动..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="relative block">
            <Filter size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              name="status"
              defaultValue={status}
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">全部状态</option>
              {resumeJdReviewStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">筛选</button>
        </form>

        <AdminSection title="分析记录" description={versionId ? "当前仅显示这个简历版本关联的 JD 分析记录。" : "记录公司、岗位、匹配结果、缺口和投递状态。"}>
          {reviews.length === 0 ? (
            <AdminEmptyState
              title="暂无 JD 分析记录"
              description="先进入某个简历版本，粘贴目标岗位 JD 完成分析，再保存为投递记录。"
              action={<Link href="/dashboard/resume/versions" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">选择简历版本</Link>}
            />
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {reviews.map((review) => (
                <AdminContentCard key={review.id} href={`/dashboard/resume/jd-reviews/${review.id}`} className="hover:border-blue-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <StatusBadge status={review.application_status} />
                        {review.resume_versions?.title ? <Badge className="bg-slate-100 text-slate-600 ring-slate-100">{review.resume_versions.title}</Badge> : null}
                      </div>
                      <h2 className="text-lg font-semibold text-slate-950">{review.job_title || "未命名岗位"}</h2>
                      <p className="mt-1 text-sm text-slate-500">{review.company_name || "未填写公司 / 机构"}</p>
                    </div>
                    <span className="shrink-0 rounded-2xl bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{review.missing_keywords.length} 个缺口</span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{review.match_summary || "暂无匹配摘要。"}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {review.missing_keywords.slice(0, 5).map((keyword) => (
                      <Badge key={keyword} className="bg-amber-50 text-amber-700 ring-amber-100">{keyword}</Badge>
                    ))}
                  </div>
                  <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                    <p className="line-clamp-1">下一步：{review.next_actions[0] || "暂无下一步行动。"}</p>
                    <p className="mt-2 text-xs text-slate-500">创建于 {formatDateTime(review.created_at)} · {formatRelative(review.created_at)}</p>
                  </div>
                </AdminContentCard>
              ))}
            </div>
          )}
        </AdminSection>
      </AdminPageSurface>
    </AppShell>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function StatusBadge({ status }: { status: string }) {
  return <Badge className={getResumeJdReviewStatusTone(status)}>{getResumeJdReviewStatusLabel(status)}</Badge>;
}
