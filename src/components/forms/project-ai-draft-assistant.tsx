"use client";

import { useRef, useState, useTransition } from "react";
import { AlertTriangle, Check, Clipboard, Loader2, Sparkles, Wand2 } from "lucide-react";
import { generateProjectAiDraftAction } from "@/actions/ai-draft-form-copilot";
import type { ProjectAiDraftResult, ProjectAiDraftState } from "@/lib/ai-draft-form-copilot";
import { cn } from "@/lib/utils";

type ProjectAiDraftAssistantProps = {
  isConfigured: boolean;
  providerLabel: string;
  model: string;
  formId?: string;
};

const initialState: ProjectAiDraftState = { status: "idle" };

export function ProjectAiDraftAssistant({ isConfigured, providerLabel, model, formId }: ProjectAiDraftAssistantProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ProjectAiDraftState>(initialState);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    const form = getTargetForm(rootRef.current, formId);
    if (!form) {
      setState({ status: "error", message: "未找到当前 Project 表单，请刷新页面后重试。" });
      return;
    }

    const draft = {
      title: readFormValue(form, "title"),
      summary: readFormValue(form, "summary"),
      background: readFormValue(form, "background"),
      research_question: readFormValue(form, "research_question"),
      methodology: readFormValue(form, "methodology"),
      tags: readFormList(form, "tags"),
      status: normalizeStatus(readFormValue(form, "status")),
      visibility: normalizeVisibility(readFormValue(form, "visibility")),
      milestones: readFormList(form, "milestones"),
      progress: readFormValue(form, "progress"),
      start_date: readFormValue(form, "start_date")
    };

    startTransition(() => {
      void generateProjectAiDraftAction({ assetType: "project", draft }).then(setState);
    });
  }

  async function copyText(key: string, value: string | string[]) {
    const text = Array.isArray(value) ? value.join("\n") : value;
    if (!text.trim()) {
      return;
    }

    await navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600);
  }

  function applyField(key: string, fieldName: string, value: string | string[]) {
    const form = getTargetForm(rootRef.current, formId);
    const text = Array.isArray(value) ? value.join("\n") : value;
    if (!form || !text.trim()) {
      return;
    }

    writeFormValue(form, fieldName, text);
    setAppliedKey(key);
    window.setTimeout(() => setAppliedKey((current) => (current === key ? null : current)), 1600);
  }

  return (
    <section ref={rootRef} className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50/40 p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-950">AI 草稿补全助手</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              点击时读取当前表单里的标题、简介、研究背景、研究问题、方法、标签、状态和可见性；进度、日期和里程碑只作为可选上下文。
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2 text-xs leading-5 text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-900">{providerLabel}</span>
          <span className="mx-1 text-slate-300">/</span>
          <span>{model}</span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-white/80 p-4 text-sm leading-6 text-blue-800">
        AI 只会根据当前表单草稿生成建议，不会自动保存、不会自动公开内容，也不会读取 Documents 或生成下载链接。请人工复核后再采用。
      </div>

      {!isConfigured ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <p className="font-semibold">AI 草稿助手尚未配置</p>
            <p className="mt-1">请在服务端环境变量中配置 AI_API_KEY，或继续使用 OPENAI_API_KEY。Project 表单仍可正常编辑和保存。</p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!isConfigured || isPending}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:translate-y-0"
        >
          {isPending ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
          根据当前表单生成建议
        </button>
        <p className="text-xs leading-5 text-slate-500">采用建议只更新浏览器中的表单字段；仍需手动点击保存。</p>
      </div>

      {state.message ? (
        <div
          className={cn(
            "mt-4 rounded-2xl border px-4 py-3 text-sm leading-6",
            state.status === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"
          )}
        >
          {state.message}
        </div>
      ) : null}

      {state.result ? (
        <ProjectAiDraftResultView
          result={state.result}
          copiedKey={copiedKey}
          appliedKey={appliedKey}
          onCopy={copyText}
          onApply={applyField}
        />
      ) : null}

      {state.rawText ? (
        <DraftBlock
          title="AI 原始文本"
          value={state.rawText}
          copied={copiedKey === "raw"}
          onCopy={() => copyText("raw", state.rawText ?? "")}
        />
      ) : null}

      {state.modelName ? <p className="mt-4 text-xs text-slate-400">Model: {state.modelName}</p> : null}
    </section>
  );
}

function ProjectAiDraftResultView({
  result,
  copiedKey,
  appliedKey,
  onCopy,
  onApply
}: {
  result: ProjectAiDraftResult;
  copiedKey: string | null;
  appliedKey: string | null;
  onCopy: (key: string, value: string | string[]) => void;
  onApply: (key: string, fieldName: string, value: string | string[]) => void;
}) {
  return (
    <div className="mt-5 space-y-4">
      <DraftBlock
        title="简介建议"
        value={result.summary_draft}
        copied={copiedKey === "summary"}
        applied={appliedKey === "summary"}
        onCopy={() => onCopy("summary", result.summary_draft)}
        onApply={() => onApply("summary", "summary", result.summary_draft)}
      />
      <DraftBlock
        title="研究背景建议"
        value={result.background_draft}
        copied={copiedKey === "background"}
        applied={appliedKey === "background"}
        onCopy={() => onCopy("background", result.background_draft)}
        onApply={() => onApply("background", "background", result.background_draft)}
      />
      <DraftBlock
        title="研究问题建议"
        value={result.research_question_draft}
        copied={copiedKey === "research_question"}
        applied={appliedKey === "research_question"}
        onCopy={() => onCopy("research_question", result.research_question_draft)}
        onApply={() => onApply("research_question", "research_question", result.research_question_draft)}
      />
      <DraftBlock
        title="研究方法建议"
        value={result.methodology_draft}
        copied={copiedKey === "methodology"}
        applied={appliedKey === "methodology"}
        onCopy={() => onCopy("methodology", result.methodology_draft)}
        onApply={() => onApply("methodology", "methodology", result.methodology_draft)}
      />
      <DraftListBlock
        title="标签建议"
        items={result.tag_suggestions}
        copied={copiedKey === "tags"}
        applied={appliedKey === "tags"}
        onCopy={() => onCopy("tags", result.tag_suggestions)}
        onApply={() => onApply("tags", "tags", result.tag_suggestions)}
      />
      <DraftListBlock
        title="研究流程 / 实验流程"
        items={result.research_flow_steps}
        copied={copiedKey === "research_flow_steps"}
        onCopy={() => onCopy("research_flow_steps", result.research_flow_steps)}
      />
      <DraftListBlock
        title="阶段计划建议"
        items={result.milestone_suggestions}
        copied={copiedKey === "milestones"}
        applied={appliedKey === "milestones"}
        onCopy={() => onCopy("milestones", result.milestone_suggestions)}
        onApply={() => onApply("milestones", "milestones", result.milestone_suggestions)}
      />
      <DraftListBlock
        title="公开准备度提示"
        items={result.public_readiness_notes}
        copied={copiedKey === "public_readiness_notes"}
        onCopy={() => onCopy("public_readiness_notes", result.public_readiness_notes)}
      />
      <DraftListBlock
        title="敏感信息风险"
        items={result.sensitive_risks}
        copied={copiedKey === "sensitive_risks"}
        tone="rose"
        onCopy={() => onCopy("sensitive_risks", result.sensitive_risks)}
      />
      <DraftListBlock
        title="下一步完善建议"
        items={result.next_steps}
        copied={copiedKey === "next_steps"}
        onCopy={() => onCopy("next_steps", result.next_steps)}
      />
    </div>
  );
}

function DraftBlock({
  title,
  value,
  copied,
  applied,
  onCopy,
  onApply
}: {
  title: string;
  value: string;
  copied?: boolean;
  applied?: boolean;
  onCopy: () => void;
  onApply?: () => void;
}) {
  if (!value.trim()) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <ActionButtons copied={copied} applied={applied} onCopy={onCopy} onApply={onApply} />
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function DraftListBlock({
  title,
  items,
  copied,
  applied,
  tone = "slate",
  onCopy,
  onApply
}: {
  title: string;
  items: string[];
  copied?: boolean;
  applied?: boolean;
  tone?: "slate" | "rose";
  onCopy: () => void;
  onApply?: () => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <ActionButtons copied={copied} applied={applied} onCopy={onCopy} onApply={onApply} />
      </div>
      <ul className={cn("mt-3 space-y-2 text-sm leading-6", tone === "rose" ? "text-rose-700" : "text-slate-700")}>
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionButtons({
  copied,
  applied,
  onCopy,
  onApply
}: {
  copied?: boolean;
  applied?: boolean;
  onCopy: () => void;
  onApply?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
      >
        {copied ? <Check size={14} /> : <Clipboard size={14} />}
        {copied ? "已复制" : "复制"}
      </button>
      {onApply ? (
        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          {applied ? <Check size={14} /> : <Wand2 size={14} />}
          {applied ? "已采用" : "采用到表单"}
        </button>
      ) : null}
    </div>
  );
}

function getTargetForm(root: HTMLDivElement | null, formId: string | undefined) {
  if (formId) {
    const form = document.getElementById(formId);
    return form instanceof HTMLFormElement ? form : null;
  }

  return root?.closest("form") ?? null;
}

function readFormValue(form: HTMLFormElement, name: string) {
  const control = getFormControl(form, name);
  return control ? control.value.trim() : "";
}

function readFormList(form: HTMLFormElement, name: string) {
  return Array.from(
    new Set(
      readFormValue(form, name)
        .split(/[\n,，]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function writeFormValue(form: HTMLFormElement, name: string, value: string) {
  const control = getFormControl(form, name);
  if (!control) {
    return;
  }

  control.value = value;
  control.dispatchEvent(new Event("input", { bubbles: true }));
  control.dispatchEvent(new Event("change", { bubbles: true }));
}

function getFormControl(form: HTMLFormElement, name: string) {
  const item = form.elements.namedItem(name);
  if (item instanceof HTMLInputElement || item instanceof HTMLTextAreaElement || item instanceof HTMLSelectElement) {
    return item;
  }

  return null;
}

function normalizeStatus(value: string) {
  return ["planning", "in_progress", "completed", "archived"].includes(value) ? value : undefined;
}

function normalizeVisibility(value: string) {
  return ["public", "private", "unlisted"].includes(value) ? value : undefined;
}
