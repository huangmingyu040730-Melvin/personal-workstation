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

function getFocusedNetwork(
  nodes: AssetNetworkNode[],
  edges: AssetNetworkEdge[],
  focusNodeId: string | null
) {
  if (!focusNodeId) {
    return { nodes, edges };
  }

  const focusedEdges = edges.filter((edge) => edge.sourceNodeId === focusNodeId || edge.targetNodeId === focusNodeId);
  const focusedNodeIds = new Set<string>([focusNodeId]);

  for (const edge of focusedEdges) {
    focusedNodeIds.add(edge.sourceNodeId);
    focusedNodeIds.add(edge.targetNodeId);
  }

  return {
    nodes: nodes.filter((node) => focusedNodeIds.has(node.id)),
    edges: focusedEdges
  };
}

export function AssetNetworkView({ graph, linkLimit }: AssetNetworkViewProps) {
  const [assetType, setAssetType] = useState<AssetNetworkAssetTypeFilter>("all");
  const [relationType, setRelationType] = useState<AssetNetworkRelationTypeFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

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
  const activeFocusNodeId = focusNodeId && visibleNodeById[focusNodeId] ? focusNodeId : null;
  const focusedGraph = useMemo(
    () => getFocusedNetwork(visibleNodes, visibleEdges, activeFocusNodeId),
    [activeFocusNodeId, visibleEdges, visibleNodes]
  );
  const focusedNodeById = useMemo(() => buildNodeRecord(focusedGraph.nodes), [focusedGraph.nodes]);
  const focusedNodeTitle = activeFocusNodeId ? visibleNodeById[activeFocusNodeId]?.title : null;

  if (graph.edges.length === 0) {
    return (
      <div className="space-y-5">
        <Card className="overflow-hidden border-slate-900 bg-slate-950 p-0 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
          <GraphHeroHeader
            nodeCount={0}
            edgeCount={0}
            focusNodeTitle={null}
            onClearFocus={() => setFocusNodeId(null)}
          />
          <div className="p-5">
            <div className="flex min-h-[480px] items-center justify-center rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.22),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.96))] md:min-h-[580px] xl:min-h-[680px]">
              <AdminEmptyState
                title="还没有显式关系网络"
                description="在任意 Project、Knowledge、Skill 或 Publication 详情页创建显式关系后，这里会显示全局研究资产网络。"
              />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-slate-900 bg-slate-950 p-0 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <GraphHeroHeader
          nodeCount={focusedGraph.nodes.length}
          edgeCount={focusedGraph.edges.length}
          focusNodeTitle={focusedNodeTitle}
          onClearFocus={() => setFocusNodeId(null)}
        />
        <div className="p-3 sm:p-5">
          <ForceNetworkGraph
            nodes={focusedGraph.nodes}
            edges={focusedGraph.edges}
            nodeById={focusedNodeById}
            degrees={degrees}
            focusNodeId={activeFocusNodeId}
            onFocusNodeChange={setFocusNodeId}
            isLocalFocusActive={Boolean(activeFocusNodeId)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="筛选图谱"
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
          title="网络总览"
          description={`最多读取最近更新的 ${linkLimit} 条显式关系；统计会同步响应筛选和局部聚焦。`}
        />
        <AssetNetworkSummary
          nodes={focusedGraph.nodes}
          edges={focusedGraph.edges}
          totalNodeCount={graph.nodes.length}
          totalEdgeCount={graph.edges.length}
        />
      </Card>

      <Card>
        <CardHeader
          title="全部关系列表"
          description="辅助只读列表，用于核对 source、relation_type 和 target；筛选和局部聚焦会同步影响这里。"
        />
        {focusedGraph.edges.length === 0 ? (
          <AdminEmptyState
            title="当前筛选条件下没有关系"
            description="可以放宽资产类型、关系类型或关键词筛选，或恢复全局网络。"
          />
        ) : (
          <AssetNetworkEdgeList edges={focusedGraph.edges} nodeById={nodeById} />
        )}
      </Card>
    </div>
  );
}

function GraphHeroHeader({
  nodeCount,
  edgeCount,
  focusNodeTitle,
  onClearFocus
}: {
  nodeCount: number;
  edgeCount: number;
  focusNodeTitle: string | null;
  onClearFocus: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-4 text-white lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 className="text-lg font-semibold">动态关系图谱</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">
          节点代表研究资产，线代表显式关系。连接越多的节点越醒目；点击节点可查看局部关系。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-slate-100">
          当前显示 {nodeCount} 个节点 / {edgeCount} 条关系
        </span>
        {focusNodeTitle ? (
          <button
            type="button"
            onClick={onClearFocus}
            className="rounded-full border border-blue-300/40 bg-blue-400/15 px-3 py-1.5 text-blue-100 hover:bg-blue-400/25"
          >
            局部网络：{focusNodeTitle} · 恢复全局
          </button>
        ) : null}
      </div>
    </div>
  );
}
