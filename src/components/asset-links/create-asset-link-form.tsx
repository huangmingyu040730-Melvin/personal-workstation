"use client";

import { useMemo, useState } from "react";
import { createAssetLinkAction } from "@/actions/asset-links";
import { Field, Select, Textarea, TextInput } from "@/components/forms/form-fields";
import { SubmitButton } from "@/components/forms/submit-button";
import { researchAssetRelationTypes, researchAssetTypes } from "@/lib/content-options";
import type { ResearchAssetType } from "@/lib/content-types";
import type { AssetLinkTargetOptions } from "@/lib/queries/asset-links";

type CreateAssetLinkFormProps = {
  sourceType: ResearchAssetType;
  sourceId: string;
  targetOptions: AssetLinkTargetOptions;
  returnTo: string;
};

function getAvailableOptions(
  targetOptions: AssetLinkTargetOptions,
  sourceType: ResearchAssetType,
  sourceId: string,
  targetType: ResearchAssetType
) {
  return targetOptions[targetType].filter((item) => item.type !== sourceType || item.id !== sourceId);
}

function getInitialTargetType(
  targetOptions: AssetLinkTargetOptions,
  sourceType: ResearchAssetType,
  sourceId: string
) {
  return researchAssetTypes.find((item) => getAvailableOptions(targetOptions, sourceType, sourceId, item.value).length > 0)?.value ?? "project";
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesTargetSearch(item: { title: string; metadata: string | null }, search: string) {
  const keyword = normalizeSearchText(search);

  if (!keyword) {
    return true;
  }

  return normalizeSearchText([item.title, item.metadata].filter(Boolean).join(" ")).includes(keyword);
}

export function CreateAssetLinkForm({
  sourceType,
  sourceId,
  targetOptions,
  returnTo
}: CreateAssetLinkFormProps) {
  const [targetType, setTargetType] = useState<ResearchAssetType>(() => getInitialTargetType(targetOptions, sourceType, sourceId));
  const [targetSearch, setTargetSearch] = useState("");
  const currentOptions = useMemo(
    () => getAvailableOptions(targetOptions, sourceType, sourceId, targetType),
    [sourceId, sourceType, targetOptions, targetType]
  );
  const filteredOptions = useMemo(
    () => currentOptions.filter((item) => matchesTargetSearch(item, targetSearch)),
    [currentOptions, targetSearch]
  );
  const hasAnyOptions = useMemo(
    () => researchAssetTypes.some((item) => getAvailableOptions(targetOptions, sourceType, sourceId, item.value).length > 0),
    [sourceId, sourceType, targetOptions]
  );

  return (
    <form action={createAssetLinkAction} className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <input type="hidden" name="source_type" value={sourceType} />
      <input type="hidden" name="source_id" value={sourceId} />
      <input type="hidden" name="return_to" value={returnTo} />

      <div className="grid gap-4 lg:grid-cols-4">
        <Field label="目标类型">
          <Select
            name="target_type"
            value={targetType}
            onChange={(event) => {
              setTargetType(event.target.value as ResearchAssetType);
              setTargetSearch("");
            }}
          >
            {researchAssetTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="筛选目标">
          <TextInput
            type="search"
            placeholder="筛选目标资产..."
            value={targetSearch}
            onChange={(event) => setTargetSearch(event.target.value)}
          />
        </Field>

        <Field label="目标资产">
          <Select key={`${targetType}-${targetSearch}`} name="target_id" required disabled={filteredOptions.length === 0}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.metadata ? `${item.title} · ${item.metadata}` : item.title}
                </option>
              ))
            ) : currentOptions.length > 0 ? (
              <option value="">当前筛选无结果</option>
            ) : (
              <option value="">暂无可选资产</option>
            )}
          </Select>
          {currentOptions.length > 0 ? (
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              当前筛选 {filteredOptions.length} / {currentOptions.length} 个目标
            </span>
          ) : null}
        </Field>

        <Field label="关系">
          <Select name="relation_type" defaultValue="related">
            {researchAssetRelationTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="备注" hint="可选，用于说明这条关系的具体上下文。">
        <Textarea name="note" maxLength={500} rows={3} className="min-h-24" />
      </Field>

      {!hasAnyOptions ? (
        <p className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-500">
          暂无可关联的其他研究资产。请先创建 Project、Knowledge、Skill 或 Publication。
        </p>
      ) : null}

      <SubmitButton disabled={!hasAnyOptions || filteredOptions.length === 0} pendingLabel="关联中...">
        新增显式关系
      </SubmitButton>
    </form>
  );
}
