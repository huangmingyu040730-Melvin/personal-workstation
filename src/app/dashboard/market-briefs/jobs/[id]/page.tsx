import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AdminPageSurface, AdminSecurityNote } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PageHeader } from "@/components/page-header";
import { getMarketBriefJobStatusLabel } from "@/lib/content-options";
import { formatDate, formatDateTime } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getMarketBriefJobStatusTone } from "@/lib/market-briefs";
import { getMarketBriefGenerationJobById } from "@/lib/queries/market-brief-jobs";

export default async function MarketBriefJobDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const job = await getMarketBriefGenerationJobById(id);

  if (!job) {
    notFound();
  }

  const error = getFormError(query);
  const notice = getSearchValue(query.notice);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="Market Brief Job"
          title={`${formatDate(job.brief_date)} ${job.market}生成任务`}
          description="生成任务详情仅在后台展示，用于追踪 Skill Runner 输入、数据快照和生成结果。"
          action={
            <div className="flex flex-wrap gap-2">
              {job.market_brief_id ? (
                <Link href={`/dashboard/market-briefs/${job.market_brief_id}/preview`} className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-100">
                  <Eye size={16} />
                  查看生成的市场简报
                </Link>
              ) : null}
              <Link href="/dashboard/market-briefs/jobs" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <ArrowLeft size={16} />
                返回任务列表
              </Link>
            </div>
          }
        />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {notice === "active" ? <NoticeBanner message="今日同市场已有排队中或运行中的生成任务，暂不重复创建。" /> : null}
        {notice === "queued" ? <NoticeBanner message="任务已创建，等待外部 Skill Runner 处理。" /> : null}
        {notice === "failed" ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">生成任务失败，请查看错误信息后手动处理。</div> : null}

        <div className="grid gap-5 xl:grid-cols-[1fr_0.4fr]">
          <div className="space-y-5">
            <JsonCard title="Request Payload" value={job.request_payload} />
            <JsonCard title="Source Snapshot" value={job.source_snapshot} />
            <JsonCard title="Result Payload" value={job.result_payload} />
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader title="下一步" />
              <p className={`text-sm leading-6 ${job.status === "failed" ? "text-rose-700" : "text-slate-600"}`}>{getJobNextStep(job.status, job.error_message)}</p>
              {isExternalJob(job) ? (
                <div className="mt-4 space-y-3">
                  <AdminSecurityNote>
                    <p>该任务等待外部 Skill Runner 通过私有 API 领取、处理并回写。页面只展示调用路径，不展示 runner secret。</p>
                  </AdminSecurityNote>
                  <div className="rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                    <div>领取任务：POST /api/market-briefs/skill-jobs/claim</div>
                    <div>成功回写：POST /api/market-briefs/skill-result</div>
                    <div>失败回写：POST /api/market-briefs/skill-jobs/fail</div>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <CardHeader title="任务信息" />
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge className={getMarketBriefJobStatusTone(job.status)}>{getMarketBriefJobStatusLabel(job.status)}</Badge>
                <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{job.market}</Badge>
              </div>
              <dl className="space-y-3 text-sm">
                <InfoRow label="日期" value={formatDate(job.brief_date)} />
                <InfoRow label="市场" value={job.market} />
                <InfoRow label="状态" value={getMarketBriefJobStatusLabel(job.status)} />
                <InfoRow label="Runner" value={job.runner_name} />
                <InfoRow label="创建时间" value={formatDateTime(job.created_at)} />
                <InfoRow label="开始时间" value={job.started_at ? formatDateTime(job.started_at) : "未开始"} />
                <InfoRow label="完成时间" value={job.completed_at ? formatDateTime(job.completed_at) : "未完成"} />
                <InfoRow label="更新时间" value={formatDateTime(job.updated_at)} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="关联简报" action={<FileText size={18} className="text-blue-700" />} />
              {job.market_briefs ? (
                <Link href={`/dashboard/market-briefs/${job.market_briefs.id}`} className="block rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-blue-700 hover:border-blue-200 hover:bg-blue-50">
                  {job.market_briefs.title}
                </Link>
              ) : (
                <p className="text-sm leading-6 text-slate-500">暂无关联市场简报。</p>
              )}
            </Card>

            <Card>
              <CardHeader title="错误信息" />
              <p className={job.error_message ? "text-sm leading-6 text-rose-700" : "text-sm leading-6 text-slate-500"}>
                {job.error_message ?? "暂无错误。"}
              </p>
            </Card>
          </div>
        </div>
      </AdminPageSurface>
    </AppShell>
  );
}

function JsonCard({ title, value }: { title: string; value: Record<string, unknown> }) {
  return (
    <Card>
      <CardHeader title={title} />
      <pre className="max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {JSON.stringify(value ?? {}, null, 2)}
      </pre>
    </Card>
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

function NoticeBanner({ message }: { message: string }) {
  return <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>;
}

function getJobNextStep(status: string, errorMessage: string | null) {
  if (status === "queued") return "等待外部 Skill Runner 领取任务。";
  if (status === "running") return "外部 Skill Runner 正在处理。";
  if (status === "succeeded") return "已生成市场简报。";
  if (status === "failed") return errorMessage ? `任务失败：${errorMessage}` : "任务失败，请查看 runner 日志并决定是否重新创建任务。";
  return "任务已取消或归档，无需继续处理。";
}

function isExternalJob(job: { runner_name: string; request_payload: Record<string, unknown> }) {
  return job.runner_name.includes("external") || job.request_payload.generator_mode === "external";
}

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
