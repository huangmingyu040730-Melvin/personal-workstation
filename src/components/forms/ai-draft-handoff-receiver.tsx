"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, Trash2, Wand2 } from "lucide-react";
import {
  appendCheckboxValues,
  getTargetForm,
  writeFormValue
} from "@/lib/browser-form-controls";
import {
  clearAiDraftHandoff,
  readAiDraftHandoff,
  type AiDraftHandoffPayload,
  type AiDraftHandoffTarget
} from "@/lib/ai-draft-handoff";
import type {
  AiRawNoteDraftResult,
  RawNoteKnowledgeDraftResult,
  RawNoteProjectDraftResult,
  RawNotePublicationDraftResult,
  RawNoteSkillDraftResult
} from "@/lib/ai-raw-note-draft-lab";

type AiDraftHandoffReceiverProps = {
  targetType: AiDraftHandoffTarget;
  formId: string;
};

const targetLabels: Record<AiDraftHandoffTarget, string> = {
  project: "Project",
  publication: "Publication",
  knowledge: "Knowledge",
  skill: "Skill"
};

export function AiDraftHandoffReceiver({ targetType, formId }: AiDraftHandoffReceiverProps) {
  const [payload, setPayload] = useState<AiDraftHandoffPayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPayload(readAiDraftHandoff(targetType));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [targetType]);

  function handleApply() {
    const form = getTargetForm(formId);
    if (!form || !payload) {
      setMessage("未找到当前表单，请刷新页面后重试。");
      return;
    }

    const notes = applyDraftToForm(targetType, payload.draft, form);
    clearAiDraftHandoff(targetType);
    setPayload(null);
    setMessage(["AI 草稿已填入，请人工检查后保存。", ...notes].join(" "));
  }

  function handleDismiss() {
    clearAiDraftHandoff(targetType);
    setPayload(null);
    setMessage("已忽略并清除 AI 草稿，不会填入当前表单。");
  }

  if (!payload && !message) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            {message ? <Check size={18} /> : <Sparkles size={18} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-950">
              {payload ? `检测到 AI 草稿：${targetLabels[targetType]}` : "AI 草稿提示"}
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-800">
              {payload
                ? "你可以将 AI 草稿实验室生成的草稿填入当前表单。填入后请人工检查，只有点击保存按钮后才会写入数据库。"
                : message}
            </p>
          </div>
        </div>

        {payload ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <Wand2 size={14} />
              填入表单
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
            >
              <Trash2 size={14} />
              忽略并清除
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function applyDraftToForm(targetType: AiDraftHandoffTarget, draft: AiRawNoteDraftResult, form: HTMLFormElement) {
  if (targetType === "project") {
    applyProjectDraft(form, draft as RawNoteProjectDraftResult);
    return [];
  }

  if (targetType === "publication") {
    return applyPublicationDraft(form, draft as RawNotePublicationDraftResult);
  }

  if (targetType === "knowledge") {
    return applyKnowledgeDraft(form, draft as RawNoteKnowledgeDraftResult);
  }

  return applySkillDraft(form, draft as RawNoteSkillDraftResult);
}

function applyProjectDraft(form: HTMLFormElement, draft: RawNoteProjectDraftResult) {
  writeFormValue(form, "title", draft.title);
  writeFormValue(form, "summary", draft.summary);
  writeFormValue(form, "background", draft.background);
  writeFormValue(form, "research_question", draft.research_question);
  writeFormValue(form, "methodology", draft.methodology);
  writeFormValue(form, "tags", draft.tags);
  writeFormValue(form, "milestones", draft.milestones);
}

function applyPublicationDraft(form: HTMLFormElement, draft: RawNotePublicationDraftResult) {
  const notes: string[] = [];
  writeFormValue(form, "title", draft.title);
  writeFormValue(form, "summary", draft.summary);
  writeFormValue(form, "abstract", draft.abstract);
  writeFormValue(form, "tags", draft.tags);
  applyOptionalSelect(form, "publication_type", draft.publication_type_suggestion, "成果类型建议", notes);
  return notes;
}

function applyKnowledgeDraft(form: HTMLFormElement, draft: RawNoteKnowledgeDraftResult) {
  const notes: string[] = [];
  writeFormValue(form, "title", draft.title);
  writeFormValue(form, "excerpt", draft.excerpt);
  writeFormValue(form, "content", draft.content_draft);
  writeFormValue(form, "tags", draft.tags);
  applyOptionalSelect(form, "category", draft.category_suggestion, "分类建议", notes);
  return notes;
}

function applySkillDraft(form: HTMLFormElement, draft: RawNoteSkillDraftResult) {
  const notes: string[] = [];
  writeFormValue(form, "name", draft.name);
  writeFormValue(form, "description", draft.description);
  writeFormValue(form, "content", draft.content);
  writeFormValue(form, "input_description", draft.input_description);
  writeFormValue(form, "output_description", draft.output_description);
  writeFormValue(form, "usage_guide", draft.usage_guide);
  appendCheckboxValues(form, "platforms", draft.platforms);
  applyOptionalSelect(form, "category", draft.category_suggestion, "分类建议", notes);
  return notes;
}

function applyOptionalSelect(form: HTMLFormElement, name: string, value: string, label: string, notes: string[]) {
  const normalized = value.trim();
  if (!normalized) {
    return;
  }

  const applied = writeFormValue(form, name, normalized);
  if (!applied) {
    notes.push(`${label}未匹配当前选项，请人工选择：${normalized}`);
  }
}
