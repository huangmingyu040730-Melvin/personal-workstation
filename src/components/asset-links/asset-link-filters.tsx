"use client";

import { Field, Select } from "@/components/forms/form-fields";
import { researchAssetRelationTypes, researchAssetTypes } from "@/lib/content-options";
import type { ResearchAssetRelationType, ResearchAssetType } from "@/lib/content-types";

export type AssetLinkDirectionFilter = "all" | "outbound" | "inbound";
export type AssetLinkAssetTypeFilter = "all" | ResearchAssetType;
export type AssetLinkRelationTypeFilter = "all" | ResearchAssetRelationType;

type AssetLinkFiltersProps = {
  direction: AssetLinkDirectionFilter;
  assetType: AssetLinkAssetTypeFilter;
  relationType: AssetLinkRelationTypeFilter;
  onDirectionChange: (value: AssetLinkDirectionFilter) => void;
  onAssetTypeChange: (value: AssetLinkAssetTypeFilter) => void;
  onRelationTypeChange: (value: AssetLinkRelationTypeFilter) => void;
};

export function AssetLinkFilters({
  direction,
  assetType,
  relationType,
  onDirectionChange,
  onAssetTypeChange,
  onRelationTypeChange
}: AssetLinkFiltersProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-3">
      <Field label="方向">
        <Select
          value={direction}
          onChange={(event) => onDirectionChange(event.target.value as AssetLinkDirectionFilter)}
        >
          <option value="all">全部关系</option>
          <option value="outbound">当前资产关联出去</option>
          <option value="inbound">反向关系</option>
        </Select>
      </Field>

      <Field label="对方资产类型">
        <Select
          value={assetType}
          onChange={(event) => onAssetTypeChange(event.target.value as AssetLinkAssetTypeFilter)}
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
          onChange={(event) => onRelationTypeChange(event.target.value as AssetLinkRelationTypeFilter)}
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
