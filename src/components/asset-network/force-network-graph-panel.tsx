"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject
} from "react-force-graph-2d";
import { ArrowRight, Crosshair, Maximize2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/badge";
import { getResearchAssetRelationTypeLabel, getResearchAssetTypeLabel, researchAssetRelationTypes } from "@/lib/content-options";
import { formatDateTime } from "@/lib/format";
import type { AssetNetworkNode } from "@/lib/queries/asset-network";
import type { ForceNetworkGraphData, ForceNetworkLink, ForceNetworkNode } from "./force-network-graph";

type ForceNetworkGraphPanelProps = {
  graphData: ForceNetworkGraphData;
  nodeById: Record<string, AssetNetworkNode>;
};

type SelectedNetworkItem =
  | { type: "node"; node: ForceNetworkNode }
  | { type: "link"; link: ForceNetworkLink };

const relationTypeColors: Record<ForceNetworkLink["relationType"], string> = {
  related: "rgba(100, 116, 139, 0.54)",
  supports: "rgba(37, 99, 235, 0.62)",
  references: "rgba(124, 58, 237, 0.58)",
  uses: "rgba(217, 119, 6, 0.62)",
  produces: "rgba(5, 150, 105, 0.62)",
  derived_from: "rgba(190, 18, 60, 0.58)"
};

function getNodeId(node: string | number | NodeObject<ForceNetworkNode> | ForceNetworkNode | undefined) {
  if (node && typeof node === "object") {
    return String(node.id ?? "");
  }

  return String(node ?? "");
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
  if (width < 520) {
    return 500;
  }

  if (width < 900) {
    return 580;
  }

  return 680;
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

function drawNode(node: NodeObject<ForceNetworkNode>, ctx: CanvasRenderingContext2D, globalScale: number) {
  const radius = node.nodeSize ?? 10;
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const label = truncateCanvasLabel(node.title ?? "未命名资产", globalScale < 1.1 ? 18 : 26);
  const fontSize = Math.max(10 / globalScale, 3.5);

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = node.nodeColor ?? "#2563eb";
  ctx.shadowColor = "rgba(15, 23, 42, 0.2)";
  ctx.shadowBlur = 8 / globalScale;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2 / globalScale;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.stroke();

  if (globalScale > 0.55) {
    ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const textWidth = ctx.measureText(label).width;
    const textPadding = 4 / globalScale;
    const textHeight = fontSize + 4 / globalScale;
    const textY = y + radius + 4 / globalScale;

    ctx.fillStyle = "rgba(255, 255, 255, 0.86)";
    ctx.fillRect(x - textWidth / 2 - textPadding, textY - 1 / globalScale, textWidth + textPadding * 2, textHeight);
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.fillText(label, x, textY);
  }

  ctx.restore();
}

function drawNodePointerArea(
  node: NodeObject<ForceNetworkNode>,
  color: string,
  ctx: CanvasRenderingContext2D
) {
  const radius = (node.nodeSize ?? 10) + 8;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI, false);
  ctx.fill();
}

function getLinkColor(link: LinkObject<ForceNetworkNode, ForceNetworkLink>) {
  return relationTypeColors[link.relationType] ?? "rgba(100, 116, 139, 0.52)";
}

export function ForceNetworkGraphPanel({
  graphData,
  nodeById
}: ForceNetworkGraphPanelProps) {
  const graphRef = useRef<ForceGraphMethods<ForceNetworkNode, ForceNetworkLink> | undefined>(undefined);
  const { ref: containerRef, width } = useContainerWidth();
  const [selectedItem, setSelectedItem] = useState<SelectedNetworkItem | null>(null);
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null);
  const height = getGraphHeight(width);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSelectedItem(null);
      setHoveredLinkId(null);
      graphRef.current?.d3ReheatSimulation();
      graphRef.current?.zoomToFit(650, 70);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [graphData]);

  const handleFit = () => {
    graphRef.current?.zoomToFit(650, 70);
  };

  const handleReset = () => {
    graphRef.current?.d3ReheatSimulation();
    graphRef.current?.centerAt(0, 0, 500);
    graphRef.current?.zoom(1, 500);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {relationCounts.map((item) => (
              <span key={item.value} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}：{item.count}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleFit}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Maximize2 size={15} />
              适配画布
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700"
            >
              <RotateCcw size={15} />
              重置视图
            </button>
          </div>
        </div>

        <div ref={containerRef} className="overflow-hidden rounded-2xl border border-slate-100 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_32%),linear-gradient(180deg,#f8fafc,#ffffff)]">
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={width}
            height={height}
            backgroundColor="rgba(248, 250, 252, 0)"
            nodeId="id"
            nodeVal={(node) => node.nodeSize}
            nodeLabel={(node) => `${escapeHtml(node.title)}${node.metadata ? `<br/>${escapeHtml(node.metadata)}` : ""}<br/>度数：${node.degree}`}
            nodeCanvasObject={drawNode}
            nodePointerAreaPaint={drawNodePointerArea}
            linkSource="source"
            linkTarget="target"
            linkColor={getLinkColor}
            linkWidth={(link) => (hoveredLinkId === link.id ? 3.2 : 1.25 + Math.min(1.5, Math.max(0, link.relationLabel.length - 2) * 0.08))}
            linkLineDash={(link) => (link.relationType === "derived_from" ? [5, 4] : null)}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={0.62}
            linkLabel={(link) => `${escapeHtml(link.relationLabel)}${link.note ? `<br/>${escapeHtml(link.note)}` : ""}`}
            linkHoverPrecision={8}
            enableNodeDrag
            enablePanInteraction
            enableZoomInteraction
            showPointerCursor={(item) => Boolean(item)}
            cooldownTicks={120}
            onNodeClick={(node) => setSelectedItem({ type: "node", node })}
            onLinkClick={(link) => setSelectedItem({ type: "link", link })}
            onLinkHover={(link) => setHoveredLinkId(link?.id ?? null)}
            onBackgroundClick={() => setSelectedItem(null)}
          />
        </div>
      </div>

      <SelectedNetworkDetail
        selectedItem={selectedItem}
        nodeById={nodeById}
      />
    </div>
  );
}

function SelectedNetworkDetail({
  selectedItem,
  nodeById
}: {
  selectedItem: SelectedNetworkItem | null;
  nodeById: Record<string, AssetNetworkNode>;
}) {
  if (!selectedItem) {
    return (
      <aside className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Crosshair size={16} className="text-blue-700" />
          详情面板
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          点击节点查看资产详情，点击关系线查看 source、relation_type、target 和备注。关系维护仍在资产详情页完成。
        </p>
      </aside>
    );
  }

  if (selectedItem.type === "node") {
    return <SelectedNodeDetail node={selectedItem.node} />;
  }

  return <SelectedLinkDetail link={selectedItem.link} nodeById={nodeById} />;
}

function SelectedNodeDetail({ node }: { node: ForceNetworkNode }) {
  return (
    <aside className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <Badge className="bg-white text-slate-700 ring-slate-200">
        {getResearchAssetTypeLabel(node.assetType)}
      </Badge>
      <h3 className="mt-3 break-words text-base font-semibold leading-6 text-slate-950">{node.title}</h3>
      {node.metadata ? <p className="mt-2 text-sm leading-6 text-slate-500">{node.metadata}</p> : null}

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <DetailMetric label="度数" value={node.degree} />
        <DetailMetric label="入度" value={node.inboundCount} />
        <DetailMetric label="出度" value={node.outboundCount} />
      </dl>

      <Link href={node.href} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
        打开详情页
        <ArrowRight size={15} />
      </Link>
    </aside>
  );
}

function SelectedLinkDetail({
  link,
  nodeById
}: {
  link: ForceNetworkLink;
  nodeById: Record<string, AssetNetworkNode>;
}) {
  const sourceNodeId = getNodeId(link.source) || link.sourceNodeId;
  const targetNodeId = getNodeId(link.target) || link.targetNodeId;
  const source = nodeById[sourceNodeId];
  const target = nodeById[targetNodeId];

  return (
    <aside className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <Badge className="bg-white text-slate-700 ring-slate-200">
        {getResearchAssetRelationTypeLabel(link.relationType)}
      </Badge>
      <div className="mt-4 space-y-3">
        <DetailEndpoint label="来源" node={source} fallbackTitle={getLinkEndpointTitle(nodeById, sourceNodeId)} />
        <DetailEndpoint label="目标" node={target} fallbackTitle={getLinkEndpointTitle(nodeById, targetNodeId)} />
      </div>

      {link.note ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-500">备注</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{link.note}</p>
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-5 text-slate-500">更新：{formatDateTime(link.updatedAt)}</p>

      <div className="mt-4 grid gap-2">
        <Link href={source?.href ?? "#"} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
          打开来源
          <ArrowRight size={15} />
        </Link>
        <Link href={target?.href ?? "#"} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
          打开目标
          <ArrowRight size={15} />
        </Link>
      </div>
    </aside>
  );
}

function DetailMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-2 py-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function DetailEndpoint({
  label,
  node,
  fallbackTitle
}: {
  label: string;
  node: AssetNetworkNode | undefined;
  fallbackTitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-950">{node?.title ?? fallbackTitle}</p>
      {node ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {getResearchAssetTypeLabel(node.assetType)}
          {node.metadata ? ` · ${node.metadata}` : ""}
        </p>
      ) : null}
    </div>
  );
}
