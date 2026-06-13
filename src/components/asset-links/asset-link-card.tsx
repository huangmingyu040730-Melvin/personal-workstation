import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";
import { deleteAssetLinkAction } from "@/actions/asset-links";
import { Badge } from "@/components/badge";
import { DeleteButton } from "@/components/forms/submit-button";
import { getResearchAssetRelationTypeLabel, getResearchAssetTypeLabel } from "@/lib/content-options";
import { formatDateTime } from "@/lib/format";
import type { ResolvedAssetLink } from "@/lib/queries/asset-links";

type AssetLinkCardProps = {
  link: ResolvedAssetLink;
  returnTo: string;
};

export function AssetLinkCard({ link, returnTo }: AssetLinkCardProps) {
  const directionText = link.direction === "outbound" ? "当前资产关联出去" : "对方资产关联当前资产";

  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white text-slate-700 ring-slate-200">
              {getResearchAssetTypeLabel(link.other.type)}
            </Badge>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {getResearchAssetRelationTypeLabel(link.relation_type)}
            </span>
          </div>
          <Link href={link.other.href} className="mt-3 flex items-start gap-2 text-base font-semibold text-slate-950 hover:text-blue-700">
            <Link2 className="mt-1 shrink-0 text-blue-700" size={16} />
            <span className="break-words">{link.other.title}</span>
          </Link>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {directionText}
            {link.other.metadata ? ` · ${link.other.metadata}` : ""}
            {" · "}
            更新：{formatDateTime(link.updated_at)}
          </p>
          {link.note ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{link.note}</p> : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={link.other.href} className="inline-flex items-center gap-1 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100">
            打开
            <ArrowRight size={14} />
          </Link>
          <form action={deleteAssetLinkAction}>
            <input type="hidden" name="link_id" value={link.id} />
            <input type="hidden" name="return_to" value={returnTo} />
            <DeleteButton label="删除关系" />
          </form>
        </div>
      </div>
    </article>
  );
}
