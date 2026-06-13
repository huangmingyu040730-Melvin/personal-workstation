"use client";

import { Field, Select, TextInput } from "@/components/forms/form-fields";
import { researchAssetRelationTypes, researchAssetTypes } from "@/lib/content-options";
import type { ResearchAssetRelationType, ResearchAssetType } from "@/lib/content-types";

export type AssetNetworkAssetTypeFilter = "all" | ResearchAssetType;
export type AssetNetworkRelationTypeFilter = "all" | ResearchAssetRelationType;

type AssetNetworkFiltersProps = {
  assetType: AssetNetworkAssetTypeFilter;
  relationType: AssetNetworkRelationTypeFilter;
  keyword: string;
  onAssetTypeChange: (value: AssetNetworkAssetTypeFilter) => void;
  onRelationTypeChange: (value: AssetNetworkRelationTypeFilter) => void;
  onKeywordChange: (value: string) => void;
};

export function AssetNetworkFilters({
  assetType,
  relationType,
  keyword,
  onAssetTypeChange,
  onRelationTypeChange,
  onKeywordChange
}: AssetNetworkFiltersProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
      <Field label="关键词">
        <TextInput
          type="search"
          placeholder="筛选节点标题或 metadata..."
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
      </Field>

      <Field label="资产类型">
        <Select
          value={assetType}
          onChange={(event) => onAssetTypeChange(event.target.value as AssetNetworkAssetTypeFilter)}
        >
          <option value="all">全部资产类型</option>
          {researchAssetTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="关系类型">
        <Select
          value={relationType}
          onChange={(event) => onRelationTypeChange(event.target.value as AssetNetworkRelationTypeFilter)}
        >
          <option value="all">全部关系类型</option>
          {researchAssetRelationTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
