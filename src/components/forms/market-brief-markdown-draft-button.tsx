"use client";

import { Wand2 } from "lucide-react";

export function MarketBriefMarkdownDraftButton({
  markdown,
  targetId = "market-brief-markdown-content"
}: {
  markdown: string;
  targetId?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const target = document.getElementById(targetId);

        if (target instanceof HTMLTextAreaElement) {
          target.value = markdown;
          target.dispatchEvent(new Event("input", { bubbles: true }));
          target.focus();
        }
      }}
      className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-100"
    >
      <Wand2 size={16} />
      从结构化字段生成 Markdown 草稿
    </button>
  );
}
