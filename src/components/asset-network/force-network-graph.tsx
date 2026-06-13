"use client";

import dynamic from "next/dynamic";
import { AdminEmptyState } from "@/components/admin-ui";
import type { AssetNetworkEdge, AssetNetworkNode } from "@/lib/queries/asset-network";
import type { AssetNetworkNodeDegree } from "./asset-network-node-groups";

export type ForceNetworkNode = AssetNetworkNode & {
  degree: number;
  inboundCount: number;
  outboundCount: number;
  nodeSize: number;
  nodeColor: string;
};

export type ForceNetworkLink = {
  id: string;
  source: string | ForceNetworkNode;
  target: string | ForceNetworkNode;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: AssetNetworkEdge["relationType"];
  relationLabel: string;
  note: string | null;
  updatedAt: string;
};

export type ForceNetworkGraphData = {
  nodes: ForceNetworkNode[];
  links: ForceNetworkLink[];
};

export type ForceNetworkGraphProps = {
  nodes: AssetNetworkNode[];
  edges: AssetNetworkEdge[];
  nodeById: Record<string, AssetNetworkNode>;
  degrees: Record<string, AssetNetworkNodeDegree>;
};

const ForceNetworkGraphPanel = dynamic(
  () => import("./force-network-graph-panel").then((mod) => mod.ForceNetworkGraphPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-sm font-medium text-slate-500 md:h-[640px]">
        正在加载动态图谱...
      </div>
    )
  }
);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const assetTypeColors: Record<AssetNetworkNode["assetType"], string> = {
  project: "#2563eb",
  knowledge: "#059669",
  skill: "#d97706",
  publication: "#be123c"
};

function buildForceGraphData(
  nodes: AssetNetworkNode[],
  edges: AssetNetworkEdge[],
  degrees: Record<string, AssetNetworkNodeDegree>
): ForceNetworkGraphData {
  return {
    nodes: nodes.map((node) => {
      const nodeDegree = degrees[node.id] ?? { outbound: 0, inbound: 0 };
      const degree = nodeDegree.outbound + nodeDegree.inbound;

      return {
        ...node,
        degree,
        inboundCount: nodeDegree.inbound,
        outboundCount: nodeDegree.outbound,
        nodeSize: clamp(7 + Math.sqrt(Math.max(degree, 1)) * 3.6, 9, 24),
        nodeColor: assetTypeColors[node.assetType]
      };
    }),
    links: edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceNodeId,
      target: edge.targetNodeId,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      relationType: edge.relationType,
      relationLabel: edge.relationLabel,
      note: edge.note,
      updatedAt: edge.updatedAt
    }))
  };
}

export function ForceNetworkGraph({
  nodes,
  edges,
  nodeById,
  degrees
}: ForceNetworkGraphProps) {
  if (nodes.length === 0 || edges.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50">
        <AdminEmptyState
          title="当前筛选条件下没有可视化关系"
          description="可以放宽资产类型、关系类型或关键词筛选，或先在资产详情页创建显式关系。"
        />
      </div>
    );
  }

  const graphData = buildForceGraphData(nodes, edges, degrees);

  return (
    <ForceNetworkGraphPanel
      graphData={graphData}
      nodeById={nodeById}
    />
  );
}
