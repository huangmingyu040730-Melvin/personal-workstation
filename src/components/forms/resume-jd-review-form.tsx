"use client";

import { useActionState } from "react";
import { analyzeResumeJdAction } from "@/actions/resume-jd-review";
import { createResumeJdReviewAction } from "@/actions/resume-jd-reviews";
import { Badge } from "@/components/badge";
import { Field, Select, Textarea, TextInput } from "@/components/forms/form-fields";
import { SubmitButton } from "@/components/forms/submit-button";
import { resumeJdDirectionOptions, type ResumeJdReviewResult, type ResumeJdReviewState } from "@/lib/resume-jd-review";
import { resumeJdReviewStatusOptions } from "@/lib/resume-jd-review-options";

export function ResumeJdReviewForm({
  versionId,
  targetRole,
  targetKeywords,
  visibleItemCount
}: {
  versionId: string;
  targetRole?: string | null;
  targetKeywords: string[];
  visibleItemCount: number;
}) {
  const [state, action] = useActionState<ResumeJdReviewState, FormData>(analyzeResumeJdAction.bind(null, versionId), { status: "idle" });

  return (
    <div className="space-y-5">
      <form action={action} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-950">粘贴目标岗位 JD</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">AI 只会基于当前简历版本和你粘贴的 JD 生成建议，不会自动修改简历数据。</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.36fr_0.64fr]">
          <Field label="岗位方向" hint="用于调整分析侧重点，不会写入数据库。">
            <Select name="direction" defaultValue="investment_research">
              {resumeJdDirectionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-blue-800">
            <p className="font-semibold text-blue-950">当前版本摘要</p>
            <p className="mt-1">目标岗位：{targetRole || "未填写"}</p>
            <p>已选正文素材：{visibleItemCount} 条</p>
            <p>目标关键词：{targetKeywords.length > 0 ? targetKeywords.join("、") : "未设置"}</p>
          </div>
        </div>

        <div className="mt-4">
          <Field label="目标岗位 JD" hint="建议保留岗位职责、任职要求、技能要求和加分项；不要粘贴无关隐私信息。">
            <Textarea name="jd_text" rows={14} placeholder="在这里粘贴目标岗位 JD，例如岗位职责、任职要求、技能关键词、加分项等..." />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SubmitButton pendingLabel="分析中...">开始 AI JD 分析</SubmitButton>
          <p className="text-xs leading-5 text-slate-500">分析结果仅在当前页面展示。请人工复核后再复制到简历素材中。</p>
        </div>
      </form>

      {state.status === "error" ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700">{state.message}</div> : null}
      {state.status === "success" ? <ResumeJdReviewResultView state={state} versionId={versionId} targetRole={targetRole} targetKeywords={targetKeywords} /> : null}
    </div>
  );
}

function ResumeJdReviewResultView({
  state,
  versionId,
  targetRole,
  targetKeywords
}: {
  state: ResumeJdReviewState;
  versionId: string;
  targetRole?: string | null;
  targetKeywords: string[];
}) {
  if (state.rawText) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-base font-semibold text-slate-950">AI 分析结果</h2>
        {state.message ? <p className="mt-1 text-sm leading-6 text-slate-500">{state.message}</p> : null}
        <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-white">{state.rawText}</pre>
      </section>
    );
  }

  if (!state.result) {
    return null;
  }

  const result = state.result;
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 shadow-soft">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">AI JD Review</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">分析结果</h2>
          {state.message ? <p className="mt-1 text-sm leading-6 text-slate-600">{state.message}</p> : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ResultBlock title="匹配摘要" className="xl:col-span-2">
            <p className="text-sm leading-7 text-slate-700">{result.matchSummary || "AI 未返回摘要。"}</p>
          </ResultBlock>
          <KeywordBlock title="已匹配关键词" values={result.matchedKeywords} tone="blue" />
          <KeywordBlock title="缺失关键词" values={result.missingKeywords} tone="amber" />
          <ListBlock title="优势" values={result.strengths} emptyText="暂未识别明显优势。" />
          <ListBlock title="差距" values={result.gaps} emptyText="暂未识别明显差距。" />
          <ExperienceSuggestions result={result} />
          <RewriteSuggestions result={result} />
          <ListBlock title="风险提示" values={result.risks} emptyText="暂无额外风险提示。" />
          <ListBlock title="下一步行动" values={result.nextActions} emptyText="暂无下一步建议。" />
        </div>
      </section>

      <SaveJdReviewForm versionId={versionId} targetRole={targetRole} targetKeywords={targetKeywords} state={state} result={result} />
    </div>
  );
}

function SaveJdReviewForm({
  versionId,
  targetRole,
  targetKeywords,
  state,
  result
}: {
  versionId: string;
  targetRole?: string | null;
  targetKeywords: string[];
  state: ResumeJdReviewState;
  result: ResumeJdReviewResult;
}) {
  const directionLabel = resumeJdDirectionOptions.find((option) => option.value === state.direction)?.label ?? targetRole ?? "";
  const jdText = state.jdText ?? "";

  return (
    <form action={createResumeJdReviewAction} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <input type="hidden" name="resume_version_id" value={versionId} />
      <input type="hidden" name="match_summary" value={result.matchSummary} />
      <input type="hidden" name="model_name" value={state.modelName ?? ""} />
      <textarea className="hidden" name="jd_text" readOnly value={jdText} />
      <textarea className="hidden" name="target_keywords_json" readOnly value={JSON.stringify(targetKeywords)} />
      <textarea className="hidden" name="ai_result_json" readOnly value={JSON.stringify(result)} />
      <textarea className="hidden" name="matched_keywords_json" readOnly value={JSON.stringify(result.matchedKeywords)} />
      <textarea className="hidden" name="missing_keywords_json" readOnly value={JSON.stringify(result.missingKeywords)} />
      <textarea className="hidden" name="risks_json" readOnly value={JSON.stringify(result.risks)} />
      <textarea className="hidden" name="next_actions_json" readOnly value={JSON.stringify(result.nextActions)} />

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Save Review</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-950">保存为 JD 分析记录</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">保存后可在 JD 分析记录中跟踪公司、岗位、投递状态和后续行动；不会自动修改简历素材。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="公司 / 机构" hint="可留空，后续在记录详情中补充。">
          <TextInput name="company_name" placeholder="例如 某券商研究所 / 某资产管理公司" />
        </Field>
        <Field label="岗位名称">
          <TextInput name="job_title" placeholder="例如 量化研究实习" defaultValue={targetRole ?? ""} />
        </Field>
        <Field label="岗位方向">
          <TextInput name="job_direction" placeholder="例如 投研 / 量化研究 / AI 数据分析" defaultValue={directionLabel} />
        </Field>
        <Field label="城市 / 地点">
          <TextInput name="job_location" placeholder="例如 上海 / 北京 / 远程" />
        </Field>
        <Field label="投递渠道">
          <TextInput name="application_channel" placeholder="例如 官网 / 内推 / Boss / 邮件" />
        </Field>
        <Field label="状态">
          <Select name="application_status" defaultValue="reviewed">
            {resumeJdReviewStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="备注" hint="可记录投递计划、需要补充的数据或人工复核结论。">
          <Textarea name="notes" rows={4} placeholder="例如：需要补充 Python 回测项目的量化成果，再考虑投递。" />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="保存中...">保存分析记录</SubmitButton>
        <p className="text-xs leading-5 text-slate-500">保存的是本次 JD、AI 建议和投递状态，不会写回简历正文。</p>
      </div>
    </form>
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
