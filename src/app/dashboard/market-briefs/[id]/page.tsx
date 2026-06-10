import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Edit, Eye, Printer, Tag } from "lucide-react";
import { deleteMarketBriefAction } from "@/actions/market-briefs";
import { AppShell } from "@/components/app-shell";
import { AdminDangerZone, AdminPageSurface } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { DeleteButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { getMarketBriefGenerationStatusLabel, getMarketBriefJobStatusLabel, getMarketBriefStatusLabel } from "@/lib/content-options";
import { formatDate, formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getMarketBriefMarkdownSourceLabel, hasMarketBriefMarkdownContent } from "@/lib/market-brief-markdown";
import { getMarketBriefGenerationStatusTone, getMarketBriefJobStatusTone, getMarketBriefStatusTone, marketBriefContentFields } from "@/lib/market-briefs";
import { MarkdownPreview } from "@/lib/markdown";
import { getMarketBriefGenerationJobsForBrief } from "@/lib/queries/market-brief-jobs";
import { getMarketBriefById } from "@/lib/queries/market-briefs";

export default async function MarketBriefDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [brief, relatedJobs] = await Promise.all([
    getMarketBriefById(id),
    getMarketBriefGenerationJobsForBrief(id, 3)
  ]);

  if (!brief) {
    notFound();
  }

  const deleteAction = deleteMarketBriefAction.bind(null, brief.id);
  const error = getFormError(query);
  const artifactFileCount = Array.isArray(brief.artifact_files) ? brief.artifact_files.length : 0;
  const visibleContentFields = marketBriefContentFields.filter((field) => {
    const value = brief[field.key];
    return typeof value === "string" && value.trim().length > 0;
  });

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Market Brief Detail"
          title={brief.title}
          description="市场简报详情。当前为私密后台数据，不进入公开站点。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={`/dashboard/market-briefs/${brief.id}/preview`} className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-100">
                <Eye size={16} />
                预览简报
              </Link>
              <Link href={`/dashboard/market-briefs/${brief.id}/download/markdown`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <Download size={16} />
                下载 Markdown
              </Link>
              <Link href={`/dashboard/market-briefs/${brief.id}/download/docx`} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:border-emerald-200 hover:bg-emerald-100">
                <Download size={16} />
                下载 Word
              </Link>
              <Link href={`/dashboard/market-briefs/${brief.id}/preview`} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <Printer size={16} />
                打印 / 保存 PDF
              </Link>
              <Link href={`/dashboard/market-briefs/${brief.id}/edit`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                <Edit size={16} />
                编辑
              </Link>
              <Link href="/dashboard/market-briefs" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <ArrowLeft size={16} />
                返回列表
              </Link>
            </div>
          }
        />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="grid gap-5 xl:grid-cols-[1fr_0.42fr]">
          <div className="space-y-5">
            {visibleContentFields.length > 0 ? (
              visibleContentFields.map((field) => {
                const value = brief[field.key];

                return (
                  <Card key={field.key}>
                    <CardHeader title={field.label} description={field.description} />
                    <MarkdownPreview content={typeof value === "string" ? value : null} emptyText="暂无内容。" />
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardHeader title="正文模块" />
                <p className="text-sm leading-6 text-slate-500">尚未填写正文模块。</p>
              </Card>
            )}
            <AdminDangerZone description="删除市场简报会移除这条后台记录，不会影响项目、知识库、文件中心或任何外部系统。">
              <form action={deleteAction}>
                <DeleteButton label="删除市场简报" />
              </form>
            </AdminDangerZone>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader title="基础信息" />
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className={getMarketBriefStatusTone(brief.status)}>{getMarketBriefStatusLabel(brief.status)}</Badge>
                <Badge className={getMarketBriefGenerationStatusTone(brief.generation_status)}>{getMarketBriefGenerationStatusLabel(brief.generation_status)}</Badge>
                <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{brief.market}</Badge>
                {brief.is_featured ? <Badge className="bg-amber-50 text-amber-700 ring-amber-100">精选</Badge> : null}
                {hasMarketBriefMarkdownContent(brief) ? <Badge className="bg-violet-50 text-violet-700 ring-violet-100">有 Markdown</Badge> : null}
              </div>
              <dl className="space-y-3 text-sm">
                <InfoRow label="日期" value={formatDate(brief.brief_date)} />
                <InfoRow label="市场" value={brief.market} />
                <InfoRow label="状态" value={getMarketBriefStatusLabel(brief.status)} />
                <InfoRow label="内容源" value={getMarketBriefMarkdownSourceLabel(brief)} />
                <InfoRow label="生成状态" value={getMarketBriefGenerationStatusLabel(brief.generation_status)} />
                <InfoRow label="生成时间" value={brief.generated_at ? formatDateTime(brief.generated_at) : "暂无"} />
                <InfoRow label="生成方式" value={brief.generator_name ?? "manual"} />
                <InfoRow label="Artifact 文件" value={artifactFileCount > 0 ? `${artifactFileCount} 个` : "暂无文件元数据"} />
                <InfoRow label="创建时间" value={formatDateTime(brief.created_at)} />
                <InfoRow label="更新时间" value={formatDateTime(brief.updated_at)} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="标签" action={<Tag size={18} className="text-blue-700" />} />
              <BadgeList values={brief.tags} emptyText="暂无标签。" />
            </Card>

            <Card>
              <CardHeader title="数据来源" />
              <BadgeList values={brief.data_sources} emptyText="暂无数据来源。" />
            </Card>

            <Card>
              <CardHeader title="最近生成任务" />
              {relatedJobs.length > 0 ? (
                <div className="space-y-3">
                  {relatedJobs.map((job) => (
                    <Link key={job.id} href={`/dashboard/market-briefs/jobs/${job.id}`} className="block rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:border-blue-200 hover:bg-blue-50">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className={getMarketBriefJobStatusTone(job.status)}>{getMarketBriefJobStatusLabel(job.status)}</Badge>
                        <span className="text-xs font-medium text-slate-500">{getGeneratorDisplayName(job)}</span>
                      </div>
                      <p className="text-xs text-slate-500">创建于 {formatDateTime(job.created_at)}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-500">暂无关联生成任务。</p>
              )}
            </Card>
          </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl bg-slate-50 p-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function getGeneratorDisplayName(job: { runner_name: string; request_payload: Record<string, unknown> }) {
  if (job.request_payload.generator_mode === "ai" || job.runner_name === "ai-market-brief-generator") {
    return "AI 市场简报生成器";
  }

  if (job.request_payload.generator_mode === "external" || job.runner_name.includes("external")) {
    return "历史任务：旧 external runner";
  }

  if (job.runner_name === "manual-skill-mock") {
    return "历史任务：mock 生成器";
  }

  return "历史任务：旧生成器";
}

function BadgeList({ values, emptyText }: { values: string[]; emptyText: string }) {
  if (values.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} className="bg-slate-50 text-slate-600 ring-slate-200">{value}</Badge>
      ))}
    </div>
  );
}
