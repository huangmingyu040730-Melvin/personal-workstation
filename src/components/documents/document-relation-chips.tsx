import Link from "next/link";
import { getDocumentRelatedTypeLabel } from "@/lib/content-options";
import type { DocumentAssetLinkSummary } from "@/lib/content-types";

export function DocumentRelationChips({
  relations,
  emptyLabel = "未关联",
  compact = false
}: {
  relations: DocumentAssetLinkSummary[];
  emptyLabel?: string;
  compact?: boolean;
}) {
  if (relations.length === 0) {
    return <span className="text-slate-400">{emptyLabel}</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {relations.map((relation) => (
        <Link
          key={relation.id}
          href={relation.href}
          title={relation.note ?? undefined}
          className={[
            "inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50 font-medium text-blue-800 hover:border-blue-200 hover:bg-blue-100",
            compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
          ].join(" ")}
        >
          <span className="shrink-0 text-blue-500">{getDocumentRelatedTypeLabel(relation.asset_type)}</span>
          <span className="truncate">{relation.title}</span>
          <span className="shrink-0 text-blue-400">· {relation.relation_label}</span>
        </Link>
      ))}
    </div>
  );
}
