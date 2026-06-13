"use client";

import { Search, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { DocumentRelatedType } from "@/lib/content-types";
import { cn } from "@/lib/utils";
import type { DocumentRelatedOptions } from "./document-related-select";

type AssetPickerOption = {
  type: DocumentRelatedType;
  typeLabel: string;
  id: string;
  title: string;
  value: string;
};

type AssetPickerGroup = {
  type: DocumentRelatedType;
  label: string;
  items: AssetPickerOption[];
};

type DocumentAssetLinkPickerProps = {
  options: DocumentRelatedOptions;
  name?: string;
  defaultValues?: string[];
  disabled?: boolean;
  compact?: boolean;
  className?: string;
};

const GROUP_LABELS: Record<DocumentRelatedType, string> = {
  publication: "学术成果",
  project: "研究项目",
  knowledge: "知识库",
  skill: "Skill 库"
};

function makeOption(type: DocumentRelatedType, id: string, title: string): AssetPickerOption {
  return {
    type,
    typeLabel: GROUP_LABELS[type],
    id,
    title,
    value: `${type}:${id}`
  };
}

function buildGroups(options: DocumentRelatedOptions): AssetPickerGroup[] {
  return [
    {
      type: "publication",
      label: GROUP_LABELS.publication,
      items: options.publications.map((publication) => makeOption("publication", publication.id, publication.title))
    },
    {
      type: "project",
      label: GROUP_LABELS.project,
      items: options.projects.map((project) => makeOption("project", project.id, project.title))
    },
    {
      type: "knowledge",
      label: GROUP_LABELS.knowledge,
      items: options.knowledgeNotes.map((note) => makeOption("knowledge", note.id, note.title))
    },
    {
      type: "skill",
      label: GROUP_LABELS.skill,
      items: options.skills.map((skill) => makeOption("skill", skill.id, skill.title))
    }
  ];
}

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function DocumentAssetLinkPicker({
  options,
  name = "asset_links",
  defaultValues = [],
  disabled = false,
  compact = false,
  className
}: DocumentAssetLinkPickerProps) {
  const pickerId = useId();
  const groups = useMemo(() => buildGroups(options), [options]);
  const optionsByValue = useMemo(() => new Map(groups.flatMap((group) => group.items.map((item) => [item.value, item]))), [groups]);
  const [selectedValues, setSelectedValues] = useState(() => getUniqueValues(defaultValues));
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const selectedOptions = selectedValues
    .map((value) => optionsByValue.get(value))
    .filter((option): option is AssetPickerOption => Boolean(option));
  const filteredGroups = normalizedQuery
    ? groups.map((group) => ({
        ...group,
        items: group.items.filter((item) => (
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.typeLabel.toLowerCase().includes(normalizedQuery)
        ))
      }))
    : groups;

  function toggleValue(value: string) {
    if (disabled) {
      return;
    }

    setSelectedValues((current) => (
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    ));
  }

  function removeValue(value: string) {
    if (disabled) {
      return;
    }

    setSelectedValues((current) => current.filter((item) => item !== value));
  }

  return (
    <div className={cn("space-y-3", className)}>
      {selectedValues.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">已选择 {selectedOptions.length} 个关联对象</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">第一项会写入 legacy primary relation，仅用于兼容旧筛选和路径 fallback。</p>
          </div>
          <label className="relative block sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="筛选关联对象..."
              disabled={disabled}
              className="h-9 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option, index) => (
              <span key={option.value} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-blue-100 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
                <span className="shrink-0 text-blue-700">{option.typeLabel}</span>
                <span className="truncate">{option.title}</span>
                {index === 0 ? <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">主关联</span> : null}
                <button
                  type="button"
                  onClick={() => removeValue(option.value)}
                  disabled={disabled}
                  className="ml-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                  aria-label={`取消选择 ${option.title}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))
          ) : (
            <span className="rounded-lg border border-dashed border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">暂未选择关联对象</span>
          )}
        </div>
      </div>

      <div className={cn("grid gap-3", compact ? "max-h-[340px] overflow-y-auto pr-1" : "lg:grid-cols-2")}>
        {filteredGroups.map((group) => (
          <div key={group.type} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{group.label}</p>
              <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500">{group.items.length}</span>
            </div>
            {group.items.length > 0 ? (
              <div className={cn("space-y-2", compact ? "" : "max-h-52 overflow-y-auto pr-1")}>
                {group.items.map((item) => {
                  const checkboxId = `${pickerId}-${item.type}-${item.id}`;
                  const checked = selectedValues.includes(item.value);

                  return (
                    <label
                      key={item.value}
                      htmlFor={checkboxId}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 text-sm transition",
                        checked ? "border-blue-200 bg-blue-50 text-blue-950" : "border-slate-100 bg-slate-50/70 text-slate-700 hover:border-blue-200 hover:bg-white",
                        disabled ? "cursor-not-allowed opacity-60" : ""
                      )}
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleValue(item.value)}
                        disabled={disabled}
                        className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-blue-700 focus:ring-blue-200"
                      />
                      <span className="min-w-0">
                        <span className="block break-words font-medium">{item.title}</span>
                        <span className="mt-1 inline-flex rounded-md bg-white/70 px-1.5 py-0.5 text-[11px] text-slate-500">{item.typeLabel}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">没有匹配的关联对象。</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
