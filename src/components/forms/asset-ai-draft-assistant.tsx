"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Check, Clipboard, Loader2, Sparkles, Wand2 } from "lucide-react";
import { generateKnowledgeAiDraftAction, generatePublicationAiDraftAction, generateSkillAiDraftAction } from "@/actions/ai-draft-form-copilot";
import { AiDraftModeSelector, aiDraftModeSteps, getAiDraftModeActionLabel } from "@/components/forms/ai-draft-mode-controls";
import { publicationTypes, skillStatuses } from "@/lib/content-options";
import type { AiDraftMode, KnowledgeAiDraftResult, KnowledgeAiDraftState, PublicationAiDraftResult, PublicationAiDraftState, SkillAiDraftResult, SkillAiDraftState } from "@/lib/ai-draft-form-copilot";
import { cn } from "@/lib/utils";

type AssistantState<TResult> = {
  status: "idle" | "success" | "error";
  message?: string;
  result?: TResult;
  rawText?: string;
  modelName?: string;
};

type AssistantActions = {
  copiedKey: string | null;
  appliedKey: string | null;
  onCopy: (key: string, value: string | string[]) => void;
  onApply: (key: string, fieldName: string, value: string | string[]) => void;
};

type AssistantProps = {
  isConfigured: boolean;
  providerLabel: string;
  model: string;
  formId: string;
};

const visibilityValues = ["public", "private", "unlisted"] as const;
const publicationTypeValues = publicationTypes.map((item) => item.value);
const skillStatusValues = skillStatuses.map((item) => item.value);

export function PublicationAiDraftAssistant(props: AssistantProps) {
  return (
    <AiDraftAssistantShell<PublicationAiDraftResult>
      {...props}
      moduleLabel="Publication"
      description="根据当前成果草稿补全摘要、Abstract、标签和公开表达。"
      missingFormMessage="未找到当前 Publication 表单，请刷新页面后重试。"
      safeNote="只读取当前成果表单草稿；不自动保存、不自动公开，不读取 Documents、Storage 或附件链接。"
      generate={(form, mode) =>
        generatePublicationAiDraftAction({
          assetType: "publication",
          mode,
          draft: {
            title: readFormValue(form, "title"),
            publication_type: normalizeAllowed(readFormValue(form, "publication_type"), publicationTypeValues),
            summary: readFormValue(form, "summary"),
            abstract: readFormValue(form, "abstract"),
            tags: readFormList(form, "tags"),
            visibility: normalizeAllowed(readFormValue(form, "visibility"), visibilityValues),
            published_on: readFormValue(form, "published_on"),
            project_id: readFormValue(form, "project_id")
          }
        }) as Promise<PublicationAiDraftState>
      }
      renderResult={(result, actions, mode) => <PublicationAiDraftResultView result={result} actions={actions} mode={mode} />}
    />
  );
}

export function KnowledgeAiDraftAssistant(props: AssistantProps) {
  return (
    <AiDraftAssistantShell<KnowledgeAiDraftResult>
      {...props}
      moduleLabel="Knowledge"
      description="根据当前知识草稿补全摘要、大纲、正文建议和标签。"
      missingFormMessage="未找到当前 Knowledge 表单，请刷新页面后重试。"
      safeNote="只读取当前知识表单草稿；不自动保存、不自动公开，不读取 Documents、Storage 或文件正文。"
      generate={(form, mode) =>
        generateKnowledgeAiDraftAction({
          assetType: "knowledge",
          mode,
          draft: {
            title: readFormValue(form, "title"),
            category: readFormValue(form, "category"),
            excerpt: readFormValue(form, "excerpt"),
            content: readFormValue(form, "content"),
            tags: readFormList(form, "tags"),
            visibility: normalizeAllowed(readFormValue(form, "visibility"), visibilityValues),
            project_id: readFormValue(form, "project_id")
          }
        }) as Promise<KnowledgeAiDraftState>
      }
      renderResult={(result, actions, mode) => <KnowledgeAiDraftResultView result={result} actions={actions} mode={mode} />}
    />
  );
}

export function SkillAiDraftAssistant(props: AssistantProps) {
  return (
    <AiDraftAssistantShell<SkillAiDraftResult>
      {...props}
      moduleLabel="Skill"
      description="根据当前 Skill 草稿补全说明、输入输出、指南和工作流步骤。"
      missingFormMessage="未找到当前 Skill 表单，请刷新页面后重试。"
      safeNote="只读取当前 Skill 表单草稿；不自动保存、不自动公开，不读取 Skill package、Documents、Storage 或上传代码。"
      generate={(form, mode) =>
        generateSkillAiDraftAction({
          assetType: "skill",
          mode,
          draft: {
            name: readFormValue(form, "name"),
            description: readFormValue(form, "description"),
            category: readFormValue(form, "category"),
            content: readFormValue(form, "content"),
            input_description: readFormValue(form, "input_description"),
            output_description: readFormValue(form, "output_description"),
            usage_guide: readFormValue(form, "usage_guide"),
            platforms: readFormList(form, "platforms"),
            current_version: readFormValue(form, "current_version"),
            visibility: normalizeAllowed(readFormValue(form, "visibility"), visibilityValues),
            status: normalizeAllowed(readFormValue(form, "status"), skillStatusValues)
          }
        }) as Promise<SkillAiDraftState>
      }
      renderResult={(result, actions, mode) => <SkillAiDraftResultView result={result} actions={actions} mode={mode} />}
    />
  );
}

function AiDraftAssistantShell<TResult>({
  isConfigured,
  providerLabel,
  model,
  formId,
  moduleLabel,
  description,
  missingFormMessage,
  safeNote,
  generate,
  renderResult
}: AssistantProps & {
  moduleLabel: string;
  description: string;
  missingFormMessage: string;
  safeNote: string;
  generate: (form: HTMLFormElement, mode: AiDraftMode) => Promise<AssistantState<TResult>>;
  renderResult: (result: TResult, actions: AssistantActions, mode: AiDraftMode) => ReactNode;
}) {
  const [state, setState] = useState<AssistantState<TResult>>({ status: "idle" });
  const [mode, setMode] = useState<AiDraftMode>("complete_missing");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const generationSteps = aiDraftModeSteps[mode];

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveStep((current) => Math.min(current + 1, generationSteps.length - 1));
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [generationSteps.length, isGenerating]);

  async function handleGenerate() {
    const form = getTargetForm(formId);
    if (!form) {
      setState({ status: "error", message: missingFormMessage });
      return;
    }

    setState({ status: "idle" });
    setCopiedKey(null);
    setAppliedKey(null);
    setActiveStep(0);
    setIsGenerating(true);

    try {
      const nextState = await generate(form, mode);
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
    const form = getTargetForm(formId);
    if (!form) {
      return;
    }

    const didApply = writeFormValue(form, fieldName, value);
    if (!didApply) {
      return;
    }

    setAppliedKey(key);
    window.setTimeout(() => setAppliedKey((current) => (current === key ? null : current)), 1600);
  }

  const actions = { copiedKey, appliedKey, onCopy: copyText, onApply: applyField };

  return (
    <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-soft">
      <div className="border-b border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold leading-6 text-slate-950">AI 草稿补全助手</h2>
              <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{moduleLabel}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
          </div>
        </div>
        <div className="mt-3 flex min-w-0 items-center gap-2 rounded-2xl border border-blue-100 bg-white/80 px-3 py-2 text-xs leading-5 text-slate-600 shadow-sm">
          <span className="shrink-0 font-semibold text-slate-950">{providerLabel}</span>
          <span className="shrink-0 text-slate-300">/</span>
          <span className="min-w-0 truncate">{model}</span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs leading-5 text-blue-800">{safeNote}</div>

        {!isConfigured ? (
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
            <div>
              <p className="font-semibold">AI 草稿助手尚未配置</p>
              <p className="mt-1">配置 AI_API_KEY 或 OPENAI_API_KEY 后可用；当前表单仍可正常编辑和保存。</p>
            </div>
          </div>
        ) : null}

        <AiDraftModeSelector value={mode} onChange={setMode} disabled={isGenerating} />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!isConfigured || isGenerating}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:translate-y-0"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
          {getAiDraftModeActionLabel(mode, isGenerating)}
        </button>
        <p className="text-xs leading-5 text-slate-500">采用建议只更新浏览器字段；仍需手动保存。</p>

        {isGenerating ? <GenerationProgress activeStep={activeStep} steps={generationSteps} /> : null}

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

        {state.result ? renderResult(state.result, actions, mode) : null}

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

function PublicationAiDraftResultView({ result, actions, mode }: { result: PublicationAiDraftResult; actions: AssistantActions; mode: AiDraftMode }) {
  const draftBlocks = (
    <>
      <DraftListBlock
        title="标题优化建议"
        items={result.title_suggestions}
        copied={actions.copiedKey === "publication-title"}
        applied={actions.appliedKey === "publication-title"}
        onCopy={() => actions.onCopy("publication-title", result.title_suggestions)}
        onApply={result.title_suggestions[0] ? () => actions.onApply("publication-title", "title", result.title_suggestions[0]) : undefined}
      />
      <DraftBlock
        title="成果简介建议"
        value={result.summary_draft}
        copied={actions.copiedKey === "publication-summary"}
        applied={actions.appliedKey === "publication-summary"}
        onCopy={() => actions.onCopy("publication-summary", result.summary_draft)}
        onApply={() => actions.onApply("publication-summary", "summary", result.summary_draft)}
      />
      <DraftBlock
        title="Abstract 草稿"
        value={result.abstract_draft}
        copied={actions.copiedKey === "publication-abstract"}
        applied={actions.appliedKey === "publication-abstract"}
        onCopy={() => actions.onCopy("publication-abstract", result.abstract_draft)}
        onApply={() => actions.onApply("publication-abstract", "abstract", result.abstract_draft)}
      />
      <DraftListBlock
        title="标签建议"
        items={result.tag_suggestions}
        copied={actions.copiedKey === "publication-tags"}
        applied={actions.appliedKey === "publication-tags"}
        onCopy={() => actions.onCopy("publication-tags", result.tag_suggestions)}
        onApply={() => actions.onApply("publication-tags", "tags", result.tag_suggestions)}
      />
      <DraftListBlock
        title="公开站点定位"
        items={result.publication_positioning}
        copied={actions.copiedKey === "publication-positioning"}
        onCopy={() => actions.onCopy("publication-positioning", result.publication_positioning)}
      />
      <DraftListBlock
        title="结构建议"
        items={result.structure_suggestions}
        copied={actions.copiedKey === "publication-structure"}
        onCopy={() => actions.onCopy("publication-structure", result.structure_suggestions)}
      />
    </>
  );
  const riskBlocks = <RiskAndNextBlocks prefix="publication" result={result} actions={actions} />;

  return (
    <div className="mt-5 space-y-4">
      {mode === "public_safety_check" ? (
        <>
          {riskBlocks}
          {draftBlocks}
        </>
      ) : (
        <>
          {draftBlocks}
          {riskBlocks}
        </>
      )}
    </div>
  );
}

function KnowledgeAiDraftResultView({ result, actions, mode }: { result: KnowledgeAiDraftResult; actions: AssistantActions; mode: AiDraftMode }) {
  const draftBlocks = (
    <>
      <DraftListBlock
        title="标题优化建议"
        items={result.title_suggestions}
        copied={actions.copiedKey === "knowledge-title"}
        applied={actions.appliedKey === "knowledge-title"}
        onCopy={() => actions.onCopy("knowledge-title", result.title_suggestions)}
        onApply={result.title_suggestions[0] ? () => actions.onApply("knowledge-title", "title", result.title_suggestions[0]) : undefined}
      />
      <DraftBlock
        title="摘要建议"
        value={result.excerpt_draft}
        copied={actions.copiedKey === "knowledge-excerpt"}
        applied={actions.appliedKey === "knowledge-excerpt"}
        onCopy={() => actions.onCopy("knowledge-excerpt", result.excerpt_draft)}
        onApply={() => actions.onApply("knowledge-excerpt", "excerpt", result.excerpt_draft)}
      />
      <DraftListBlock
        title="正文大纲"
        items={result.content_outline}
        copied={actions.copiedKey === "knowledge-outline"}
        onCopy={() => actions.onCopy("knowledge-outline", result.content_outline)}
      />
      <DraftBlock
        title="Markdown 正文草稿"
        value={result.content_draft}
        copied={actions.copiedKey === "knowledge-content"}
        applied={actions.appliedKey === "knowledge-content"}
        onCopy={() => actions.onCopy("knowledge-content", result.content_draft)}
        onApply={() => actions.onApply("knowledge-content", "content", result.content_draft)}
      />
      <DraftListBlock
        title="标签建议"
        items={result.tag_suggestions}
        copied={actions.copiedKey === "knowledge-tags"}
        applied={actions.appliedKey === "knowledge-tags"}
        onCopy={() => actions.onCopy("knowledge-tags", result.tag_suggestions)}
        onApply={() => actions.onApply("knowledge-tags", "tags", result.tag_suggestions)}
      />
      <DraftListBlock
        title="分类建议"
        items={result.category_suggestions}
        copied={actions.copiedKey === "knowledge-category"}
        applied={actions.appliedKey === "knowledge-category"}
        onCopy={() => actions.onCopy("knowledge-category", result.category_suggestions)}
        onApply={() => actions.onApply("knowledge-category", "category", result.category_suggestions)}
      />
    </>
  );
  const riskBlocks = <RiskAndNextBlocks prefix="knowledge" result={result} actions={actions} />;

  return (
    <div className="mt-5 space-y-4">
      {mode === "public_safety_check" ? (
        <>
          {riskBlocks}
          {draftBlocks}
        </>
      ) : (
        <>
          {draftBlocks}
          {riskBlocks}
        </>
      )}
    </div>
  );
}

function SkillAiDraftResultView({ result, actions, mode }: { result: SkillAiDraftResult; actions: AssistantActions; mode: AiDraftMode }) {
  const draftBlocks = (
    <>
      <DraftListBlock
        title="名称优化建议"
        items={result.name_suggestions}
        copied={actions.copiedKey === "skill-name"}
        applied={actions.appliedKey === "skill-name"}
        onCopy={() => actions.onCopy("skill-name", result.name_suggestions)}
        onApply={result.name_suggestions[0] ? () => actions.onApply("skill-name", "name", result.name_suggestions[0]) : undefined}
      />
      <DraftBlock
        title="简短描述建议"
        value={result.description_draft}
        copied={actions.copiedKey === "skill-description"}
        applied={actions.appliedKey === "skill-description"}
        onCopy={() => actions.onCopy("skill-description", result.description_draft)}
        onApply={() => actions.onApply("skill-description", "description", result.description_draft)}
      />
      <DraftBlock
        title="详细说明草稿"
        value={result.content_draft}
        copied={actions.copiedKey === "skill-content"}
        applied={actions.appliedKey === "skill-content"}
        onCopy={() => actions.onCopy("skill-content", result.content_draft)}
        onApply={() => actions.onApply("skill-content", "content", result.content_draft)}
      />
      <DraftBlock
        title="输入说明草稿"
        value={result.input_description_draft}
        copied={actions.copiedKey === "skill-input"}
        applied={actions.appliedKey === "skill-input"}
        onCopy={() => actions.onCopy("skill-input", result.input_description_draft)}
        onApply={() => actions.onApply("skill-input", "input_description", result.input_description_draft)}
      />
      <DraftBlock
        title="输出说明草稿"
        value={result.output_description_draft}
        copied={actions.copiedKey === "skill-output"}
        applied={actions.appliedKey === "skill-output"}
        onCopy={() => actions.onCopy("skill-output", result.output_description_draft)}
        onApply={() => actions.onApply("skill-output", "output_description", result.output_description_draft)}
      />
      <DraftBlock
        title="使用指南草稿"
        value={result.usage_guide_draft}
        copied={actions.copiedKey === "skill-usage"}
        applied={actions.appliedKey === "skill-usage"}
        onCopy={() => actions.onCopy("skill-usage", result.usage_guide_draft)}
        onApply={() => actions.onApply("skill-usage", "usage_guide", result.usage_guide_draft)}
      />
      <DraftListBlock
        title="平台建议"
        items={result.platform_suggestions}
        copied={actions.copiedKey === "skill-platforms"}
        applied={actions.appliedKey === "skill-platforms"}
        onCopy={() => actions.onCopy("skill-platforms", result.platform_suggestions)}
        onApply={() => actions.onApply("skill-platforms", "platforms", result.platform_suggestions)}
      />
      <DraftBlock
        title="版本号建议"
        value={result.current_version_suggestion}
        copied={actions.copiedKey === "skill-version"}
        applied={actions.appliedKey === "skill-version"}
        onCopy={() => actions.onCopy("skill-version", result.current_version_suggestion)}
        onApply={() => actions.onApply("skill-version", "current_version", result.current_version_suggestion)}
      />
      <DraftListBlock
        title="工作流步骤"
        items={result.workflow_steps}
        copied={actions.copiedKey === "skill-workflow"}
        onCopy={() => actions.onCopy("skill-workflow", result.workflow_steps)}
      />
    </>
  );
  const riskBlocks = <RiskAndNextBlocks prefix="skill" result={result} actions={actions} />;

  return (
    <div className="mt-5 space-y-4">
      {mode === "public_safety_check" ? (
        <>
          {riskBlocks}
          {draftBlocks}
        </>
      ) : (
        <>
          {draftBlocks}
          {riskBlocks}
        </>
      )}
    </div>
  );
}

function RiskAndNextBlocks({
  prefix,
  result,
  actions
}: {
  prefix: string;
  result: { public_readiness_notes: string[]; sensitive_risks: string[]; next_steps: string[] };
  actions: AssistantActions;
}) {
  return (
    <>
      <DraftListBlock
        title="公开准备度提示"
        items={result.public_readiness_notes}
        copied={actions.copiedKey === `${prefix}-readiness`}
        onCopy={() => actions.onCopy(`${prefix}-readiness`, result.public_readiness_notes)}
      />
      <DraftListBlock
        title="敏感信息风险"
        items={result.sensitive_risks}
        copied={actions.copiedKey === `${prefix}-risks`}
        tone="rose"
        onCopy={() => actions.onCopy(`${prefix}-risks`, result.sensitive_risks)}
      />
      <DraftListBlock
        title="下一步完善建议"
        items={result.next_steps}
        copied={actions.copiedKey === `${prefix}-next`}
        onCopy={() => actions.onCopy(`${prefix}-next`, result.next_steps)}
      />
    </>
  );
}

function GenerationProgress({ activeStep, steps }: { activeStep: number; steps: ReadonlyArray<{ title: string; description: string }> }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-slate-50 p-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-950">生成进度</p>
        <p className="text-[11px] font-medium text-blue-700">{activeStep + 1}/{steps.length}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((step, index) => (
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

function getTargetForm(formId: string) {
  const form = document.getElementById(formId);
  return form instanceof HTMLFormElement ? form : null;
}

function readFormValue(form: HTMLFormElement, name: string) {
  const controls = getNamedControls(form, name);
  const control = controls[0];

  if (!control) {
    return "";
  }

  if (control instanceof HTMLInputElement && control.type === "checkbox") {
    return controls
      .filter((item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === "checkbox" && item.checked)
      .map((item) => item.value.trim())
      .filter(Boolean)[0] ?? "";
  }

  return control.value.trim();
}

function readFormList(form: HTMLFormElement, name: string) {
  const controls = getNamedControls(form, name);
  const checkboxValues = controls
    .filter((item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === "checkbox" && item.checked)
    .map((item) => item.value.trim())
    .filter(Boolean);

  if (checkboxValues.length > 0) {
    return Array.from(new Set(checkboxValues));
  }

  return Array.from(
    new Set(
      readFormValue(form, name)
        .split(/[\n,，]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function writeFormValue(form: HTMLFormElement, name: string, value: string | string[]) {
  const controls = getNamedControls(form, name);
  if (controls.length === 0) {
    return false;
  }

  const values = (Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean);
  if (values.length === 0) {
    return false;
  }

  const checkboxes = controls.filter((item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === "checkbox");
  if (checkboxes.length > 0) {
    const selected = new Set(values.map((item) => item.toLowerCase()));
    checkboxes.forEach((checkbox) => {
      checkbox.checked = selected.has(checkbox.value.toLowerCase());
      dispatchInputEvents(checkbox);
    });
    return true;
  }

  const control = controls[0];
  if (control instanceof HTMLSelectElement) {
    const nextValue = findSelectOptionValue(control, values);
    if (!nextValue) {
      return false;
    }
    control.value = nextValue;
    dispatchInputEvents(control);
    return true;
  }

  control.value = Array.isArray(value) ? values.join("\n") : values[0];
  dispatchInputEvents(control);
  return true;
}

function getNamedControls(form: HTMLFormElement, name: string) {
  return Array.from(form.elements).filter((element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement => {
    return (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) && element.name === name;
  });
}

function findSelectOptionValue(select: HTMLSelectElement, values: string[]) {
  const options = Array.from(select.options);

  for (const value of values) {
    const direct = options.find((option) => option.value === value);
    if (direct) {
      return direct.value;
    }

    const byLabel = options.find((option) => option.text.trim() === value);
    if (byLabel) {
      return byLabel.value;
    }
  }

  return "";
}

function dispatchInputEvents(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  control.dispatchEvent(new Event("input", { bubbles: true }));
  control.dispatchEvent(new Event("change", { bubbles: true }));
}

function normalizeAllowed<T extends readonly string[]>(value: string, allowed: T) {
  return allowed.includes(value) ? value : undefined;
}
