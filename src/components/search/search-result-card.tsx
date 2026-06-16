import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/badge";
import { HighlightedText } from "@/components/search/highlighted-text";
import type { WorkspaceSearchItem } from "@/lib/queries/search";
import { formatRelative } from "@/lib/format";

export function SearchResultCard({ item, query }: { item: WorkspaceSearchItem; query: string }) {
  return (
    <Link
      href={item.href}
      className="admin-card-motion group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-blue-50 text-blue-700 ring-blue-100">{item.typeLabel}</Badge>
          </div>
          <h3 className="line-clamp-2 text-base font-semibold text-slate-950 [overflow-wrap:anywhere] group-hover:text-blue-800">
            <HighlightedText text={item.title} query={query} />
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
            <HighlightedText text={item.description} query={query} />
          </p>
        </div>
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition group-hover:border-blue-200 group-hover:text-blue-700">
          <ArrowUpRight size={16} />
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.metadata.map((value, index) => (
          <span key={`${value}-${index}`} className="max-w-full rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium leading-5 text-slate-600 [overflow-wrap:anywhere]">
            {value}
          </span>
        ))}
        {item.updatedAt ? (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            更新于 {formatRelative(item.updatedAt)}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
