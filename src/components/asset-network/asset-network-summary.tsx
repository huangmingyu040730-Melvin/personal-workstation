import { researchAssetRelationTypes, researchAssetTypes } from "@/lib/content-options";
import type { AssetNetworkGraph } from "@/lib/queries/asset-network";

type AssetNetworkSummaryProps = {
  graph: AssetNetworkGraph;
  visibleNodeCount: number;
  visibleEdgeCount: number;
};

export function AssetNetworkSummary({
  graph,
  visibleNodeCount,
  visibleEdgeCount
}: AssetNetworkSummaryProps) {
  const nodeCounts = researchAssetTypes.map((item) => ({
    label: item.label,
    value: graph.nodes.filter((node) => node.assetType === item.value).length
  }));
  const relationCounts = researchAssetRelationTypes
    .map((item) => ({
      label: item.label,
      value: graph.edges.filter((edge) => edge.relationType === item.value).length
    }))
    .filter((item) => item.value > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="节点总数" value={graph.nodes.length} />
        <SummaryMetric label="关系总数" value={graph.edges.length} />
        <SummaryMetric label="当前节点" value={visibleNodeCount} />
        <SummaryMetric label="当前关系" value={visibleEdgeCount} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SummaryGroup title="资产类型分布" items={nodeCounts} />
        <SummaryGroup title="关系类型分布" items={relationCounts.length > 0 ? relationCounts : [{ label: "暂无关系", value: 0 }]} />
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SummaryGroup({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item.label} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {item.label}：{item.value}
          </span>
        ))}
      </div>
    </div>
  );
}
