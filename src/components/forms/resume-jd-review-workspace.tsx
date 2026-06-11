"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Circle, FileCheck2, Loader2, XCircle } from "lucide-react";
import { analyzeResumeJdAction } from "@/actions/resume-jd-review";
import { AdminFormHelpCard, AdminFormSurface } from "@/components/admin-ui";
import { ResumeJdReviewForm } from "@/components/forms/resume-jd-review-form";
import { formatDateTime } from "@/lib/format";
import { defaultResumeJdReviewState, type ResumeJdReviewState } from "@/lib/resume-jd-review";

const progressSteps = ["校验 JD 与投递信息", "读取当前简历版本", "生成匹配分析", "保存 JD 分析记录"];

export function ResumeJdReviewWorkspace({
  versionId,
  targetRole,
  targetKeywords,
  visibleItemCount,
  aiProviderLabel,
  aiModel,
  children
}: {
  versionId: string;
  targetRole?: string | null;
  targetKeywords: string[];
  visibleItemCount: number;
  aiProviderLabel: string;
  aiModel: string;
  children: React.ReactNode;
}) {
  const [state, formAction, isPending] = useActionState<ResumeJdReviewState, FormData>(analyzeResumeJdAction.bind(null, versionId), defaultResumeJdReviewState);

  return (
    <AdminFormSurface
      sidebar={
        <>
          <AdminFormHelpCard
            title="使用边界"
            description="这是投递前的辅助检查，不是自动改写系统。"
            items={[
              "AI 只生成建议，不会自动写回 Resume Items。",
              "不要粘贴包含客户隐私、内部文件或未公开敏感信息的 JD 附件内容。",
              "建议人工复核所有 bullet，尤其是数字、范围和成果表达。",
              "如果缺少事实或数据，AI 应提示补充，而不是替你编造。"
            ]}
          />
          <AdminFormHelpCard
            title="配置提示"
            tone="slate"
            description={`生产环境需要在 Vercel 中配置 AI_API_KEY，或继续使用 OPENAI_API_KEY。当前 AI Provider：${aiProviderLabel}；当前模型：${aiModel}。未配置 API Key 时页面仍可打开，但不能提交分析。`}
          />
          <ResumeJdReviewProgressCard state={state} pending={isPending} />
        </>
      }
    >
      {children}
      <ResumeJdReviewForm
        action={formAction}
        versionId={versionId}
        state={state}
        targetRole={targetRole}
        targetKeywords={targetKeywords}
        visibleItemCount={visibleItemCount}
      />
    </AdminFormSurface>
  );
}

function ResumeJdReviewProgressCard({ state, pending }: { state: ResumeJdReviewState; pending: boolean }) {
  const isSuccess = state.status === "success";
  const isError = state.status === "error";
  const title = pending ? "正在分析并保存" : isSuccess ? "记录已保存" : isError ? "分析未完成" : "等待粘贴 JD";
  const description = pending
    ? "正在基于当前简历版本和目标 JD 生成分析，完成后会自动保存，不需要再手动保存。"
    : isSuccess
      ? "JD 分析记录已写入求职中心，可继续维护投递状态和备注。"
      : isError
        ? "本次没有创建 JD 分析记录，请修正后重新提交。"
        : "填写投递信息并粘贴 JD 后，点击主按钮开始分析并自动保存记录。";

  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 text-blue-800 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
          {pending ? <Loader2 className="animate-spin" size={20} /> : isSuccess ? <FileCheck2 size={20} /> : isError ? <XCircle size={20} /> : <Circle size={20} />}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-950">AI JD 分析进度</h2>
          <p className="mt-1 text-base font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6">{description}</p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
        <div className={["h-full rounded-full transition-all duration-500", isError ? "w-1/3 bg-rose-500" : isSuccess ? "w-full bg-emerald-500" : pending ? "w-2/3 animate-pulse bg-blue-600" : "w-1/6 bg-blue-200"].join(" ")} />
      </div>

      <ol className="mt-5 space-y-3 text-sm leading-6">
        {progressSteps.map((step, index) => {
          const completed = isSuccess || (pending && index < 2);
          const active = pending && index >= 2;
          return (
            <li key={step} className="flex gap-3">
              <span className="mt-0.5 shrink-0">
                {completed ? (
                  <CheckCircle2 size={17} className="text-emerald-600" />
                ) : active ? (
                  <Loader2 size={17} className="animate-spin text-blue-700" />
                ) : isError && index === 0 ? (
                  <XCircle size={17} className="text-rose-600" />
                ) : (
                  <Circle size={17} className="text-blue-300" />
                )}
              </span>
              <span className={completed ? "font-medium text-slate-950" : active ? "font-medium text-blue-800" : "text-blue-700"}>{step}</span>
            </li>
          );
        })}
      </ol>

      {state.message && !pending ? <p className={["mt-4 rounded-2xl px-3 py-2 text-sm leading-6", isError ? "bg-rose-50 text-rose-700" : "bg-white text-blue-800"].join(" ")}>{state.message}</p> : null}

      {state.savedReviewUrl ? (
        <div className="mt-4 space-y-2">
          {state.savedAt ? <p className="text-xs text-blue-700">保存时间：{formatDateTime(state.savedAt)}</p> : null}
          <Link href={state.savedReviewUrl} className="inline-flex rounded-2xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            查看已保存记录
          </Link>
        </div>
      ) : null}
    </section>
  );
}
