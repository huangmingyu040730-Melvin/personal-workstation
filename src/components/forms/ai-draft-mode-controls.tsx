"use client";

import type { AiDraftMode } from "@/lib/ai-draft-form-copilot";
import { cn } from "@/lib/utils";

export const aiDraftModeOptions: Array<{
  value: AiDraftMode;
  label: string;
  description: string;
  actionLabel: string;
  loadingLabel: string;
}> = [
  {
    value: "complete_missing",
    label: "补全空字段",
    description: "根据已填草稿补齐缺口",
    actionLabel: "生成补全建议",
    loadingLabel: "正在补全空字段"
  },
  {
    value: "improve_existing",
    label: "优化已有内容",
    description: "保留原意，优化表达结构",
    actionLabel: "生成优化建议",
    loadingLabel: "正在优化内容"
  },
  {
    value: "public_safety_check",
    label: "公开风险检查",
    description: "聚焦敏感风险和整改建议",
    actionLabel: "检查公开风险",
    loadingLabel: "正在检查风险"
  }
];

export const aiDraftModeSteps: Record<AiDraftMode, ReadonlyArray<{ title: string; description: string }>> = {
  complete_missing: [
    { title: "读取草稿", description: "收集当前表单白名单字段" },
    { title: "判断缺口", description: "识别空字段和可轻微优化内容" },
    { title: "生成补全建议", description: "整理可采纳的字段草稿" },
    { title: "复核公开边界", description: "补充公开准备度和风险提示" }
  ],
  improve_existing: [
    { title: "读取草稿", description: "收集已填写字段和上下文" },
    { title: "保留原意", description: "避免新增未经提供的事实" },
    { title: "优化表达", description: "改善语言、结构和清晰度" },
    { title: "复核公开边界", description: "补充公开表达风险提示" }
  ],
  public_safety_check: [
    { title: "读取草稿", description: "收集当前公开候选内容" },
    { title: "扫描敏感风险", description: "检查客户、内部、业绩和 secret 风险" },
    { title: "生成风险提示", description: "突出公开准备度和敏感信息" },
    { title: "给出整改建议", description: "建议脱敏、补证据或保持 private" }
  ]
};

export function AiDraftModeSelector({
  value,
  onChange,
  disabled
}: {
  value: AiDraftMode;
  onChange: (mode: AiDraftMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
      <div className="px-1 pb-1">
        <p className="text-xs font-semibold text-slate-950">生成模式</p>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">切换模式不会改动当前表单。</p>
      </div>
      <div className="mt-2 grid gap-1">
        {aiDraftModeOptions.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-70",
                selected
                  ? "border-blue-200 bg-white text-blue-800 shadow-sm"
                  : "border-transparent bg-transparent text-slate-600 hover:border-blue-100 hover:bg-white"
              )}
              aria-pressed={selected}
            >
              <span className="block text-xs font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function getAiDraftModeActionLabel(mode: AiDraftMode, isGenerating: boolean) {
  const option = aiDraftModeOptions.find((item) => item.value === mode);
  return isGenerating ? option?.loadingLabel ?? "正在生成建议" : option?.actionLabel ?? "根据当前表单生成建议";
}
