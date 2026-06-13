"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject
} from "react-force-graph-2d";
import { ArrowRight, Crosshair, GitBranch, LocateFixed, Maximize2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/badge";
import {
  getResearchAssetRelationTypeLabel,
  getResearchAssetTypeLabel,
  researchAssetRelationTypes,
  researchAssetTypes
} from "@/lib/content-options";
import type { ResearchAssetType } from "@/lib/content-types";
import { formatDateTime } from "@/lib/format";
import type { AssetNetworkNode } from "@/lib/queries/asset-network";
import type { ForceNetworkGraphData, ForceNetworkLink, ForceNetworkNode } from "./force-network-graph";

type ForceNetworkGraphPanelProps = {
  graphData: ForceNetworkGraphData;
  nodeById: Record<string, AssetNetworkNode>;
  focusNodeId: string | null;
  onFocusNodeChange: (nodeId: string | null) => void;
  isLocalFocusActive: boolean;
};

type SelectedNetworkItem =
  | { type: "node"; node: ForceNetworkNode }
  | { type: "link"; link: ForceNetworkLink };

type LinkEndpointIds = {
  sourceId: string;
  targetId: string;
};

type Neighborhood = {
  nodeIds: Set<string>;
  linkIds: Set<string>;
};

const assetTypeColors: Record<ResearchAssetType, string> = {
  project: "#60a5fa",
  knowledge: "#34d399",
  skill: "#fbbf24",
  publication: "#fb7185"
};

const relationTypeColors: Record<ForceNetworkLink["relationType"], string> = {
  related: "#94a3b8",
  supports: "#60a5fa",
  references: "#a78bfa",
  uses: "#f59e0b",
  produces: "#34d399",
  derived_from: "#fb7185"
};

const relationTypeCurves: Record<ForceNetworkLink["relationType"], number> = {
  related: 0.02,
  supports: 0.08,
  references: -0.08,
  uses: 0.12,
  produces: -0.12,
  derived_from: 0.16
};

function getNodeId(node: string | number | NodeObject<ForceNetworkNode> | ForceNetworkNode | undefined) {
  if (node && typeof node === "object") {
    return String(node.id ?? "");
  }

  return String(node ?? "");
}

function getLinkEndpointIds(link: LinkObject<ForceNetworkNode, ForceNetworkLink> | ForceNetworkLink): LinkEndpointIds {
  return {
    sourceId: getNodeId(link.source) || link.sourceNodeId,
    targetId: getNodeId(link.target) || link.targetNodeId
  };
}

function getLinkEndpointTitle(nodeById: Record<string, AssetNetworkNode>, nodeId: string) {
  return nodeById[nodeId]?.title ?? "已删除或无法读取的资产";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function truncateCanvasLabel(value: string, maxLength = 24) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function getGraphHeight(width: number) {
  if (width < 640) {
    return 520;
  }

  if (width < 1024) {
    return 640;
  }

  return 740;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildNeighborhood(nodeId: string | null, links: ForceNetworkLink[]): Neighborhood {
  const nodeIds = new Set<string>();
  const linkIds = new Set<string>();

  if (!nodeId) {
    return { nodeIds, linkIds };
  }

  nodeIds.add(nodeId);

  for (const link of links) {
    const { sourceId, targetId } = getLinkEndpointIds(link);

    if (sourceId === nodeId || targetId === nodeId) {
      nodeIds.add(sourceId);
      nodeIds.add(targetId);
      linkIds.add(link.id);
    }
  }

  return { nodeIds, linkIds };
}

function buildLinkNeighborhood(link: ForceNetworkLink | null): Neighborhood {
  const nodeIds = new Set<string>();
  const linkIds = new Set<string>();

  if (!link) {
    return { nodeIds, linkIds };
  }

  const { sourceId, targetId } = getLinkEndpointIds(link);
  nodeIds.add(sourceId);
  nodeIds.add(targetId);
  linkIds.add(link.id);

  return { nodeIds, linkIds };
}

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const updateWidth = () => {
      setWidth(Math.max(320, Math.round(element.getBoundingClientRect().width)));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

function drawNode(
  node: NodeObject<ForceNetworkNode>,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  options: {
    isSelected: boolean;
    isHovered: boolean;
    isHighlighted: boolean;
    isDimmed: boolean;
  }
) {
  const radius = node.nodeSize ?? 10;
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const color = node.nodeColor ?? "#60a5fa";
  const label = truncateCanvasLabel(node.title ?? "未命名资产", globalScale < 1.1 ? 18 : 28);
  const fontSize = Math.max(10 / globalScale, 3.7);
  const highlight = options.isSelected || options.isHovered || options.isHighlighted;
  const opacity = options.isDimmed ? 0.16 : 1;
  const haloRadius = radius * (options.isSelected ? 3.4 : highlight ? 2.7 : 2.05);

  ctx.save();
  ctx.globalAlpha = opacity;

  const halo = ctx.createRadialGradient(x, y, radius * 0.45, x, y, haloRadius);
  halo.addColorStop(0, withAlpha(color, options.isSelected ? 0.44 : highlight ? 0.3 : 0.16));
  halo.addColorStop(0.55, withAlpha(color, options.isSelected ? 0.18 : highlight ? 0.12 : 0.06));
  halo.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, haloRadius, 0, 2 * Math.PI, false);
  ctx.fill();

  ctx.globalAlpha = options.isDimmed ? 0.38 : 1;
  ctx.beginPath();
  ctx.arc(x, y, radius + 4 / globalScale, 0, 2 * Math.PI, false);
  ctx.strokeStyle = withAlpha(color, options.isSelected ? 0.92 : highlight ? 0.64 : 0.28);
  ctx.lineWidth = (options.isSelected ? 2.4 : 1.4) / globalScale;
  ctx.stroke();

  const core = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.42, radius * 0.2, x, y, radius);
  core.addColorStop(0, "rgba(255, 255, 255, 0.92)");
  core.addColorStop(0.36, withAlpha(color, 0.96));
  core.addColorStop(1, withAlpha(color, 0.72));
  ctx.fillStyle = core;
  ctx.shadowColor = withAlpha(color, options.isSelected ? 0.72 : highlight ? 0.48 : 0.24);
  ctx.shadowBlur = (options.isSelected ? 18 : highlight ? 12 : 7) / globalScale;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(x - radius * 0.22, y - radius * 0.22, Math.max(radius * 0.35, 2.5 / globalScale), 0, 2 * Math.PI, false);
  ctx.fillStyle = "rgba(255, 255, 255, 0.76)";
  ctx.fill();

  if (globalScale > 0.52 && !options.isDimmed) {
    ctx.font = `650 ${fontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const textWidth = ctx.measureText(label).width;
    const textPaddingX = 6 / globalScale;
    const textPaddingY = 3 / globalScale;
    const textHeight = fontSize + textPaddingY * 2;
    const textY = y + radius + 8 / globalScale;

    ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
    roundRect(ctx, x - textWidth / 2 - textPaddingX, textY - textPaddingY, textWidth + textPaddingX * 2, textHeight, 7 / globalScale);
    ctx.fill();
    ctx.strokeStyle = withAlpha(color, options.isSelected ? 0.52 : 0.2);
    ctx.lineWidth = 1 / globalScale;
    ctx.stroke();
    ctx.fillStyle = "rgba(248, 250, 252, 0.94)";
    ctx.fillText(label, x, textY);
  }

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const limitedRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + limitedRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, limitedRadius);
  ctx.arcTo(x + width, y + height, x, y + height, limitedRadius);
  ctx.arcTo(x, y + height, x, y, limitedRadius);
  ctx.arcTo(x, y, x + width, y, limitedRadius);
  ctx.closePath();
}

function drawNodePointerArea(
  node: NodeObject<ForceNetworkNode>,
  color: string,
  ctx: CanvasRenderingContext2D
) {
  const radius = (node.nodeSize ?? 10) + 12;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI, false);
  ctx.fill();
}

function getSelectedNodeId(selectedItem: SelectedNetworkItem | null) {
  return selectedItem?.type === "node" ? selectedItem.node.id : null;
}

function getSelectedLink(selectedItem: SelectedNetworkItem | null) {
  return selectedItem?.type === "link" ? selectedItem.link : null;
}

export function ForceNetworkGraphPanel({
  graphData,
  nodeById,
  focusNodeId,
  onFocusNodeChange,
  isLocalFocusActive
}: ForceNetworkGraphPanelProps) {
  const graphRef = useRef<ForceGraphMethods<ForceNetworkNode, ForceNetworkLink> | undefined>(undefined);
  const { ref: containerRef, width } = useContainerWidth();
  const [selectedItemState, setSelectedItem] = useState<SelectedNetworkItem | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const height = getGraphHeight(width);

  const graphNodeById = useMemo(
    () =>
      graphData.nodes.reduce<Record<string, ForceNetworkNode>>((record, node) => {
        record[node.id] = node;
        return record;
      }, {}),
    [graphData.nodes]
  );
  const linkById = useMemo(
    () =>
      graphData.links.reduce<Record<string, ForceNetworkLink>>((record, link) => {
        record[link.id] = link;
        return record;
      }, {}),
    [graphData.links]
  );

  const selectedItem = useMemo<SelectedNetworkItem | null>(() => {
    if (!selectedItemState) {
      return null;
    }

    if (selectedItemState.type === "node") {
      const node = graphNodeById[selectedItemState.node.id];
      return node ? { type: "node", node } : null;
    }

    const link = linkById[selectedItemState.link.id];
    return link ? { type: "link", link } : null;
  }, [graphNodeById, linkById, selectedItemState]);

  const selectedNodeId = getSelectedNodeId(selectedItem);
  const selectedLink = getSelectedLink(selectedItem);
  const activeNodeId = selectedNodeId ?? focusNodeId ?? (hoveredNodeId && graphNodeById[hoveredNodeId] ? hoveredNodeId : null);
  const selectedLinkId = selectedLink?.id ?? null;
  const hoveredLink = hoveredLinkId ? linkById[hoveredLinkId] : null;
  const activeNeighborhood = useMemo(() => {
    if (activeNodeId) {
      return buildNeighborhood(activeNodeId, graphData.links);
    }

    return buildLinkNeighborhood(selectedLink ?? hoveredLink);
  }, [activeNodeId, graphData.links, hoveredLink, selectedLink]);
  const hasActiveHighlight = activeNeighborhood.nodeIds.size > 0 || activeNeighborhood.linkIds.size > 0;

  const relationCounts = useMemo(
    () =>
      researchAssetRelationTypes
        .map((item) => ({
          label: item.label,
          value: item.value,
          count: graphData.links.filter((link) => link.relationType === item.value).length,
          color: relationTypeColors[item.value]
        }))
        .filter((item) => item.count > 0),
    [graphData.links]
  );

  const centerNode = useCallback((nodeId: string) => {
    const node = graphData.nodes.find((item) => item.id === nodeId);

    if (node?.x === undefined || node.y === undefined) {
      graphRef.current?.zoomToFit(520, 80, (candidate) => candidate.id === nodeId);
      return;
    }

    graphRef.current?.centerAt(node.x, node.y, 520);
    graphRef.current?.zoom(Math.max(graphRef.current?.zoom() ?? 1, 1.55), 520);
  }, [graphData.nodes]);

  const handleFit = () => {
    graphRef.current?.zoomToFit(650, 90);
  };

  const handleReset = () => {
    graphRef.current?.d3ReheatSimulation();
    graphRef.current?.centerAt(0, 0, 500);
    graphRef.current?.zoom(1, 500);
  };

  const paintNode = useCallback(
    (node: NodeObject<ForceNetworkNode>, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNodeId === node.id;
      const isHighlighted = !hasActiveHighlight || activeNeighborhood.nodeIds.has(String(node.id));
      const isDimmed = hasActiveHighlight && !activeNeighborhood.nodeIds.has(String(node.id));

      drawNode(node, ctx, globalScale, {
        isSelected,
        isHovered,
        isHighlighted,
        isDimmed
      });
    },
    [activeNeighborhood.nodeIds, hasActiveHighlight, hoveredNodeId, selectedNodeId]
  );

  const getLinkVisual = useCallback(
    (link: LinkObject<ForceNetworkNode, ForceNetworkLink>) => {
      const isSelected = selectedLinkId === link.id;
      const isHovered = hoveredLinkId === link.id;
      const isHighlighted = !hasActiveHighlight || activeNeighborhood.linkIds.has(String(link.id));
      const isDimmed = hasActiveHighlight && !activeNeighborhood.linkIds.has(String(link.id));

      return {
        isSelected,
        isHovered,
        isHighlighted,
        isDimmed
      };
    },
    [activeNeighborhood.linkIds, hasActiveHighlight, hoveredLinkId, selectedLinkId]
  );

  const getLinkColor = useCallback(
    (link: LinkObject<ForceNetworkNode, ForceNetworkLink>) => {
      const visual = getLinkVisual(link);
      const color = relationTypeColors[link.relationType] ?? "#94a3b8";

      if (visual.isDimmed) {
        return withAlpha(color, 0.08);
      }

      if (visual.isSelected) {
        return withAlpha(color, 0.96);
      }

      if (visual.isHovered) {
        return withAlpha(color, 0.84);
      }

      if (visual.isHighlighted) {
        return withAlpha(color, hasActiveHighlight ? 0.66 : 0.38);
      }

      return withAlpha(color, 0.3);
    },
    [getLinkVisual, hasActiveHighlight]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      graphRef.current?.d3ReheatSimulation();
      graphRef.current?.zoomToFit(650, 90);
    }, 140);

    return () => window.clearTimeout(timer);
  }, [graphData]);

  useEffect(() => {
    const chargeForce = graphRef.current?.d3Force("charge") as { strength?: (value: number) => void } | undefined;
    const linkForce = graphRef.current?.d3Force("link") as {
      distance?: (value: number | ((link: ForceNetworkLink) => number)) => void;
      strength?: (value: number) => void;
    } | undefined;

    chargeForce?.strength?.(isLocalFocusActive ? -280 : -170);
    linkForce?.distance?.(isLocalFocusActive ? 118 : 150);
    linkForce?.strength?.(isLocalFocusActive ? 0.58 : 0.42);
    graphRef.current?.d3ReheatSimulation();
  }, [graphData.links.length, graphData.nodes.length, isLocalFocusActive]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-3 text-slate-100 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {researchAssetTypes.map((item) => (
              <span key={item.value} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">
                <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_14px_currentColor]" style={{ backgroundColor: assetTypeColors[item.value], color: assetTypeColors[item.value] }} />
                {item.label}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleFit}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-400/15 px-3 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-400/25"
            >
              <Maximize2 size={15} />
              适配画布
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.12]"
            >
              <RotateCcw size={15} />
              重置视图
            </button>
          </div>
        </div>

        {relationCounts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {relationCounts.map((item) => (
              <span key={item.value} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">
                <span className="h-1.5 w-7 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}：{item.count}
              </span>
            ))}
          </div>
        ) : null}

        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_18%_15%,rgba(96,165,250,0.2),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(52,211,153,0.14),transparent_24%),radial-gradient(circle_at_48%_84%,rgba(251,113,133,0.12),transparent_32%),linear-gradient(135deg,#020617,#0f172a_52%,#111827)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_80px_rgba(2,6,23,0.42)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.045)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(2,6,23,0.5)_80%)]" />
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={width}
            height={height}
            backgroundColor="rgba(2, 6, 23, 0)"
            nodeId="id"
            nodeVal={(node) => node.nodeSize}
            nodeLabel={(node) => `${escapeHtml(node.title)}${node.metadata ? `<br/>${escapeHtml(node.metadata)}` : ""}<br/>度数：${node.degree}`}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={drawNodePointerArea}
            nodeRelSize={1}
            linkSource="source"
            linkTarget="target"
            linkColor={getLinkColor}
            linkWidth={(link) => {
              const visual = getLinkVisual(link);

              if (visual.isDimmed) {
                return 0.45;
              }

              if (visual.isSelected || visual.isHovered) {
                return 2.8;
              }

              return visual.isHighlighted && hasActiveHighlight ? 1.7 : 1.05;
            }}
            linkCurvature={(link) => relationTypeCurves[link.relationType] ?? 0.03}
            linkLineDash={(link) => {
              if (link.relationType === "derived_from") {
                return [6, 5];
              }

              if (link.relationType === "references") {
                return [2, 5];
              }

              return null;
            }}
            linkDirectionalArrowLength={(link) => {
              const visual = getLinkVisual(link);
              return visual.isDimmed ? 2.5 : visual.isSelected || visual.isHovered ? 6 : 4;
            }}
            linkDirectionalArrowColor={getLinkColor}
            linkDirectionalArrowRelPos={0.68}
            linkDirectionalParticles={(link) => {
              const visual = getLinkVisual(link);

              if (visual.isSelected || visual.isHovered) {
                return 2;
              }

              return visual.isHighlighted && hasActiveHighlight ? 1 : 0;
            }}
            linkDirectionalParticleSpeed={(link) => (link.relationType === "derived_from" ? 0.004 : 0.006)}
            linkDirectionalParticleWidth={(link) => {
              const visual = getLinkVisual(link);
              return visual.isSelected || visual.isHovered ? 3 : 2;
            }}
            linkDirectionalParticleColor={getLinkColor}
            linkLabel={(link) => `${escapeHtml(link.relationLabel)}${link.note ? `<br/>${escapeHtml(link.note)}` : ""}`}
            linkHoverPrecision={9}
            autoPauseRedraw={false}
            enableNodeDrag
            enablePanInteraction
            enableZoomInteraction
            showPointerCursor={(item) => Boolean(item)}
            cooldownTicks={140}
            onNodeClick={(node) => {
              setSelectedItem({ type: "node", node });
              centerNode(node.id);
            }}
            onNodeHover={(node) => setHoveredNodeId(node?.id ?? null)}
            onLinkClick={(link) => setSelectedItem({ type: "link", link })}
            onLinkHover={(link) => setHoveredLinkId(link?.id ?? null)}
            onBackgroundClick={() => {
              setSelectedItem(null);
              setHoveredNodeId(null);
              setHoveredLinkId(null);
            }}
          />
        </div>
      </div>

      <SelectedNetworkDetail
        selectedItem={selectedItem}
        nodeById={nodeById}
        graphData={graphData}
        focusNodeId={focusNodeId}
        isLocalFocusActive={isLocalFocusActive}
        onFocusNodeChange={onFocusNodeChange}
        onCenterNode={centerNode}
      />
    </div>
  );
}

function SelectedNetworkDetail({
  selectedItem,
  nodeById,
  graphData,
  focusNodeId,
  isLocalFocusActive,
  onFocusNodeChange,
  onCenterNode
}: {
  selectedItem: SelectedNetworkItem | null;
  nodeById: Record<string, AssetNetworkNode>;
  graphData: ForceNetworkGraphData;
  focusNodeId: string | null;
  isLocalFocusActive: boolean;
  onFocusNodeChange: (nodeId: string | null) => void;
  onCenterNode: (nodeId: string) => void;
}) {
  if (!selectedItem) {
    return (
      <aside className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-slate-200">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Crosshair size={16} className="text-blue-300" />
          详情面板
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          点击节点查看类型、度数、一度邻居和 inbound / outbound 关系；点击关系线查看 source、relation_type、target 和备注。
        </p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-xs leading-5 text-slate-400">
          图谱只读。创建、编辑和删除关系仍在各资产详情页的显式关联资产区域完成。
        </div>
      </aside>
    );
  }

  if (selectedItem.type === "node") {
    return (
      <SelectedNodeDetail
        node={selectedItem.node}
        graphData={graphData}
        nodeById={nodeById}
        isLocalFocusActive={isLocalFocusActive}
        onFocusNodeChange={onFocusNodeChange}
        onCenterNode={onCenterNode}
      />
    );
  }

  return (
    <SelectedLinkDetail
      link={selectedItem.link}
      nodeById={nodeById}
      focusNodeId={focusNodeId}
    />
  );
}

function SelectedNodeDetail({
  node,
  graphData,
  nodeById,
  isLocalFocusActive,
  onFocusNodeChange,
  onCenterNode
}: {
  node: ForceNetworkNode;
  graphData: ForceNetworkGraphData;
  nodeById: Record<string, AssetNetworkNode>;
  isLocalFocusActive: boolean;
  onFocusNodeChange: (nodeId: string | null) => void;
  onCenterNode: (nodeId: string) => void;
}) {
  const relatedLinks = graphData.links.filter((link) => {
    const { sourceId, targetId } = getLinkEndpointIds(link);
    return sourceId === node.id || targetId === node.id;
  });
  const outboundLinks = relatedLinks.filter((link) => getLinkEndpointIds(link).sourceId === node.id);
  const inboundLinks = relatedLinks.filter((link) => getLinkEndpointIds(link).targetId === node.id);
  const neighborCount = new Set(
    relatedLinks.map((link) => {
      const { sourceId, targetId } = getLinkEndpointIds(link);
      return sourceId === node.id ? targetId : sourceId;
    })
  ).size;

  return (
    <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-white/10 text-slate-100 ring-white/15">
          {getResearchAssetTypeLabel(node.assetType)}
        </Badge>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-slate-300">
          一度邻居 {neighborCount}
        </span>
      </div>
      <h3 className="mt-3 break-words text-base font-semibold leading-6 text-white">{node.title}</h3>
      {node.metadata ? <p className="mt-2 text-sm leading-6 text-slate-300">{node.metadata}</p> : null}

      <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
        <DetailMetric label="度数" value={node.degree} />
        <DetailMetric label="入度" value={node.inboundCount} />
        <DetailMetric label="出度" value={node.outboundCount} />
        <DetailMetric label="邻居" value={neighborCount} />
      </dl>

      <div className="mt-4 grid gap-2">
        <Link href={node.href} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-400/15 px-3 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-400/25">
          打开详情页
          <ArrowRight size={15} />
        </Link>
        <button
          type="button"
          onClick={() => onCenterNode(node.id)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.12]"
        >
          <LocateFixed size={15} />
          居中当前节点
        </button>
        {isLocalFocusActive ? (
          <button
            type="button"
            onClick={() => onFocusNodeChange(null)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-400/30 bg-slate-400/10 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-400/20"
          >
            恢复全局网络
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onFocusNodeChange(node.id)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-400/15 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/25"
          >
            <GitBranch size={15} />
            只看该节点网络
          </button>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <RelationGroup
          title="当前资产关联出去"
          links={outboundLinks}
          nodeId={node.id}
          nodeById={nodeById}
          direction="outbound"
        />
        <RelationGroup
          title="反向关系"
          links={inboundLinks}
          nodeId={node.id}
          nodeById={nodeById}
          direction="inbound"
        />
      </div>
    </aside>
  );
}

function SelectedLinkDetail({
  link,
  nodeById,
  focusNodeId
}: {
  link: ForceNetworkLink;
  nodeById: Record<string, AssetNetworkNode>;
  focusNodeId: string | null;
}) {
  const { sourceId, targetId } = getLinkEndpointIds(link);
  const source = nodeById[sourceId];
  const target = nodeById[targetId];

  return (
    <aside className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-slate-200">
      <Badge className="bg-white/10 text-slate-100 ring-white/15">
        {getResearchAssetRelationTypeLabel(link.relationType)}
      </Badge>
      <div className="mt-4 space-y-3">
        <DetailEndpoint
          label="来源"
          node={source}
          fallbackTitle={getLinkEndpointTitle(nodeById, sourceId)}
          isCurrent={focusNodeId === sourceId}
        />
        <DetailEndpoint
          label="目标"
          node={target}
          fallbackTitle={getLinkEndpointTitle(nodeById, targetId)}
          isCurrent={focusNodeId === targetId}
        />
      </div>

      {link.note ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/45 p-3">
          <p className="text-xs font-semibold text-slate-400">备注</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-200">{link.note}</p>
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-slate-400">更新：{formatDateTime(link.updatedAt)}</p>

      <div className="mt-4 grid gap-2">
        <Link href={source?.href ?? "#"} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.12]">
          打开来源
          <ArrowRight size={15} />
        </Link>
        <Link href={target?.href ?? "#"} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-300/30 bg-blue-400/15 px-3 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-400/25">
          打开目标
          <ArrowRight size={15} />
        </Link>
      </div>
    </aside>
  );
}

function RelationGroup({
  title,
  links,
  nodeId,
  nodeById,
  direction
}: {
  title: string;
  links: ForceNetworkLink[];
  nodeId: string;
  nodeById: Record<string, AssetNetworkNode>;
  direction: "outbound" | "inbound";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
      <p className="text-xs font-semibold text-slate-300">{title}</p>
      {links.length === 0 ? (
        <p className="mt-2 text-xs leading-5 text-slate-500">当前筛选范围内暂无关系。</p>
      ) : (
        <div className="mt-3 space-y-2">
          {links.map((link) => {
            const { sourceId, targetId } = getLinkEndpointIds(link);
            const otherNodeId = direction === "outbound" ? targetId : sourceId;
            const otherNode = nodeById[otherNodeId];

            return (
              <Link
                key={link.id}
                href={otherNode?.href ?? "#"}
                className="block rounded-2xl border border-white/10 bg-white/[0.04] p-3 hover:bg-white/[0.08]"
              >
                <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-slate-950" style={{ backgroundColor: relationTypeColors[link.relationType] }}>
                  {link.relationLabel}
                </span>
                <p className="mt-2 break-words text-sm font-semibold leading-5 text-slate-100">
                  {otherNode?.title ?? getLinkEndpointTitle(nodeById, otherNodeId)}
                </p>
                {otherNode?.metadata ? <p className="mt-1 text-xs leading-5 text-slate-400">{otherNode.metadata}</p> : null}
                {direction === "inbound" ? <p className="mt-1 text-xs text-slate-500">来自该资产</p> : null}
                {nodeId === otherNodeId ? <span className="sr-only">自关联已被数据库约束禁止</span> : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-2 py-3">
      <dt className="text-xs font-medium text-slate-400">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-white">{value}</dd>
    </div>
  );
}

function DetailEndpoint({
  label,
  node,
  fallbackTitle,
  isCurrent
}: {
  label: string;
  node: AssetNetworkNode | undefined;
  fallbackTitle: string;
  isCurrent: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        {isCurrent ? <span className="rounded-full bg-blue-400/15 px-2 py-0.5 text-xs font-semibold text-blue-100">当前聚焦</span> : null}
      </div>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-white">{node?.title ?? fallbackTitle}</p>
      {node ? (
        <p className="mt-1 text-xs leading-5 text-slate-400">
          {getResearchAssetTypeLabel(node.assetType)}
          {node.metadata ? ` · ${node.metadata}` : ""}
        </p>
      ) : null}
    </div>
  );
}
