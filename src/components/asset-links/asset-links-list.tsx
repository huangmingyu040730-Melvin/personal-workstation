"use client";

import { useMemo, useState } from "react";
import { AdminEmptyState } from "@/components/admin-ui";
import { researchAssetRelationTypes } from "@/lib/content-options";
import type { ResearchAssetRelationType } from "@/lib/content-types";
import type { AssetLinksForAsset, ResolvedAssetLink } from "@/lib/queries/asset-links";
import { AssetLinkCard } from "./asset-link-card";
import {
  AssetLinkFilters,
  type AssetLinkAssetTypeFilter,
  type AssetLinkDirectionFilter,
  type AssetLinkRelationTypeFilter
} from "./asset-link-filters";
import { AssetLinkSummary } from "./asset-link-summary";

type AssetLinksListProps = {
  links: AssetLinksForAsset;
  returnTo: string;
};

function matchesFilters(
  link: ResolvedAssetLink,
  assetType: AssetLinkAssetTypeFilter,
  relationType: AssetLinkRelationTypeFilter
) {
  const matchesAssetType = assetType === "all" || link.other.type === assetType;
  const matchesRelationType = relationType === "all" || link.relation_type === relationType;

  return matchesAssetType && matchesRelationType;
}

export function AssetLinksList({ links, returnTo }: AssetLinksListProps) {
  const [direction, setDirection] = useState<AssetLinkDirectionFilter>("all");
  const [assetType, setAssetType] = useState<AssetLinkAssetTypeFilter>("all");
  const [relationType, setRelationType] = useState<AssetLinkRelationTypeFilter>("all");

  const allLinks = useMemo(() => [...links.outbound, ...links.inbound], [links.inbound, links.outbound]);
  const relationCounts = useMemo(
    () =>
      researchAssetRelationTypes
        .map((item) => ({
          relationType: item.value as ResearchAssetRelationType,
          count: allLinks.filter((link) => link.relation_type === item.value).length
        }))
        .filter((item) => item.count > 0),
    [allLinks]
  );
  const filteredOutbound = useMemo(
    () => (direction === "inbound" ? [] : links.outbound.filter((link) => matchesFilters(link, assetType, relationType))),
    [assetType, direction, links.outbound, relationType]
  );
  const filteredInbound = useMemo(
    () => (direction === "outbound" ? [] : links.inbound.filter((link) => matchesFilters(link, assetType, relationType))),
    [assetType, direction, links.inbound, relationType]
  );
  const filteredCount = filteredOutbound.length + filteredInbound.length;
  const hasLinks = allLinks.length > 0;

  if (!hasLinks) {
    return (
      <AdminEmptyState
        title="还没有显式关联资产"
        description="可以新增一条关系，表达当前资产支持、引用、使用、产出或来源于另一个研究资产。"
      />
    );
  }

  return (
    <div className="space-y-5">
      <AssetLinkSummary
        total={allLinks.length}
        outbound={links.outbound.length}
        inbound={links.inbound.length}
        filtered={filteredCount}
        relationCounts={relationCounts}
      />

      <AssetLinkFilters
        direction={direction}
        assetType={assetType}
        relationType={relationType}
        onDirectionChange={setDirection}
        onAssetTypeChange={setAssetType}
        onRelationTypeChange={setRelationType}
      />

      {filteredCount === 0 ? (
        <AdminEmptyState
          title="当前筛选条件下没有关系"
          description="可以放宽方向、资产类型或关系类型筛选。"
        />
      ) : null}

      {filteredOutbound.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">当前资产关联出去</h3>
            <span className="text-xs font-medium text-slate-400">{filteredOutbound.length}</span>
          </div>
          <div className="space-y-3">
            {filteredOutbound.map((link) => (
              <AssetLinkCard key={link.id} link={link} returnTo={returnTo} />
            ))}
          </div>
        </section>
      ) : null}

      {filteredInbound.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-950">反向关系</h3>
            <span className="text-xs font-medium text-slate-400">{filteredInbound.length}</span>
          </div>
          <div className="space-y-3">
            {filteredInbound.map((link) => (
              <AssetLinkCard key={link.id} link={link} returnTo={returnTo} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
