"use client";

import { useEffect, useRef, useState } from "react";
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
const generationSteps = [
  { title: "读取当前草稿", description: "收集标题、简介和研究字段" },
  { title: "组织补全方向", description: "判断缺失字段与可优化内容" },
  { title: "生成结构化建议", description: "整理摘要、方法、标签和阶段计划" },
  { title: "复核公开边界", description: "补充 public 风险和下一步建议" }
] as const;

export function ProjectAiDraftAssistant({ isConfigured, providerLabel, model, formId }: ProjectAiDraftAssistantProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ProjectAiDraftState>(initialState);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, generationSteps.length - 1));
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [isGenerating]);

  async function handleGenerate() {
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

    setState(initialState);
    setCopiedKey(null);
    setAppliedKey(null);
    setActiveStep(0);
    setIsGenerating(true);

    try {
      const nextState = await generateProjectAiDraftAction({ assetType: "project", draft });
      setState(nextState);
    } finally {
      setIsGenerating(false);
    }
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
    <section ref={rootRef} className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-soft">
      <div className="border-b border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold leading-6 text-slate-950">AI 草稿补全助手</h2>
              <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Project</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              根据左侧当前草稿补全摘要、方法、标签和阶段计划。
            </p>
          </div>
        </div>
        <div className="mt-3 flex min-w-0 items-center gap-2 rounded-2xl border border-blue-100 bg-white/80 px-3 py-2 text-xs leading-5 text-slate-600 shadow-sm">
          <span className="shrink-0 font-semibold text-slate-950">{providerLabel}</span>
          <span className="shrink-0 text-slate-300">/</span>
          <span className="min-w-0 truncate">{model}</span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs leading-5 text-blue-800">
          只读取当前表单草稿；不自动保存、不自动公开，不读取 Documents 或生成下载链接。
        </div>

        {!isConfigured ? (
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
            <div>
              <p className="font-semibold">AI 草稿助手尚未配置</p>
              <p className="mt-1">配置 AI_API_KEY 或 OPENAI_API_KEY 后可用；Project 表单仍可正常编辑和保存。</p>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!isConfigured || isGenerating}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:translate-y-0"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
          {isGenerating ? "正在生成建议" : "根据当前表单生成建议"}
        </button>
        <p className="text-xs leading-5 text-slate-500">采用建议只更新浏览器字段；仍需手动保存。</p>

        {isGenerating ? <GenerationProgress activeStep={activeStep} /> : null}

        {state.message ? (
          <div
            className={cn(
              "rounded-2xl border px-3 py-2 text-xs leading-5",
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

        {state.modelName ? <p className="text-xs text-slate-400">Model: {state.modelName}</p> : null}
      </div>
    </section>
  );
}

function GenerationProgress({ activeStep }: { activeStep: number }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-slate-50 p-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-950">生成进度</p>
        <p className="text-[11px] font-medium text-blue-700">{activeStep + 1}/{generationSteps.length}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${((activeStep + 1) / generationSteps.length) * 100}%` }}
        />
      </div>
      <ol className="mt-3 space-y-2">
        {generationSteps.map((step, index) => (
          <li key={step.title} className="flex gap-2">
            <span
              className={cn(
                "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                index < activeStep && "border-blue-600 bg-blue-600 text-white",
                index === activeStep && "border-blue-600 bg-white text-blue-700 shadow-[0_0_0_4px_rgba(37,99,235,0.12)]",
                index > activeStep && "border-slate-200 bg-white text-slate-300"
              )}
            >
              {index < activeStep ? "✓" : index + 1}
            </span>
            <span className="min-w-0">
              <span className={cn("block text-xs font-semibold", index <= activeStep ? "text-slate-900" : "text-slate-400")}>{step.title}</span>
              <span className="block text-[11px] leading-4 text-slate-500">{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
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
