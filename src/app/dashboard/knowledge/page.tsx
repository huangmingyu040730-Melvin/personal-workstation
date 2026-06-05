import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { VisibilityBadge } from "@/components/badge";
import { Card, CardHeader } from "@/components/card";
import { PublicContentGuidance } from "@/components/dashboard/public-content-guidance";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        eyebrow="Knowledge Base"
        title="知识库"
        description="从 Supabase 读取真实笔记，沉淀研究、工具方法与会议知识。"
        action={<Link href="/dashboard/knowledge/new" className="inline-flex items-center gap-2 rounded-2xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"><Plus size={16} />新建笔记</Link>}
      />
      <PublicContentGuidance />
      <form className="mb-5 grid gap-3 md:grid-cols-[0.45fr_1fr_auto]">
        <select name="category" defaultValue={category} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm">
          <option value="all">全部分类</option>
          {knowledgeCategories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input name="q" defaultValue={q} placeholder="搜索标题、摘要或正文..." className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300" />
        <button className="rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:text-blue-700">筛选</button>
      </form>
      <Card>
        <CardHeader title="笔记列表" description="默认按最近更新时间排序" />
        {notes.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-6 text-center">
            <p className="font-semibold text-slate-900">还没有知识笔记</p>
            <p className="mt-2 text-sm text-slate-500">创建第一条笔记后，Dashboard 会展示最近更新。</p>
            <Link href="/dashboard/knowledge/new" className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">新建笔记</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <Link key={note.id} href={`/dashboard/knowledge/${note.id}`} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 transition hover:bg-blue-50">
                <div className="flex gap-3">
                  <BookOpen className="mt-1 text-emerald-600" size={18} />
                  <div>
                    <p className="font-medium text-slate-900">{note.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{note.category} · {formatRelative(note.updated_at)}</p>
                    {note.excerpt ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{note.excerpt}</p> : null}
                  </div>
                </div>
                <VisibilityBadge visibility={note.visibility} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
