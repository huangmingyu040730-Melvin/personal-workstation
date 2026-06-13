import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";
import { Badge } from "@/components/badge";
import { getResearchAssetTypeLabel, researchAssetTypes } from "@/lib/content-options";
import type { AssetNetworkNode } from "@/lib/queries/asset-network";

export type AssetNetworkNodeDegree = {
  outbound: number;
  inbound: number;
};

type AssetNetworkNodeGroupsProps = {
  nodes: AssetNetworkNode[];
  degrees: Record<string, AssetNetworkNodeDegree>;
};

export function AssetNetworkNodeGroups({ nodes, degrees }: AssetNetworkNodeGroupsProps) {
  return (
    <div className="space-y-5">
      {researchAssetTypes.map((type) => {
        const groupNodes = nodes.filter((node) => node.assetType === type.value);

        if (groupNodes.length === 0) {
          return null;
        }

        return (
          <section key={type.value}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">{type.label}</h3>
              <span className="text-xs font-medium text-slate-400">{groupNodes.length}</span>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {groupNodes.map((node) => (
                <AssetNetworkNodeCard key={node.id} node={node} degree={degrees[node.id] ?? { outbound: 0, inbound: 0 }} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AssetNetworkNodeCard({
  node,
  degree
}: {
  node: AssetNetworkNode;
  degree: AssetNetworkNodeDegree;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Badge className="bg-white text-slate-700 ring-slate-200">
            {getResearchAssetTypeLabel(node.assetType)}
          </Badge>
          <Link href={node.href} className="mt-3 flex items-start gap-2 text-sm font-semibold leading-6 text-slate-950 hover:text-blue-700">
            <Link2 className="mt-1 shrink-0 text-blue-700" size={15} />
            <span className="break-words">{node.title}</span>
          </Link>
          {node.metadata ? <p className="mt-2 text-xs leading-5 text-slate-500">{node.metadata}</p> : null}
          <p className="mt-3 text-xs font-medium text-slate-500">
            出度 {degree.outbound} · 入度 {degree.inbound}
          </p>
        </div>
        <Link href={node.href} className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
          打开详情
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
