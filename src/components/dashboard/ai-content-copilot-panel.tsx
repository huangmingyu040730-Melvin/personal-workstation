"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Bot, CheckCircle2, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { generateAiContentSuggestionsAction } from "@/actions/ai-content-copilot";
import {
  defaultAiContentCopilotState,
  type AiContentAssetType,
  type AiContentCopilotResult
} from "@/lib/ai-content-copilot";

type AiContentCopilotPanelProps = {
  assetType: AiContentAssetType;
  assetId: string;
  assetLabel: string;
  isConfigured: boolean;
  providerLabel: string;
  model: string;
};

const sectionLabels: Array<{ key: keyof AiContentCopilotResult; title: string; empty: string }> = [
  { key: "title_suggestions", title: "标题建议", empty: "暂无标题建议。" },
  { key: "summary_suggestions", title: "摘要 / 说明建议", empty: "暂无摘要建议。" },
  { key: "tag_suggestions", title: "标签建议", empty: "暂无标签建议。" },
  { key: "public_readiness_notes", title: "公开准备度提示", empty: "暂无公开准备度提示。" },
  { key: "sensitive_risks", title: "公开风险提示", empty: "暂无额外风险提示。" },
  { key: "missing_fields", title: "缺失字段", empty: "暂无缺失字段提示。" },
  { key: "next_steps", title: "下一步建议", empty: "暂无下一步建议。" }
];

export function AiContentCopilotPanel({
  assetType,
  assetId,
  assetLabel,
  isConfigured,
  providerLabel,
  model
}: AiContentCopilotPanelProps) {
  const [state, formAction, isPending] = useActionState(generateAiContentSuggestionsAction, defaultAiContentCopilotState);
  const hasResult = state.status === "success" && (state.result || state.rawText);
  const isError = state.status === "error";

  return (
    <section className="rounded-3xl border border-violet-100 bg-violet-50/60 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
          <Bot size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">AI Content Copilot</p>
          <h2 className="mt-1 text-base font-semibold text-slate-950">AI 内容助手</h2>
          <p className="mt-1 text-sm leading-6 text-violet-800">
            当前资产：{assetLabel}。根据当前记录的安全文本字段生成公开摘要、标签、结构和风险提示。
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-violet-100 bg-white/80 p-4 text-xs leading-5 text-slate-600">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 shrink-0 text-violet-700" size={16} />
          <p>
            AI 建议仅供管理员参考，不会自动保存、不会自动公开内容、不会读取 Documents 或生成下载链接。请人工复核后再复制、采纳或忽略。
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-violet-800">
        <span className="rounded-full bg-white px-2.5 py-1 font-medium ring-1 ring-violet-100">Provider：{providerLabel}</span>
        <span className="rounded-full bg-white px-2.5 py-1 font-medium ring-1 ring-violet-100">Model：{model}</span>
      </div>

      {!isConfigured ? (
        <div className="mt-4 flex gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
          <AlertCircle className="mt-0.5 shrink-0" size={17} />
          <p>AI 内容助手尚未配置。请在服务端环境变量中设置 AI_API_KEY，或继续使用 OPENAI_API_KEY。</p>
        </div>
      ) : null}

      <form action={formAction} className="mt-4">
        <input type="hidden" name="asset_type" value={assetType} />
        <input type="hidden" name="asset_id" value={assetId} />
        <CopilotSubmitButton disabled={!isConfigured} />
      </form>

      {isPending ? (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-600">
          <div className="flex items-center gap-2 font-medium text-violet-800">
            <Loader2 className="animate-spin" size={16} />
            正在生成建议
          </div>
          <p className="mt-1">系统只会读取当前资产的白名单文本字段，不读取 Documents 或 Storage object。</p>
        </div>
      ) : null}

      {state.message && !isPending ? (
        <div className={["mt-4 flex gap-2 rounded-2xl p-3 text-sm leading-6", isError ? "border border-rose-100 bg-rose-50 text-rose-700" : "border border-emerald-100 bg-emerald-50 text-emerald-800"].join(" ")}>
          {isError ? <AlertCircle className="mt-0.5 shrink-0" size={17} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={17} />}
          <p>{state.message}</p>
        </div>
      ) : null}

      {hasResult && !isPending ? (
        <div className="mt-4 space-y-3">
          {state.rawText ? <RawTextResult value={state.rawText} /> : null}
          {state.result ? <StructuredResult result={state.result} /> : null}
          {state.modelName ? <p className="text-xs text-violet-700">本次模型：{state.modelName}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function CopilotSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
      {pending ? "生成中..." : "生成 AI 建议"}
    </button>
  );
}

function StructuredResult({ result }: { result: AiContentCopilotResult }) {
  return (
    <div className="space-y-3">
      {sectionLabels.map((section) => (
        <ResultSection
          key={section.key}
          title={section.title}
          values={result[section.key]}
          empty={section.empty}
        />
      ))}
    </div>
  );
}

function ResultSection({ title, values, empty }: { title: string; values: string[]; empty: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      {values.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {values.map((value) => (
            <li key={value} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
              <span>{value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-500">{empty}</p>
      )}
    </div>
  );
}

function RawTextResult({ value }: { value: string }) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-950">AI 原始文本</h3>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-white">{value}</pre>
    </div>
  );
}
