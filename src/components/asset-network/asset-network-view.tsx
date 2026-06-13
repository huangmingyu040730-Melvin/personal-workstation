"use client";

import { useMemo, useState } from "react";
import { AdminEmptyState } from "@/components/admin-ui";
import { Card, CardHeader } from "@/components/card";
import type { AssetNetworkEdge, AssetNetworkGraph, AssetNetworkNode } from "@/lib/queries/asset-network";
import { AssetNetworkEdgeList } from "./asset-network-edge-list";
import {
  AssetNetworkFilters,
  type AssetNetworkAssetTypeFilter,
  type AssetNetworkRelationTypeFilter
} from "./asset-network-filters";
import { ForceNetworkGraph } from "./force-network-graph";
import type { AssetNetworkNodeDegree } from "./asset-network-node-groups";
import { AssetNetworkSummary } from "./asset-network-summary";

type AssetNetworkViewProps = {
  graph: AssetNetworkGraph;
  linkLimit: number;
};

function normalizeFilterText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesNodeFilter(node: AssetNetworkNode, assetType: AssetNetworkAssetTypeFilter, keyword: string) {
  const matchesType = assetType === "all" || node.assetType === assetType;
  const normalizedKeyword = normalizeFilterText(keyword);

  if (!matchesType) {
    return false;
  }

  if (!normalizedKeyword) {
    return true;
  }

  return normalizeFilterText([node.title, node.metadata].filter(Boolean).join(" ")).includes(normalizedKeyword);
}

function matchesRelationFilter(edge: AssetNetworkEdge, relationType: AssetNetworkRelationTypeFilter) {
  return relationType === "all" || edge.relationType === relationType;
}

function buildNodeDegreeMap(edges: AssetNetworkEdge[]) {
  const degrees: Record<string, AssetNetworkNodeDegree> = {};

  for (const edge of edges) {
    degrees[edge.sourceNodeId] = degrees[edge.sourceNodeId] ?? { outbound: 0, inbound: 0 };
    degrees[edge.targetNodeId] = degrees[edge.targetNodeId] ?? { outbound: 0, inbound: 0 };
    degrees[edge.sourceNodeId].outbound += 1;
    degrees[edge.targetNodeId].inbound += 1;
  }

  return degrees;
}

function buildNodeRecord(nodes: AssetNetworkNode[]) {
  return nodes.reduce<Record<string, AssetNetworkNode>>((record, node) => {
    record[node.id] = node;
    return record;
  }, {});
}

export function AssetNetworkView({ graph, linkLimit }: AssetNetworkViewProps) {
  const [assetType, setAssetType] = useState<AssetNetworkAssetTypeFilter>("all");
  const [relationType, setRelationType] = useState<AssetNetworkRelationTypeFilter>("all");
  const [keyword, setKeyword] = useState("");

  const nodeById = useMemo(() => buildNodeRecord(graph.nodes), [graph.nodes]);
  const degrees = useMemo(() => buildNodeDegreeMap(graph.edges), [graph.edges]);
  const matchingNodeIds = useMemo(
    () =>
      new Set(
        graph.nodes
          .filter((node) => matchesNodeFilter(node, assetType, keyword))
          .map((node) => node.id)
      ),
    [assetType, graph.nodes, keyword]
  );

  const visibleEdges = useMemo(
    () =>
      graph.edges.filter((edge) => {
        return (
          matchesRelationFilter(edge, relationType) &&
          matchingNodeIds.has(edge.sourceNodeId) &&
          matchingNodeIds.has(edge.targetNodeId)
        );
      }),
    [graph.edges, matchingNodeIds, relationType]
  );

  const visibleNodes = useMemo(
    () => graph.nodes.filter((node) => matchingNodeIds.has(node.id)),
    [graph.nodes, matchingNodeIds]
  );

  const visibleNodeById = useMemo(() => buildNodeRecord(visibleNodes), [visibleNodes]);

  if (graph.edges.length === 0) {
    return (
      <Card>
        <AdminEmptyState
          title="还没有显式关系网络"
          description="在任意 Project、Knowledge、Skill 或 Publication 详情页创建显式关系后，这里会显示全局研究资产网络。"
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="网络总览"
          description={`最多读取最近更新的 ${linkLimit} 条显式关系；当前只展示 Project、Knowledge、Skill、Publication。`}
        />
        <AssetNetworkSummary
          nodes={visibleNodes}
          edges={visibleEdges}
          totalNodeCount={graph.nodes.length}
          totalEdgeCount={graph.edges.length}
        />
      </Card>

      <Card>
        <CardHeader
          title="筛选网络"
          description="筛选只在当前已加载的节点和关系中完成，不读取正文、不重新查询文件、不访问 Storage。"
        />
        <AssetNetworkFilters
          assetType={assetType}
          relationType={relationType}
          keyword={keyword}
          onAssetTypeChange={setAssetType}
          onRelationTypeChange={setRelationType}
          onKeywordChange={setKeyword}
        />
      </Card>

      <Card>
        <CardHeader
          title="动态图谱"
          description="拖动节点、缩放或平移画布，点击节点或关系线查看详情；创建、编辑、删除仍在资产详情页完成。"
        />
        <ForceNetworkGraph
          nodes={visibleNodes}
          edges={visibleEdges}
          nodeById={visibleNodeById}
          degrees={degrees}
        />
      </Card>

      <Card>
        <CardHeader
          title="全部关系列表"
          description="辅助只读列表，用于核对 source、relation_type 和 target；图谱上方筛选会同步影响这里。"
        />
        {visibleEdges.length === 0 ? (
          <AdminEmptyState
            title="当前筛选条件下没有关系"
            description="可以放宽资产类型、关系类型或关键词筛选。"
          />
        ) : (
          <AssetNetworkEdgeList edges={visibleEdges} nodeById={nodeById} />
        )}
      </Card>
    </div>
  );
}
