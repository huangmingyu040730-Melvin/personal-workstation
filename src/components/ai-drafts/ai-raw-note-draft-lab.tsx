"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Clipboard, FileText, Loader2, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { generateStructuredDraftFromRawNoteAction } from "@/actions/ai-raw-note-draft-lab";
import {
  rawNoteMaxLength,
  type AiDraftTargetType,
  type AiRawNoteDraftResult,
  type AiRawNoteDraftState,
  type RawNoteKnowledgeDraftResult,
  type RawNoteProjectDraftResult,
  type RawNotePublicationDraftResult,
  type RawNoteSkillDraftResult
} from "@/lib/ai-raw-note-draft-lab";
import { getAiDraftHandoffNewFormPath, saveAiDraftHandoff } from "@/lib/ai-draft-handoff";
import { cn } from "@/lib/utils";

type AiRawNoteDraftLabProps = {
  isConfigured: boolean;
  providerLabel: string;
  model: string;
};

const targetOptions: Array<{
  value: AiDraftTargetType;
  label: string;
  description: string;
}> = [
  { value: "project", label: "Project / 研究项目", description: "研究主题、问题、方法与阶段计划" },
  { value: "publication", label: "Publication / 学术成果", description: "报告摘要、abstract 与结构建议" },
  { value: "knowledge", label: "Knowledge / 知识笔记", description: "知识摘要、正文大纲与 Markdown 初稿" },
  { value: "skill", label: "Skill / 工作流", description: "工作流说明、输入输出与使用指南" }
];

const initialState: AiRawNoteDraftState = { status: "idle" };

export function AiRawNoteDraftLab({ isConfigured, providerLabel, model }: AiRawNoteDraftLabProps) {
  const router = useRouter();
  const [targetType, setTargetType] = useState<AiDraftTargetType>("project");
  const [rawText, setRawText] = useState("");
  const [state, setState] = useState<AiRawNoteDraftState>(initialState);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const trimmedRawText = rawText.trim();
  const isInputTooShort = trimmedRawText.length > 0 && trimmedRawText.length < 20;
  const canGenerate = isConfigured && !isGenerating && trimmedRawText.length >= 20;

  async function handleGenerate() {
    if (!canGenerate) {
      return;
    }

    setState(initialState);
    setCopiedKey(null);
    setIsGenerating(true);

    try {
      const nextState = await generateStructuredDraftFromRawNoteAction({ targetType, rawText: trimmedRawText });
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

  function handlePrefillNewForm(target: AiDraftTargetType, result: AiRawNoteDraftResult) {
    const saved = saveAiDraftHandoff(target, result);
    if (!saved) {
      setState((current) => ({
        ...current,
        status: "error",
        message: "当前浏览器无法写入 sessionStorage，暂时不能带入新建表单。请改用复制字段。"
      }));
      return;
    }

    router.push(getAiDraftHandoffNewFormPath(target));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)] 2xl:grid-cols-[minmax(0,0.85fr)_minmax(460px,1.15fr)]">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <Sparkles size={21} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">原始素材</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">选择目标类型，粘贴一段粗糙文本，生成可复制的后台内容草稿。</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-blue-800">
          不要粘贴客户敏感信息、API key、未脱敏内部资料、Storage path、signed URL 或私密文件内容。
        </div>

        {!isConfigured ? (
          <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
            <div>
              <p className="font-semibold">AI 草稿实验室尚未配置</p>
              <p className="mt-1">配置 AI_API_KEY 或 OPENAI_API_KEY 后可用；当前页面仍可正常打开。</p>
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-950">目标草稿类型</p>
          <div className="mt-3 grid gap-2">
            {targetOptions.map((option) => {
              const selected = option.value === targetType;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTargetType(option.value)}
                  disabled={isGenerating}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-70",
                    selected
                      ? "border-blue-200 bg-blue-50 text-blue-900 shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-white"
                  )}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-950">原始文本</span>
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            maxLength={rawNoteMaxLength}
            rows={14}
            placeholder="粘贴研究想法、会议摘录、报告摘要、临时备忘或 Skill 工作流想法..."
            className="mt-2 min-h-72 w-full resize-y rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <div className="mt-2 flex flex-col gap-2 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{trimmedRawText.length}/{rawNoteMaxLength} 字符</span>
          {isInputTooShort ? <span className="text-amber-700">请至少输入 20 个字符。</span> : <span>生成结果只供复制，不会保存。</span>}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:translate-y-0"
        >
          {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
          {isGenerating ? "正在生成结构化草稿" : "生成结构化草稿"}
        </button>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <p className="font-semibold text-slate-950">安全边界</p>
          <p className="mt-1">仅提交目标类型和原始文本；不读取 Documents、Storage、附件、下载链接或数据库记录，不自动创建任何资产。</p>
        </div>
      </section>

      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">结构化草稿结果</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">复制字段或完整 Markdown 后，再到对应后台表单人工创建内容。</p>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs leading-5 text-blue-800">
            <span className="shrink-0 font-semibold">{providerLabel}</span>
            <span className="shrink-0 text-blue-300">/</span>
            <span className="min-w-0 truncate">{model}</span>
          </div>
        </div>

        {state.message ? (
          <div
            className={cn(
              "mt-4 rounded-2xl border px-3 py-2 text-xs leading-5",
              state.status === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"
            )}
          >
            {state.message}
          </div>
        ) : null}

        {state.result && state.targetType ? (
          <DraftResultView
            result={state.result}
            targetType={state.targetType}
            copiedKey={copiedKey}
            onCopy={copyText}
            onPrefillNewForm={() => handlePrefillNewForm(state.targetType as AiDraftTargetType, state.result as AiRawNoteDraftResult)}
          />
        ) : null}

        {state.rawText ? (
          <div className="mt-5">
            <DraftFieldBlock
              title="AI 原始文本"
              value={state.rawText}
              copied={copiedKey === "raw-text"}
              onCopy={() => copyText("raw-text", state.rawText ?? "")}
            />
          </div>
        ) : null}

        {!state.result && !state.rawText ? (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
              <FileText size={22} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-950">等待生成草稿</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">生成后会显示结构化字段、公开风险提示和下一步建议。</p>
          </div>
        ) : null}

        {state.modelName ? <p className="mt-4 text-xs text-slate-400">Model: {state.modelName}</p> : null}
      </section>
    </div>
  );
}

function DraftResultView({
  result,
  targetType,
  copiedKey,
  onCopy,
  onPrefillNewForm
}: {
  result: AiRawNoteDraftResult;
  targetType: AiDraftTargetType;
  copiedKey: string | null;
  onCopy: (key: string, value: string | string[]) => void;
  onPrefillNewForm: () => void;
}) {
  const markdown = buildDraftMarkdown(targetType, result);

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-blue-700" size={18} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">{getTargetLabel(targetType)} 草稿</p>
            <p className="mt-1 text-xs leading-5 text-blue-800">只生成可复制草稿；不会写入数据库或修改 visibility。</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPrefillNewForm}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <Wand2 size={14} />
            带入新建 {getTargetShortLabel(targetType)} 表单
          </button>
          <button
            type="button"
            onClick={() => onCopy("complete-markdown", markdown)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            {copiedKey === "complete-markdown" ? <Check size={14} /> : <Clipboard size={14} />}
            {copiedKey === "complete-markdown" ? "已复制" : "复制完整 Markdown"}
          </button>
        </div>
      </div>
      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
        带入新建表单只会保存到当前浏览器的临时 sessionStorage，不会写入数据库，也不会自动保存。
      </p>

      {targetType === "project" ? <ProjectDraftBlocks result={result as RawNoteProjectDraftResult} copiedKey={copiedKey} onCopy={onCopy} /> : null}
      {targetType === "publication" ? <PublicationDraftBlocks result={result as RawNotePublicationDraftResult} copiedKey={copiedKey} onCopy={onCopy} /> : null}
      {targetType === "knowledge" ? <KnowledgeDraftBlocks result={result as RawNoteKnowledgeDraftResult} copiedKey={copiedKey} onCopy={onCopy} /> : null}
      {targetType === "skill" ? <SkillDraftBlocks result={result as RawNoteSkillDraftResult} copiedKey={copiedKey} onCopy={onCopy} /> : null}
    </div>
  );
}

function ProjectDraftBlocks({ result, copiedKey, onCopy }: DraftBlocksProps<RawNoteProjectDraftResult>) {
  return (
    <>
      <DraftFieldBlock title="标题" value={result.title} copied={copiedKey === "project-title"} onCopy={() => onCopy("project-title", result.title)} />
      <DraftFieldBlock title="简介" value={result.summary} copied={copiedKey === "project-summary"} onCopy={() => onCopy("project-summary", result.summary)} />
      <DraftFieldBlock title="研究背景" value={result.background} copied={copiedKey === "project-background"} onCopy={() => onCopy("project-background", result.background)} />
      <DraftFieldBlock title="研究问题" value={result.research_question} copied={copiedKey === "project-question"} onCopy={() => onCopy("project-question", result.research_question)} />
      <DraftFieldBlock title="研究方法" value={result.methodology} copied={copiedKey === "project-methodology"} onCopy={() => onCopy("project-methodology", result.methodology)} />
      <DraftListBlock title="标签" items={result.tags} copied={copiedKey === "project-tags"} onCopy={() => onCopy("project-tags", result.tags)} />
      <DraftListBlock title="阶段计划" items={result.milestones} copied={copiedKey === "project-milestones"} onCopy={() => onCopy("project-milestones", result.milestones)} />
      <RiskBlocks prefix="project" result={result} copiedKey={copiedKey} onCopy={onCopy} />
    </>
  );
}

function PublicationDraftBlocks({ result, copiedKey, onCopy }: DraftBlocksProps<RawNotePublicationDraftResult>) {
  return (
    <>
      <DraftFieldBlock title="标题" value={result.title} copied={copiedKey === "publication-title"} onCopy={() => onCopy("publication-title", result.title)} />
      <DraftFieldBlock title="成果类型建议" value={result.publication_type_suggestion} copied={copiedKey === "publication-type"} onCopy={() => onCopy("publication-type", result.publication_type_suggestion)} />
      <DraftFieldBlock title="成果简介" value={result.summary} copied={copiedKey === "publication-summary"} onCopy={() => onCopy("publication-summary", result.summary)} />
      <DraftFieldBlock title="Abstract" value={result.abstract} copied={copiedKey === "publication-abstract"} onCopy={() => onCopy("publication-abstract", result.abstract)} />
      <DraftListBlock title="标签" items={result.tags} copied={copiedKey === "publication-tags"} onCopy={() => onCopy("publication-tags", result.tags)} />
      <DraftListBlock title="结构建议" items={result.structure_suggestions} copied={copiedKey === "publication-structure"} onCopy={() => onCopy("publication-structure", result.structure_suggestions)} />
      <RiskBlocks prefix="publication" result={result} copiedKey={copiedKey} onCopy={onCopy} />
    </>
  );
}

function KnowledgeDraftBlocks({ result, copiedKey, onCopy }: DraftBlocksProps<RawNoteKnowledgeDraftResult>) {
  return (
    <>
      <DraftFieldBlock title="标题" value={result.title} copied={copiedKey === "knowledge-title"} onCopy={() => onCopy("knowledge-title", result.title)} />
      <DraftFieldBlock title="分类建议" value={result.category_suggestion} copied={copiedKey === "knowledge-category"} onCopy={() => onCopy("knowledge-category", result.category_suggestion)} />
      <DraftFieldBlock title="摘要" value={result.excerpt} copied={copiedKey === "knowledge-excerpt"} onCopy={() => onCopy("knowledge-excerpt", result.excerpt)} />
      <DraftListBlock title="正文大纲" items={result.content_outline} copied={copiedKey === "knowledge-outline"} onCopy={() => onCopy("knowledge-outline", result.content_outline)} />
      <DraftFieldBlock title="Markdown 正文草稿" value={result.content_draft} copied={copiedKey === "knowledge-content"} onCopy={() => onCopy("knowledge-content", result.content_draft)} />
      <DraftListBlock title="标签" items={result.tags} copied={copiedKey === "knowledge-tags"} onCopy={() => onCopy("knowledge-tags", result.tags)} />
      <RiskBlocks prefix="knowledge" result={result} copiedKey={copiedKey} onCopy={onCopy} />
    </>
  );
}

function SkillDraftBlocks({ result, copiedKey, onCopy }: DraftBlocksProps<RawNoteSkillDraftResult>) {
  return (
    <>
      <DraftFieldBlock title="名称" value={result.name} copied={copiedKey === "skill-name"} onCopy={() => onCopy("skill-name", result.name)} />
      <DraftFieldBlock title="分类建议" value={result.category_suggestion} copied={copiedKey === "skill-category"} onCopy={() => onCopy("skill-category", result.category_suggestion)} />
      <DraftFieldBlock title="简短描述" value={result.description} copied={copiedKey === "skill-description"} onCopy={() => onCopy("skill-description", result.description)} />
      <DraftFieldBlock title="详细说明" value={result.content} copied={copiedKey === "skill-content"} onCopy={() => onCopy("skill-content", result.content)} />
      <DraftFieldBlock title="输入说明" value={result.input_description} copied={copiedKey === "skill-input"} onCopy={() => onCopy("skill-input", result.input_description)} />
      <DraftFieldBlock title="输出说明" value={result.output_description} copied={copiedKey === "skill-output"} onCopy={() => onCopy("skill-output", result.output_description)} />
      <DraftFieldBlock title="使用指南" value={result.usage_guide} copied={copiedKey === "skill-usage"} onCopy={() => onCopy("skill-usage", result.usage_guide)} />
      <DraftListBlock title="平台建议" items={result.platforms} copied={copiedKey === "skill-platforms"} onCopy={() => onCopy("skill-platforms", result.platforms)} />
      <DraftListBlock title="工作流步骤" items={result.workflow_steps} copied={copiedKey === "skill-workflow"} onCopy={() => onCopy("skill-workflow", result.workflow_steps)} />
      <RiskBlocks prefix="skill" result={result} copiedKey={copiedKey} onCopy={onCopy} />
    </>
  );
}

type DraftBlocksProps<TResult> = {
  result: TResult;
  copiedKey: string | null;
  onCopy: (key: string, value: string | string[]) => void;
};

function RiskBlocks({
  prefix,
  result,
  copiedKey,
  onCopy
}: {
  prefix: string;
  result: { public_readiness_notes: string[]; sensitive_risks: string[]; next_steps: string[] };
  copiedKey: string | null;
  onCopy: (key: string, value: string | string[]) => void;
}) {
  return (
    <>
      <DraftListBlock title="公开准备度提示" items={result.public_readiness_notes} copied={copiedKey === `${prefix}-readiness`} onCopy={() => onCopy(`${prefix}-readiness`, result.public_readiness_notes)} />
      <DraftListBlock title="敏感信息风险" items={result.sensitive_risks} copied={copiedKey === `${prefix}-risks`} tone="rose" onCopy={() => onCopy(`${prefix}-risks`, result.sensitive_risks)} />
      <DraftListBlock title="下一步建议" items={result.next_steps} copied={copiedKey === `${prefix}-next`} onCopy={() => onCopy(`${prefix}-next`, result.next_steps)} />
    </>
  );
}

function DraftFieldBlock({
  title,
  value,
  copied,
  onCopy
}: {
  title: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  if (!value.trim()) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <CopyButton copied={copied} onCopy={onCopy} />
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function DraftListBlock({
  title,
  items,
  copied,
  tone = "slate",
  onCopy
}: {
  title: string;
  items: string[];
  copied: boolean;
  tone?: "slate" | "rose";
  onCopy: () => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        <CopyButton copied={copied} onCopy={onCopy} />
      </div>
      <ul className={cn("mt-3 space-y-2 text-sm leading-6", tone === "rose" ? "text-rose-700" : "text-slate-700")}>
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyButton({ copied, onCopy }: { copied: boolean; onCopy: () => void }) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
    >
      {copied ? <Check size={14} /> : <Clipboard size={14} />}
      {copied ? "已复制" : "复制"}
    </button>
  );
}

function getTargetLabel(targetType: AiDraftTargetType) {
  return targetOptions.find((option) => option.value === targetType)?.label ?? "结构化";
}

function getTargetShortLabel(targetType: AiDraftTargetType) {
  return {
    project: "Project",
    publication: "Publication",
    knowledge: "Knowledge",
    skill: "Skill"
  }[targetType];
}

function buildDraftMarkdown(targetType: AiDraftTargetType, result: AiRawNoteDraftResult) {
  if (targetType === "project") {
    const draft = result as RawNoteProjectDraftResult;
    return [
      `# ${draft.title || "未命名研究项目"}`,
      "",
      "## 简介",
      draft.summary,
      "",
      "## 研究背景",
      draft.background,
      "",
      "## 研究问题",
      draft.research_question,
      "",
      "## 研究方法",
      draft.methodology,
      "",
      markdownList("标签", draft.tags),
      markdownList("阶段计划", draft.milestones),
      markdownList("公开准备度提示", draft.public_readiness_notes),
      markdownList("敏感信息风险", draft.sensitive_risks),
      markdownList("下一步建议", draft.next_steps)
    ].filter(Boolean).join("\n");
  }

  if (targetType === "publication") {
    const draft = result as RawNotePublicationDraftResult;
    return [
      `# ${draft.title || "未命名学术成果"}`,
      "",
      `成果类型建议：${draft.publication_type_suggestion || "建议人工选择"}`,
      "",
      "## Summary",
      draft.summary,
      "",
      "## Abstract",
      draft.abstract,
      "",
      markdownList("标签", draft.tags),
      markdownList("结构建议", draft.structure_suggestions),
      markdownList("公开准备度提示", draft.public_readiness_notes),
      markdownList("敏感信息风险", draft.sensitive_risks),
      markdownList("下一步建议", draft.next_steps)
    ].filter(Boolean).join("\n");
  }

  if (targetType === "knowledge") {
    const draft = result as RawNoteKnowledgeDraftResult;
    return [
      `# ${draft.title || "未命名知识笔记"}`,
      "",
      `分类建议：${draft.category_suggestion || "建议人工选择"}`,
      "",
      "## 摘要",
      draft.excerpt,
      "",
      markdownList("正文大纲", draft.content_outline),
      "",
      "## 正文草稿",
      draft.content_draft,
      "",
      markdownList("标签", draft.tags),
      markdownList("公开准备度提示", draft.public_readiness_notes),
      markdownList("敏感信息风险", draft.sensitive_risks),
      markdownList("下一步建议", draft.next_steps)
    ].filter(Boolean).join("\n");
  }

  const draft = result as RawNoteSkillDraftResult;
  return [
    `# ${draft.name || "未命名 Skill"}`,
    "",
    `分类建议：${draft.category_suggestion || "建议人工选择"}`,
    "",
    "## 简短描述",
    draft.description,
    "",
    "## 详细说明",
    draft.content,
    "",
    "## 输入说明",
    draft.input_description,
    "",
    "## 输出说明",
    draft.output_description,
    "",
    "## 使用指南",
    draft.usage_guide,
    "",
    markdownList("平台建议", draft.platforms),
    markdownList("工作流步骤", draft.workflow_steps),
    markdownList("公开准备度提示", draft.public_readiness_notes),
    markdownList("敏感信息风险", draft.sensitive_risks),
    markdownList("下一步建议", draft.next_steps)
  ].filter(Boolean).join("\n");
}

function markdownList(title: string, items: string[]) {
  if (items.length === 0) {
    return "";
  }

  return [`## ${title}`, ...items.map((item) => `- ${item}`), ""].join("\n");
}
