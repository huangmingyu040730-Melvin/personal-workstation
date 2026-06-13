import { getResearchAssetRelationTypeLabel } from "@/lib/content-options";
import type { ResearchAssetRelationType } from "@/lib/content-types";

type RelationCount = {
  relationType: ResearchAssetRelationType;
  count: number;
};

type AssetLinkSummaryProps = {
  total: number;
  outbound: number;
  inbound: number;
  filtered: number;
  relationCounts: RelationCount[];
};

export function AssetLinkSummary({
  total,
  outbound,
  inbound,
  filtered,
  relationCounts
}: AssetLinkSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <SummaryMetric label="总关系" value={total} />
        <SummaryMetric label="关联出去" value={outbound} />
        <SummaryMetric label="反向关系" value={inbound} />
        <SummaryMetric label="当前筛选" value={filtered} />
      </div>

      {relationCounts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {relationCounts.map((item) => (
            <span
              key={item.relationType}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
            >
              {getResearchAssetRelationTypeLabel(item.relationType)}：{item.count}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
