import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileSearch, PencilLine } from "lucide-react";
import { updateResumeJdReviewAction } from "@/actions/resume-jd-reviews";
import { AppShell } from "@/components/app-shell";
import { AdminFormHelpCard, AdminFormSurface, AdminPageSurface } from "@/components/admin-ui";
import { Badge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { Field, Select, Textarea, TextInput } from "@/components/forms/form-fields";
import { SubmitButton } from "@/components/forms/submit-button";
import { PageHeader } from "@/components/page-header";
import { formatDateTime, formatRelative } from "@/lib/format";
import { getFormError } from "@/lib/forms";
import { getResumeJdReviewStatusLabel, resumeJdReviewStatusOptions } from "@/lib/resume-jd-review-options";
import { getResumeJdReviewById } from "@/lib/queries/resume-jd-reviews";
import { normalizeResumeJdReviewResult, type ResumeJdReviewResult } from "@/lib/resume-jd-review";

export default async function ResumeJdReviewDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const review = await getResumeJdReviewById(id);

  if (!review) {
    notFound();
  }

  const error = getFormError(query);
  const result = normalizeResumeJdReviewResult(review.ai_result);
  const updateAction = updateResumeJdReviewAction.bind(null, review.id);

  return (
    <AppShell>
      <AdminPageSurface>
        <PageHeader
          eyebrow="JD Review"
          title={review.job_title || "JD 分析记录"}
          description="查看已保存的 AI JD 分析结果，并维护投递状态和备注。"
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/resume/jd-reviews" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                <ArrowLeft size={16} />
                返回记录
              </Link>
              <Link href={`/dashboard/resume/versions/${review.resume_version_id}`} className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
                <FileSearch size={16} />
                查看简历版本
              </Link>
            </div>
          }
        />

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{decodeURIComponent(error)}</div> : null}

        <AdminFormSurface
          sidebar={
            <>
              <Card>
                <CardHeader title="记录摘要" action={<Badge className="bg-blue-50 text-blue-700 ring-blue-100">{getResumeJdReviewStatusLabel(review.application_status)}</Badge>} />
                <dl className="space-y-3 text-sm">
                  <InfoRow label="公司 / 机构" value={review.company_name || "未填写"} />
                  <InfoRow label="岗位" value={review.job_title || "未填写"} />
                  <InfoRow label="关联版本" value={review.resume_versions?.title || "未知版本"} />
                  <InfoRow label="模型" value={review.model_name || "未记录"} />
                  <InfoRow label="创建" value={`${formatDateTime(review.created_at)} · ${formatRelative(review.created_at)}`} />
                  <InfoRow label="更新" value={`${formatDateTime(review.updated_at)} · ${formatRelative(review.updated_at)}`} />
                </dl>
              </Card>
              <AdminFormHelpCard
                title="使用提醒"
                description="AI 分析记录只作为投递辅助，不会自动修改简历正文。"
                items={["投递前请人工核对所有事实和数字。", "状态与备注用于跟踪投递流程。", "不要把内部文件、密钥或隐私信息写入备注。"]}
              />
            </>
          }
        >
          <div className="space-y-5">
            <Card>
              <CardHeader title="投递状态与备注" action={<PencilLine size={18} className="text-blue-700" />} />
              <form action={updateAction} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="公司 / 机构">
                    <TextInput name="company_name" defaultValue={review.company_name ?? ""} />
                  </Field>
                  <Field label="岗位名称">
                    <TextInput name="job_title" defaultValue={review.job_title ?? ""} />
                  </Field>
                  <Field label="岗位方向">
                    <TextInput name="job_direction" defaultValue={review.job_direction ?? ""} />
                  </Field>
                  <Field label="城市 / 地点">
                    <TextInput name="job_location" defaultValue={review.job_location ?? ""} />
                  </Field>
                  <Field label="投递渠道">
                    <TextInput name="application_channel" defaultValue={review.application_channel ?? ""} />
                  </Field>
                  <Field label="状态">
                    <Select name="application_status" defaultValue={review.application_status}>
                      {resumeJdReviewStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="备注">
                  <Textarea name="notes" rows={5} defaultValue={review.notes ?? ""} />
                </Field>
                <SubmitButton pendingLabel="更新中...">更新记录</SubmitButton>
              </form>
            </Card>

            <JdReviewResultSections result={result} />

            <Card>
              <CardHeader title="目标岗位 JD 原文" description="用于复盘当时分析依据；不会公开展示。" />
              <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-white">{review.jd_text}</pre>
            </Card>
          </div>
        </AdminFormSurface>
      </AdminPageSurface>
    </AppShell>
  );
}

function JdReviewResultSections({ result }: { result: ResumeJdReviewResult }) {
  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 shadow-soft">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">AI JD Review</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">分析结果</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ResultBlock title="匹配摘要" className="xl:col-span-2">
          <p className="text-sm leading-7 text-slate-700">{result.matchSummary || "暂无匹配摘要。"}</p>
        </ResultBlock>
        <KeywordBlock title="已匹配关键词" values={result.matchedKeywords} tone="blue" />
        <KeywordBlock title="缺失关键词" values={result.missingKeywords} tone="amber" />
        <ListBlock title="优势" values={result.strengths} emptyText="暂无优势记录。" />
        <ListBlock title="差距" values={result.gaps} emptyText="暂无差距记录。" />
        <ListBlock title="风险提示" values={result.risks} emptyText="暂无风险提示。" />
        <ListBlock title="下一步行动" values={result.nextActions} emptyText="暂无下一步行动。" />
        <ExperienceSuggestions result={result} />
        <RewriteSuggestions result={result} />
      </div>
    </section>
  );
}

function ResultBlock({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={["rounded-3xl border border-slate-200 bg-white p-5", className].filter(Boolean).join(" ")}>
      <h3 className="mb-3 text-sm font-semibold text-slate-950">{title}</h3>
      {children}
    </div>
  );
}

function KeywordBlock({ title, values, tone }: { title: string; values: string[]; tone: "blue" | "amber" }) {
  const toneClass = tone === "blue" ? "bg-blue-50 text-blue-700 ring-blue-100" : "bg-amber-50 text-amber-700 ring-amber-100";
  return (
    <ResultBlock title={title}>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value} className={toneClass}>{value}</Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">暂无。</p>
      )}
    </ResultBlock>
  );
}

function ListBlock({ title, values, emptyText }: { title: string; values: string[]; emptyText: string }) {
  return (
    <ResultBlock title={title}>
      {values.length > 0 ? (
        <ul className="space-y-2 text-sm leading-6 text-slate-700">
          {values.map((value) => (
            <li key={value} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <span>{value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{emptyText}</p>
      )}
    </ResultBlock>
  );
}

function ExperienceSuggestions({ result }: { result: ResumeJdReviewResult }) {
  return (
    <ResultBlock title="建议强化的经历" className="xl:col-span-2">
      {result.experienceSuggestions.length > 0 ? (
        <div className="space-y-4">
          {result.experienceSuggestions.map((suggestion) => (
            <article key={`${suggestion.resumeItemTitle}-${suggestion.reason}`} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{suggestion.resumeItemTitle || "未命名经历"}</p>
              {suggestion.reason ? <p className="mt-1 text-sm leading-6 text-slate-600">{suggestion.reason}</p> : null}
              {suggestion.suggestedBullets.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {suggestion.suggestedBullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">暂无具体经历强化建议。</p>
      )}
    </ResultBlock>
  );
}

function RewriteSuggestions({ result }: { result: ResumeJdReviewResult }) {
  return (
    <ResultBlock title="可复制的 bullet 改写建议" className="xl:col-span-2">
      {result.rewriteSuggestions.length > 0 ? (
        <div className="space-y-4">
          {result.rewriteSuggestions.map((suggestion) => (
            <article key={`${suggestion.rewritten}-${suggestion.reason}`} className="rounded-2xl bg-slate-50 p-4">
              {suggestion.original ? <p className="text-xs leading-5 text-slate-500">原句：{suggestion.original}</p> : null}
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{suggestion.rewritten}</p>
              {suggestion.reason ? <p className="mt-2 text-sm leading-6 text-slate-600">{suggestion.reason}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">暂无 bullet 改写建议。</p>
      )}
    </ResultBlock>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
