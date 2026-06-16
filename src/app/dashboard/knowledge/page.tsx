import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { AdminEmptyState, AdminPageSurface, AdminSection } from "@/components/admin-ui";
import { AppShell } from "@/components/app-shell";
import { VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PublicContentGuidance } from "@/components/dashboard/public-content-guidance";
import { PageHeader } from "@/components/page-header";
import { assetModelDefinitions } from "@/lib/asset-model";
import { knowledgeCategories } from "@/lib/content-options";
import { formatRelative } from "@/lib/format";
import { getKnowledgeNotes } from "@/lib/queries/knowledge";

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const q = params.q ?? "";
  const notes = await getKnowledgeNotes({ category, q });

  return (
    <AppShell>
      <AdminPageSurface>
      <PageHeader
        eyebrow="Knowledge Base"
        title="知识库"
        description={assetModelDefinitions.knowledge.definition}
        action={<Link href="/dashboard/knowledge/new" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800"><Plus size={16} />新建笔记</Link>}
      />
      <PublicContentGuidance />
      <AdminSection>
      <form className="grid gap-3 md:grid-cols-[0.45fr_1fr_auto]">
        <select name="category" defaultValue={category} className="h-10 min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100">
          <option value="all">全部分类</option>
          {knowledgeCategories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input name="q" defaultValue={q} placeholder="搜索标题、摘要或正文..." className="h-10 min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100" />
        <button className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">筛选</button>
      </form>
      </AdminSection>
      <Card>
        <CardHeader title="笔记列表" description="默认按最近更新时间排序" />
        {notes.length === 0 ? (
          <AdminEmptyState title="还没有知识笔记" description={assetModelDefinitions.knowledge.emptyStateDescription} action={<Link href="/dashboard/knowledge/new" className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建笔记</Link>} />
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Link key={note.id} href={`/dashboard/knowledge/${note.id}`} className="admin-card-motion flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <BookOpen className="mt-1 shrink-0 text-emerald-600" size={18} />
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-medium text-slate-900 [overflow-wrap:anywhere]">{note.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500 [overflow-wrap:anywhere]">{note.category} · {formatRelative(note.updated_at)}</p>
                    {note.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">{note.excerpt}</p> : null}
                  </div>
                </div>
                <span className="shrink-0 self-start"><VisibilityBadge visibility={note.visibility} /></span>
              </Link>
            ))}
          </div>
        )}
      </Card>
      </AdminPageSurface>
    </AppShell>
  );
}
