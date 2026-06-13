import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/badge";
import { getResearchAssetTypeLabel } from "@/lib/content-options";
import { formatDateTime } from "@/lib/format";
import type { AssetNetworkEdge, AssetNetworkNode } from "@/lib/queries/asset-network";

type AssetNetworkEdgeListProps = {
  edges: AssetNetworkEdge[];
  nodeById: Record<string, AssetNetworkNode>;
};

export function AssetNetworkEdgeList({ edges, nodeById }: AssetNetworkEdgeListProps) {
  return (
    <div className="space-y-3">
      {edges.map((edge) => {
        const source = nodeById[edge.sourceNodeId];
        const target = nodeById[edge.targetNodeId];

        return (
          <article key={edge.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm leading-6">
                  <AssetLinkEndpoint node={source} fallbackType={edge.sourceType} fallbackId={edge.sourceId} />
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {edge.relationLabel}
                  </span>
                  <ArrowRight className="text-slate-400" size={15} />
                  <AssetLinkEndpoint node={target} fallbackType={edge.targetType} fallbackId={edge.targetId} />
                </div>
                {edge.note ? <p className="whitespace-pre-line text-sm leading-6 text-slate-600">{edge.note}</p> : null}
                <p className="text-xs leading-5 text-slate-500">更新：{formatDateTime(edge.updatedAt)}</p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Link href={source?.href ?? "#"} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-200 hover:text-blue-700">
                  打开来源
                </Link>
                <Link href={target?.href ?? "#"} className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                  打开目标
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AssetLinkEndpoint({
  node,
  fallbackType,
  fallbackId
}: {
  node: AssetNetworkNode | undefined;
  fallbackType: AssetNetworkEdge["sourceType"];
  fallbackId: string;
}) {
  const title = node?.title ?? "已删除或无法读取的资产";
  const href = node?.href ?? "#";

  return (
    <Link href={href} className="inline-flex min-w-0 items-center gap-2 rounded-full bg-white px-2.5 py-1 font-semibold text-slate-800 ring-1 ring-slate-200 hover:text-blue-700">
      <Badge className="bg-slate-50 text-slate-600 ring-slate-200">
        {getResearchAssetTypeLabel(node?.assetType ?? fallbackType)}
      </Badge>
      <span className="max-w-xs truncate">{title}</span>
      {!node ? <span className="text-xs text-slate-400">{fallbackId.slice(0, 8)}</span> : null}
    </Link>
  );
}
